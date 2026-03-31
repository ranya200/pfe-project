from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import RCT, Step1, Step2, Step3, FRPForm, FROForm
from .serializers import RCTSerializer, Step1Serializer, Step2Serializer, Step3Serializer, FRPFormSerializer, FROFormSerializer
from projects.models import Project
from projects.views import LOCKED_PHASES


def _step_is_complete(step, n):
    """Vérifie que tous les champs requis d'une étape sont remplis."""
    if n == 1:
        frp_filled = False
        fro_filled = False
        try:
            frp_filled = bool(step.rct.frp.decision_frp)
        except Exception:
            pass
        try:
            fro_filled = bool(step.rct.fro.decision_fro)
        except Exception:
            pass
        return bool(step.cahier_charges and step.formulaire_interactif and frp_filled and fro_filled)
    if n == 2:
        return bool(
            step.formulaire_qr_final and
            step.exigences_legales and step.exigences_legales.strip() and
            step.offre_tech_financier and step.fiche_revue_offre and
            step.planning and step.cr_reunions
        )
    if n == 3:
        return bool(step.derniere_version_offre and step.planning and step.retour_client)
    return False


class RCTView(APIView):
    """GET pour récupérer le RCT d'un projet, POST pour le créer."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, project_id):
        try:
            project = Project.objects.get(pk=project_id)
            rct = RCT.objects.get(project=project)
            return Response(RCTSerializer(rct, context={'request': request}).data)
        except Project.DoesNotExist:
            return Response({'error': 'Projet introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        except RCT.DoesNotExist:
            return Response(None, status=status.HTTP_204_NO_CONTENT)

    def post(self, request, project_id):
        """Créer un nouveau RCT pour ce projet (admin, chef_projet ou resp_qualite membre)."""
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({'error': 'Projet introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Admin peut toujours créer ; chef_projet/resp_qualite doivent être membres
        user = request.user
        if user.role == 'admin':
            pass  # autorisé
        elif user.role in ['chef_projet', 'resp_qualite']:
            if not project.membres.filter(id=user.id).exists():
                return Response({'error': 'Accès refusé : vous n\'êtes pas membre de ce projet.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

        if RCT.objects.filter(project=project).exists():
            return Response({'error': 'Un RCT existe déjà pour ce projet.'}, status=status.HTTP_400_BAD_REQUEST)

        rct = RCT.objects.create(project=project, created_by=request.user)
        Step1.objects.create(rct=rct)
        Step2.objects.create(rct=rct)
        Step3.objects.create(rct=rct)
        FRPForm.objects.create(rct=rct)
        FROForm.objects.create(rct=rct)

        # Passer la phase du projet en "Offre" dès la création du RCT
        project.phase = 'Offre'
        project.save()

        return Response(RCTSerializer(rct, context={'request': request}).data, status=status.HTTP_201_CREATED)


class RCTStepView(APIView):
    """PATCH pour mettre à jour une étape et avancer / reculer / mettre en pause."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, project_id, step_number):
        try:
            rct = RCT.objects.get(project_id=project_id)
        except RCT.DoesNotExist:
            return Response({'error': 'RCT introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Cloture n'est PAS verrouillée ici : c'est la phase active du step 3
        RCT_STEP_LOCKED = ['Archive', 'Kickoff', 'Realisation']
        if rct.project.phase in RCT_STEP_LOCKED:
            return Response({'error': 'Ce projet est verrouillé et ne peut plus être modifié.'}, status=status.HTTP_403_FORBIDDEN)

        # ── Sélectionner l'étape et son serializer ────────────────────────
        if step_number == 1:
            step = rct.step1
            s    = Step1Serializer(step, data=request.data, partial=True, context={'request': request})
        elif step_number == 2:
            step = rct.step2
            s    = Step2Serializer(step, data=request.data, partial=True, context={'request': request})
        elif step_number == 3:
            step = rct.step3
            s    = Step3Serializer(step, data=request.data, partial=True, context={'request': request})
        else:
            return Response({'error': 'Étape invalide (1, 2 ou 3).'}, status=status.HTTP_400_BAD_REQUEST)

        if s.is_valid():
            s.save()
        else:
            return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

        # ── Gérer la navigation entre étapes ─────────────────────────────
        action = request.data.get('action')  # 'next' | 'prev' | 'pause' | 'finish'
        project = rct.project

        if action == 'next' and step_number < 3:
            # Vérifier que tous les champs requis sont remplis
            if not _step_is_complete(step, step_number):
                return Response(
                    {'error': 'Tous les champs sont obligatoires avant de passer à l\'étape suivante.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            step.completed = True
            step.save()
            rct.current_step = step_number + 1
            rct.status = 'en_cours'
            rct.save()
            # Step 1→2 : phase reste Offre ; Step 2→3 : phase passe à Clôture
            if step_number == 2:
                project.phase = 'Cloture'
                project.save()

        elif action == 'prev' and step_number > 1:
            rct.current_step = step_number - 1
            rct.save()

        elif action == 'pause':
            rct.status = 'pause'
            rct.save()

        elif action == 'finish' and step_number == 3:
            # Vérifier que tous les champs requis sont remplis
            if not _step_is_complete(step, 3):
                return Response(
                    {'error': 'Tous les champs sont obligatoires avant de terminer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            step.completed = True
            step.save()
            rct.status = 'termine'
            rct.save()
            # Mettre à jour la phase selon la décision
            if step.decision == 'acceptee':
                project.phase = 'Kickoff'
            elif step.decision == 'refusee':
                project.phase = 'Archive'
            project.save()

        return Response(RCTSerializer(rct, context={'request': request}).data)


class FRPFormView(APIView):
    """GET/PATCH pour lire et mettre à jour le formulaire FRP d'un projet."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [JSONParser, MultiPartParser, FormParser]

    def _get_frp(self, project_id):
        try:
            rct = RCT.objects.get(project_id=project_id)
            try:
                return rct.frp
            except FRPForm.DoesNotExist:
                return FRPForm.objects.create(rct=rct)
        except RCT.DoesNotExist:
            return None

    def get(self, request, project_id):
        frp = self._get_frp(project_id)
        if frp is None:
            return Response({'error': 'Formulaire FRP introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(FRPFormSerializer(frp).data)

    def patch(self, request, project_id):
        frp = self._get_frp(project_id)
        if frp is None:
            return Response({'error': 'Formulaire FRP introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if frp.rct.project.phase in LOCKED_PHASES:
            return Response({'error': 'Ce projet est verrouillé et ne peut plus être modifié.'}, status=status.HTTP_403_FORBIDDEN)
        s = FRPFormSerializer(frp, data=request.data, partial=True)
        if s.is_valid():
            s.save(updated_by=request.user)
            return Response(s.data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class FROFormView(APIView):
    """GET/PATCH pour lire et mettre à jour le formulaire FRO d'un projet."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [JSONParser, MultiPartParser, FormParser]

    def _get_fro(self, project_id):
        try:
            rct = RCT.objects.get(project_id=project_id)
            try:
                return rct.fro
            except FROForm.DoesNotExist:
                return FROForm.objects.create(rct=rct)
        except RCT.DoesNotExist:
            return None

    def get(self, request, project_id):
        fro = self._get_fro(project_id)
        if fro is None:
            return Response({'error': 'Formulaire FRO introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(FROFormSerializer(fro).data)

    def patch(self, request, project_id):
        fro = self._get_fro(project_id)
        if fro is None:
            return Response({'error': 'Formulaire FRO introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if fro.rct.project.phase in LOCKED_PHASES:
            return Response({'error': 'Ce projet est verrouillé et ne peut plus être modifié.'}, status=status.HTTP_403_FORBIDDEN)
        s = FROFormSerializer(fro, data=request.data, partial=True)
        if s.is_valid():
            s.save(updated_by=request.user)
            return Response(s.data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
