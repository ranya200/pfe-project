from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsRiskManager
from django_filters.rest_framework import DjangoFilterBackend

from users.serializers import UserSerializer
from audit.utils import log_action, serialize_model_fields
from .models import Risk, RiskEvaluation, ActionPlan, ResidualRisk
from .serializers import (
    RiskSerializer,
    RiskWriteSerializer,
    RiskEvaluationSerializer,
    ActionPlanSerializer,
    ActionPlanSuiviSerializer,
    ResidualRiskSerializer,
)


# ══════════════════════════════════════════════════════════════════
# RISK VIEWSET
# ══════════════════════════════════════════════════════════════════

class RiskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsRiskManager]
    queryset = Risk.objects.select_related(
        "evaluation", "action_plan", "residual", "created_by"
    ).all()

    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["project", "status", "process", "risk_type", "origin"]
    search_fields    = ["title", "code", "causes", "consequences"]
    ordering_fields  = ["code", "created_at", "status"]
    ordering         = ["code"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return RiskWriteSerializer
        return RiskSerializer

    def perform_create(self, serializer):
        risk = serializer.save(created_by=self.request.user)
        log_action(
            action='RISK_CREATE',
            user=self.request.user,
            model_name='Risk',
            object_id=str(risk.id),
            object_repr=f"{risk.code} — {risk.title}",
            new_values=serialize_model_fields(risk),
            request=self.request,
            extra={'risk_id': risk.id, 'risk_code': risk.code, 'project_id': risk.project_id},
        )

    def perform_update(self, serializer):
        # Capture old values before saving
        old = serialize_model_fields(serializer.instance)
        risk = serializer.save()
        log_action(
            action='RISK_UPDATE',
            user=self.request.user,
            model_name='Risk',
            object_id=str(risk.id),
            object_repr=f"{risk.code} — {risk.title}",
            old_values=old,
            new_values=serialize_model_fields(risk),
            request=self.request,
            extra={'risk_id': risk.id, 'risk_code': risk.code, 'project_id': risk.project_id},
        )

    def destroy(self, request, *args, **kwargs):
        risk = self.get_object()
        old = serialize_model_fields(risk)
        risk.delete(deleted_by=request.user)
        log_action(
            action='RISK_DELETE',
            user=request.user,
            model_name='Risk',
            object_id=str(risk.id),
            object_repr=f"{risk.code} — {risk.title}",
            old_values=old,
            request=request,
            extra={'risk_id': risk.id, 'risk_code': risk.code, 'project_id': risk.project_id},
        )
        return Response(
            {"detail": f"Risque {risk.code} supprimé (soft-delete)."},
            status=status.HTTP_200_OK,
        )

    # ── Step 2 : Évaluation ───────────────────────────────────────

    @action(detail=True, methods=["get", "post", "put", "patch"],
            url_path="evaluation")
    def evaluation(self, request, pk=None):
        risk = self.get_object()

        if request.method == "GET":
            try:
                serializer = RiskEvaluationSerializer(risk.evaluation)
                return Response(serializer.data)
            except RiskEvaluation.DoesNotExist:
                return Response(
                    {"detail": "Aucune évaluation pour ce risque."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        is_create = False
        old_eval  = None
        try:
            instance = risk.evaluation
            old_eval = serialize_model_fields(instance)
            partial  = request.method == "PATCH"
            serializer = RiskEvaluationSerializer(
                instance, data=request.data, partial=partial
            )
        except RiskEvaluation.DoesNotExist:
            is_create = True
            serializer = RiskEvaluationSerializer(data={**request.data, "risk": risk.id})

        serializer.is_valid(raise_exception=True)

        try:
            saved_eval = serializer.save(risk=risk)
        except Exception:
            saved_eval = serializer.save()

        log_action(
            action='RISK_EVAL',
            user=request.user,
            model_name='RiskEvaluation',
            object_id=str(saved_eval.id),
            object_repr=f"Évaluation {risk.code} — P={saved_eval.probability} G={saved_eval.severity} C={saved_eval.criticality}",
            old_values=old_eval,
            new_values=serialize_model_fields(saved_eval),
            request=request,
            extra={
                'risk_id': risk.id,
                'risk_code': risk.code,
                'project_id': risk.project_id,
                'is_create': is_create,
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ── Step 3 : Plan d'action ────────────────────────────────────

    @action(detail=True, methods=["get", "post", "put", "patch"],
            url_path="action-plan")
    def action_plan(self, request, pk=None):
        risk = self.get_object()

        if request.method == "GET":
            try:
                serializer = ActionPlanSerializer(risk.action_plan)
                return Response(serializer.data)
            except ActionPlan.DoesNotExist:
                return Response(
                    {"detail": "Aucun plan d'action pour ce risque."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        is_create = False
        old_ap    = None
        try:
            instance   = risk.action_plan
            old_ap     = serialize_model_fields(instance)
            partial    = request.method == "PATCH"
            serializer = ActionPlanSerializer(
                instance, data=request.data, partial=partial
            )
        except ActionPlan.DoesNotExist:
            is_create  = True
            serializer = ActionPlanSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        try:
            saved_ap = serializer.save(risk=risk)
        except Exception:
            saved_ap = serializer.save()

        log_action(
            action='ACTION_CREATE' if is_create else 'ACTION_UPDATE',
            user=request.user,
            model_name='ActionPlan',
            object_id=str(saved_ap.id),
            object_repr=f"Plan d'action {risk.code} — {(saved_ap.action or '')[:80]}",
            old_values=old_ap,
            new_values=serialize_model_fields(saved_ap),
            request=request,
            extra={
                'risk_id': risk.id,
                'risk_code': risk.code,
                'project_id': risk.project_id,
                'is_create': is_create,
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ── Step 4 : Risque résiduel ──────────────────────────────────

    @action(detail=True, methods=["get", "post", "put", "patch"],
            url_path="residual")
    def residual(self, request, pk=None):
        risk = self.get_object()

        if request.method == "GET":
            try:
                serializer = ResidualRiskSerializer(risk.residual)
                return Response(serializer.data)
            except ResidualRisk.DoesNotExist:
                return Response(
                    {"detail": "Aucun risque résiduel pour ce risque."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        is_create  = False
        old_resid  = None
        try:
            instance   = risk.residual
            old_resid  = serialize_model_fields(instance)
            partial    = request.method == "PATCH"
            serializer = ResidualRiskSerializer(
                instance, data=request.data, partial=partial
            )
        except ResidualRisk.DoesNotExist:
            is_create  = True
            serializer = ResidualRiskSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        try:
            saved_res = serializer.save(risk=risk)
        except Exception:
            saved_res = serializer.save()

        log_action(
            action='RESIDUAL_CREATE' if is_create else 'RESIDUAL_UPDATE',
            user=request.user,
            model_name='ResidualRisk',
            object_id=str(saved_res.id),
            object_repr=f"Résiduel {risk.code} — P={saved_res.probability} G={saved_res.severity} C={saved_res.criticality}",
            old_values=old_resid,
            new_values=serialize_model_fields(saved_res),
            request=request,
            extra={
                'risk_id': risk.id,
                'risk_code': risk.code,
                'project_id': risk.project_id,
                'is_create': is_create,
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ── Détail complet ────────────────────────────────────────────

    @action(detail=True, methods=["get"], url_path="full")
    def full(self, request, pk=None):
        risk       = self.get_object()
        serializer = RiskSerializer(risk, context={"request": request})
        return Response(serializer.data)

    # ── Journal d'audit du risque ─────────────────────────────────

    @action(detail=True, methods=["get"], url_path="audit-logs")
    def audit_logs(self, request, pk=None):
        """
        Retourne toutes les entrées d'audit liées à ce risque :
        - Création / modification / suppression du risque
        - Évaluation du risque
        - Plan d'action (création / modification)
        - Risque résiduel (création / modification)
        """
        from django.db.models import Q
        from audit.models import AuditLog
        from audit.serializers import AuditLogSerializer

        risk = self.get_object()

        # Récupère les logs où le risque est l'objet direct
        # OU où le risque est référencé dans extra (sous-modèles)
        qs = AuditLog.objects.select_related('user').filter(
            Q(model_name='Risk', object_id=str(risk.id)) |
            Q(extra__risk_id=risk.id)
        ).order_by('-timestamp')

        # Pagination légère
        try:
            page     = max(1, int(request.query_params.get('page', 1)))
            per_page = min(100, max(10, int(request.query_params.get('per_page', 50))))
        except (ValueError, TypeError):
            page, per_page = 1, 50

        total  = qs.count()
        offset = (page - 1) * per_page
        logs   = qs[offset: offset + per_page]

        return Response({
            'count':    total,
            'page':     page,
            'per_page': per_page,
            'pages':    max(1, (total + per_page - 1) // per_page),
            'results':  AuditLogSerializer(logs, many=True).data,
        })

    # ── Dashboard KPIs + Heatmap ──────────────────────────────────

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        project_id = request.query_params.get("project")
        if not project_id:
            return Response(
                {"detail": "Le paramètre 'project' est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        risks = Risk.objects.filter(project_id=project_id).select_related(
            "evaluation", "residual", "action_plan"
        )

        total        = risks.count()
        acceptable   = 0
        surveiller   = 0
        inacceptable = 0
        closed       = risks.filter(status="Clôturé").count()
        late         = 0

        heatmap_initial  = {}
        heatmap_residual = {}
        radar_data       = []

        for risk in risks:
            try:
                ev = risk.evaluation
                if ev.level == "Acceptable":
                    acceptable += 1
                elif ev.level == "Surveiller":
                    surveiller += 1
                else:
                    inacceptable += 1

                key = f"{ev.probability}-{ev.severity}"
                heatmap_initial.setdefault(key, []).append(risk.code)

                entry = {
                    "code":      risk.code,
                    "initial":   ev.criticality,
                    "residual":  None,
                    "evolution": None,
                }
                try:
                    res = risk.residual
                    entry["residual"]  = res.criticality
                    entry["evolution"] = ev.criticality - res.criticality
                    key_r = f"{res.probability}-{res.severity}"
                    heatmap_residual.setdefault(key_r, []).append(risk.code)
                except ResidualRisk.DoesNotExist:
                    pass

                radar_data.append(entry)

            except RiskEvaluation.DoesNotExist:
                pass

            try:
                ap = risk.action_plan
                if ap.status in ("IDLE", "Blocked", "In Progress"):
                    import datetime
                    if ap.planned_date and ap.planned_date < datetime.date.today():
                        late += 1
            except ActionPlan.DoesNotExist:
                pass

        closure_rate = round((closed / total * 100), 1) if total > 0 else 0

        return Response({
            "kpis": {
                "total":        total,
                "acceptable":   acceptable,
                "surveiller":   surveiller,
                "inacceptable": inacceptable,
                "late_actions": late,
                "closure_rate": closure_rate,
            },
            "heatmap": {
                "initial":  heatmap_initial,
                "residual": heatmap_residual,
            },
            "radar": radar_data,
        })

    # ── Bulk création depuis le guide des risques ─────────────────

    @action(detail=False, methods=["post"], url_path="bulk-from-guide")
    def bulk_from_guide(self, request):
        """
        POST /api/risks/bulk-from-guide/
        Payload: { project: int, risks: [{ process, title, causes, consequences }] }
        Crée plusieurs risques pré-remplis depuis le guide de risques.
        """
        from projects.models import Project

        project_id = request.data.get("project")
        risks_data  = request.data.get("risks", [])

        if not project_id:
            return Response(
                {"detail": "Le champ 'project' est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not risks_data:
            return Response(
                {"detail": "Aucun risque à créer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Projet introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        created = []
        for item in risks_data:
            risk = Risk.objects.create(
                project=project,
                process=item.get("process", ""),
                activity=item.get("activity", "SI"),
                title=item.get("title", ""),
                risk_type=item.get("risk_type", "Interne"),
                origin=item.get("origin", "Telnet"),
                causes=item.get("causes", ""),
                consequences=item.get("consequences", ""),
                existing_measures=item.get("existing_measures", ""),
                status="Ouvert",
                created_by=request.user,
            )
            log_action(
                action="RISK_CREATE",
                user=request.user,
                model_name="Risk",
                object_id=str(risk.id),
                object_repr=f"{risk.code} — {risk.title}",
                new_values=serialize_model_fields(risk),
                extra={"source": "guide", "project_id": project_id},
            )
            created.append(risk)

        serializer = RiskSerializer(created, many=True)
        return Response(
            {"created": len(created), "risks": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    # ── Membres du projet ─────────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="project-members")
    def project_members(self, request):
        project_id = request.query_params.get("project")
        if not project_id:
            return Response(
                {"detail": "Le paramètre 'project' est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from projects.models import Project
            project    = Project.objects.get(pk=project_id)
            members    = project.membres.all()
            serializer = UserSerializer(members, many=True)
            return Response(serializer.data)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Projet introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )


# ══════════════════════════════════════════════════════════════════
# ACTION PLAN VIEWSET — Suivi du Plan d'Action
# ══════════════════════════════════════════════════════════════════

class ActionPlanViewSet(viewsets.ModelViewSet):
    permission_classes = [IsRiskManager]
    queryset = ActionPlan.objects.select_related(
        "risk", "risk__evaluation", "risk__residual", "responsible"
    ).all()

    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "responsible"]
    search_fields    = ["action", "risk__code", "risk__title"]
    ordering_fields  = ["planned_date", "status", "progress"]

    def get_serializer_class(self):
        if self.action == "list":
            return ActionPlanSuiviSerializer
        return ActionPlanSerializer

    def get_queryset(self):
        qs         = super().get_queryset()
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(risk__project_id=project_id)
        return qs


# ══════════════════════════════════════════════════════════════════
# RISK EVALUATION VIEWSET
# ══════════════════════════════════════════════════════════════════

class RiskEvaluationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsRiskManager]
    queryset         = RiskEvaluation.objects.select_related("risk").all()
    serializer_class = RiskEvaluationSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ["level", "decision"]


# ══════════════════════════════════════════════════════════════════
# RESIDUAL RISK VIEWSET
# ══════════════════════════════════════════════════════════════════

class ResidualRiskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsRiskManager]
    queryset         = ResidualRisk.objects.select_related("risk").all()
    serializer_class = ResidualRiskSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ["level"]