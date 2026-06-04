import os
import uuid as uuid_lib

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings

from .models import (
    AssistanceTechnique,
    Step1_Lancement, Step2_Realisation, Step3_Suivi, Step4_Evaluation,
    EquipementECME, ReunionSuivi, ChargeRessource,
    DEFAULT_CRITERES, DEFAULT_BILAN_QUESTIONS,
    CritereEvaluation, BilanMethodesMoyens, AppreciationClient,
)
from .serializers import (
    AssistanceTechniqueSerializer, AssistanceTechniqueListSerializer,
    Step1Serializer, Step2Serializer, Step3Serializer, Step4Serializer,
    EquipementECMESerializer, ReunionSuiviSerializer, ChargeRessourceSerializer,
)


def _ensure_steps(at):
    """Create all 4 step records if they don't exist yet."""
    Step1_Lancement.objects.get_or_create(at=at)
    Step2_Realisation.objects.get_or_create(at=at)
    Step3_Suivi.objects.get_or_create(at=at)
    step4, created = Step4_Evaluation.objects.get_or_create(at=at)
    if created:
        for cat, num, critere in DEFAULT_CRITERES:
            CritereEvaluation.objects.create(step4=step4, categorie=cat, numero=num, critere=critere)
        for question in DEFAULT_BILAN_QUESTIONS:
            BilanMethodesMoyens.objects.create(step4=step4, question=question)
        for element in ['enquete_satisfaction', 'emails_satisfaction', 'emails_nonsatisfaction', 'reclamations']:
            AppreciationClient.objects.create(step4=step4, element=element)


class AssistanceTechniqueViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AssistanceTechnique.objects.select_related('project', 'created_by')
        project_id = self.request.query_params.get('project')
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return AssistanceTechniqueListSerializer
        return AssistanceTechniqueSerializer

    def perform_create(self, serializer):
        at = serializer.save(created_by=self.request.user)
        _ensure_steps(at)

    @action(detail=True, methods=['post'], url_path='advance_step')
    def advance_step(self, request, pk=None):
        at = self.get_object()

        # ── FIN DE PRESTATION : l'user clique "FIN de la prestation" depuis step 4 ──
        if at.current_step >= 4:
            # Marquer l'AT comme terminée
            at.status = 'terminee'
            at.save(update_fields=['status'])

            # Marquer le projet lié comme Clôturé (phase = 'Cloture')
            project = at.project
            if project.phase != 'Cloture':
                project.phase = 'Cloture'
                project.save(update_fields=['phase'])

            return Response({
                'current_step': at.current_step,
                'status': at.status,
                'project_phase': project.phase,
            })

        # ── Avancement normal entre étapes 1→2→3→4 ──
        at.current_step += 1
        # Le projet est "en cours" dès qu'on avance (il était déjà en Kickoff/Realisation)
        at.status = 'en_cours'
        at.save(update_fields=['current_step', 'status'])
        return Response({'current_step': at.current_step, 'status': at.status})

    @action(detail=True, methods=['post'], url_path='go_back_step')
    def go_back_step(self, request, pk=None):
        at = self.get_object()
        if at.current_step <= 1:
            return Response({'detail': 'Déjà à la première étape.'}, status=status.HTTP_400_BAD_REQUEST)
        at.current_step -= 1
        at.status = 'en_cours'
        at.save(update_fields=['current_step', 'status'])

        # Si on revient en arrière depuis une AT terminée, remettre le projet en Realisation
        project = at.project
        if project.phase == 'Cloture':
            project.phase = 'Realisation'
            project.save(update_fields=['phase'])

        return Response({
            'current_step': at.current_step,
            'status': at.status,
            'project_phase': project.phase,
        })

    @action(detail=True, methods=['get', 'put', 'patch'], url_path='step1')
    def step1(self, request, pk=None):
        at = self.get_object()
        _ensure_steps(at)
        step = at.step1
        if request.method == 'GET':
            return Response(Step1Serializer(step).data)
        serializer = Step1Serializer(step, data=request.data, partial=(request.method == 'PATCH'))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'put', 'patch'], url_path='step2')
    def step2(self, request, pk=None):
        at = self.get_object()
        _ensure_steps(at)
        step = at.step2
        if request.method == 'GET':
            return Response(Step2Serializer(step).data)
        serializer = Step2Serializer(step, data=request.data, partial=(request.method == 'PATCH'))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'put', 'patch'], url_path='step3')
    def step3(self, request, pk=None):
        at = self.get_object()
        _ensure_steps(at)
        step = at.step3
        if request.method == 'GET':
            return Response(Step3Serializer(step).data)
        serializer = Step3Serializer(step, data=request.data, partial=(request.method == 'PATCH'))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'put', 'patch'], url_path='step4')
    def step4(self, request, pk=None):
        at = self.get_object()
        _ensure_steps(at)
        step = at.step4
        if request.method == 'GET':
            return Response(Step4Serializer(step).data)
        serializer = Step4Serializer(step, data=request.data, partial=(request.method == 'PATCH'))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='upload_attachment',
            parser_classes=[MultiPartParser, FormParser])
    def upload_attachment(self, request, pk=None):
        """Upload a file attachment and return its URL (used for plan_communication element_sortie)."""
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file.name)[1]
        filename = f"{uuid_lib.uuid4()}{ext}"
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'at_attachments')
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)

        with open(filepath, 'wb') as dest:
            for chunk in file.chunks():
                dest.write(chunk)

        url = request.build_absolute_uri(f"{settings.MEDIA_URL}at_attachments/{filename}")
        return Response({'url': url, 'name': file.name}, status=status.HTTP_201_CREATED)


# ─── Sub-resource ViewSets ────────────────────────────────────────────────────

class EquipementECMEViewSet(viewsets.ModelViewSet):
    serializer_class   = EquipementECMESerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        at_id = self.request.query_params.get('at')
        qs = EquipementECME.objects.all()
        if at_id:
            qs = qs.filter(step3__at_id=at_id)
        return qs

    def perform_create(self, serializer):
        at_id = self.request.data.get('at')
        step3 = Step3_Suivi.objects.get(at_id=at_id)
        serializer.save(step3=step3)


class ReunionSuiviViewSet(viewsets.ModelViewSet):
    serializer_class   = ReunionSuiviSerializer
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def get_queryset(self):
        at_id = self.request.query_params.get('at')
        qs = ReunionSuivi.objects.all()
        if at_id:
            qs = qs.filter(step3__at_id=at_id)
        return qs

    def perform_create(self, serializer):
        at_id = self.request.data.get('at')
        step3 = Step3_Suivi.objects.get(at_id=at_id)
        serializer.save(step3=step3)


class ChargeRessourceViewSet(viewsets.ModelViewSet):
    serializer_class   = ChargeRessourceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        at_id = self.request.query_params.get('at')
        qs = ChargeRessource.objects.all()
        if at_id:
            qs = qs.filter(step3__at_id=at_id)
        return qs

    def perform_create(self, serializer):
        at_id = self.request.data.get('at')
        step3 = Step3_Suivi.objects.get(at_id=at_id)
        serializer.save(step3=step3)