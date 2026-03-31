from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import CustomUser
from users.serializers import UserSerializer
from .models import Project
from .serializers import ProjectSerializer
from audit.utils import log_action


LOCKED_PHASES = ['Archive', 'Kickoff', 'Realisation', 'Cloture']


def can_edit_project(user, project):
    """Retourne True si l'utilisateur est autorisé à modifier les métadonnées du projet.
    Seul l'admin peut modifier le projet (client, phase, membres, compétences…).
    """
    return user.role == 'admin'


def is_project_locked(project):
    """Retourne True si le projet est verrouillé (phase archivée ou acceptée)."""
    return project.phase in LOCKED_PHASES


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
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
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