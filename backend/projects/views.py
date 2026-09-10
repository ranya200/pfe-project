from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import CustomUser
from users.serializers import UserSerializer
from .models import Project
from .serializers import ProjectSerializer
from audit.utils import log_action
from notifications.services import notifier, notify_project_team, notify_team_members_added
from notifications.models import Notification

# ⚠️ Adapte ce chemin d'import si ton app clients ne s'appelle pas "clients"
from clients.models import Client


LOCKED_PHASES = ['Archive', 'Kickoff', 'Realisation', 'Cloture']


def can_edit_project(user, project):
    """Retourne True si l'utilisateur est autorisé à modifier les métadonnées du projet.
    Seul l'admin peut modifier le projet (client, phase, membres, compétences…).
    """
    return user.role == 'admin'


def is_project_locked(project):
    """Retourne True si le projet est verrouillé (phase archivée ou acceptée)."""
    return project.phase in LOCKED_PHASES


def ensure_client_exists(client_nom, user, request):
    """
    Garantit qu'un client portant ce nom existe dans le référentiel Clients
    (ISO 9001 — traçabilité du portefeuille client).

    - Recherche insensible à la casse pour éviter les doublons ("SAH" / "sah").
    - Si le client n'existe pas encore, crée une fiche minimale (nom uniquement) ;
      l'admin pourra ensuite la compléter (domaine, email, téléphone, adresse)
      depuis l'onglet Clients.

    Retourne l'instance Client (existante ou nouvellement créée).
    """
    client_nom = (client_nom or '').strip()
    if not client_nom:
        return None

    client_obj, created = Client.objects.get_or_create(
        nom_client__iexact=client_nom,
        defaults={'nom_client': client_nom},
    )

    if created:
        log_action(
            action='CLIENT_AUTO_CREATE',  # ⚠️ ajoute cette valeur aux choices de ton modèle d'audit si la liste est fermée
            user=user,
            model_name='Client',
            object_id=client_obj.pk,
            object_repr=str(client_obj),
            new_values={'nom_client': client_obj.nom_client},
            request=request,
        )

    return client_obj


class UsersByDeptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, dept):
        users = CustomUser.objects.filter(department=dept).exclude(role='admin')
        return Response(UserSerializer(users, many=True).data)


class ProjectViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        if request.user.role == 'admin':
            projects = Project.objects.all().order_by('-created_at')
        else:
            projects = Project.objects.filter(membres=request.user).order_by('-created_at')
        return Response(ProjectSerializer(projects, many=True).data)

    def retrieve(self, request, pk=None):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({"error": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role != 'admin' and not project.membres.filter(pk=request.user.pk).exists():
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        return Response(ProjectSerializer(project).data)

    def create(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            # ── Auto-création du client si nouveau (cf. maquette "ajouter nouveau client ?") ──
            client_nom = serializer.validated_data.get('client', '')
            ensure_client_exists(client_nom, request.user, request)

            project = serializer.save(created_by=request.user)
            log_action(
                action='PROJECT_CREATE',
                user=request.user,
                model_name='Project',
                object_id=project.pk,
                object_repr=str(project),
                new_values={'client': project.client, 'phase': project.phase, 'ref': project.ref_projet},
                request=request,
            )

            # ── Notification : chef de projet + resp qualité de l'équipe ──
            notify_project_team(
                project,
                notification_type=Notification.NotificationType.PROJECT_CREATED,
                title="Nouveau projet créé",
                message=f"Le projet {project.ref_projet} ({project.client}) vient d'être créé et vous a été assigné.",
            )

            # ── Notification (mail + in-app) à TOUS les membres de l'équipe ──
            # (y compris les rôles non couverts par notify_project_team, comme
            # les développeurs, ingénieurs, stagiaires... afin qu'ils soient
            # informés par mail même s'ils n'utilisent pas l'application).
            notify_team_members_added(project, project.membres.all())

            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({"error": "Introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if not can_edit_project(request.user, project):
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        if is_project_locked(project):
            return Response({"error": "Ce projet est verrouillé et ne peut plus être modifié."}, status=status.HTTP_403_FORBIDDEN)
        old_phase = project.phase
        old_member_ids = set(project.membres.values_list('id', flat=True))
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            # ── Si le client est modifié, on s'assure qu'il existe dans le référentiel ──
            if 'client' in serializer.validated_data:
                ensure_client_exists(serializer.validated_data['client'], request.user, request)

            updated = serializer.save()
            log_action(
                action='PROJECT_UPDATE',
                user=request.user,
                model_name='Project',
                object_id=updated.pk,
                object_repr=str(updated),
                old_values={'phase': old_phase},
                new_values={'phase': updated.phase, 'client': updated.client},
                request=request,
            )

            # ── Notification : changement d'étape/phase ──
            if updated.phase != old_phase:
                notify_project_team(
                    updated,
                    notification_type=Notification.NotificationType.STEP_CHANGE,
                    title="Changement d'étape projet",
                    message=f"Le projet {updated.ref_projet} est passé à la phase « {updated.get_phase_display()} ».",
                )

            # ── Notification (mail + in-app) aux NOUVEAUX membres uniquement ──
            if 'membres' in serializer.validated_data:
                new_member_ids = set(updated.membres.values_list('id', flat=True))
                added_member_ids = new_member_ids - old_member_ids
                if added_member_ids:
                    notify_team_members_added(
                        updated,
                        updated.membres.filter(id__in=added_member_ids),
                    )

            return Response(ProjectSerializer(updated).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({"error": "Seul l'administrateur peut supprimer un projet."}, status=status.HTTP_403_FORBIDDEN)
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({"error": "Introuvable."}, status=status.HTTP_404_NOT_FOUND)
        proj_repr = str(project)
        proj_id   = project.pk
        project.delete(deleted_by=request.user)   # soft delete
        log_action(
            action='PROJECT_DELETE',
            user=request.user,
            model_name='Project',
            object_id=proj_id,
            object_repr=proj_repr,
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)