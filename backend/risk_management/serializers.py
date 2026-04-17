from rest_framework import serializers
from .models import Risk, RiskEvaluation, ActionPlan, ResidualRisk
from users.serializers import UserSerializer


# ══════════════════════════════════════════════════════════════════
# RISK EVALUATION
# ══════════════════════════════════════════════════════════════════

class RiskEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RiskEvaluation
        fields = [
            "id",
            "probability", "severity",
            "criticality", "level", "mesure",
            "decision", "justification",
            "created_at", "updated_at",
        ]
        read_only_fields = ["criticality", "level", "mesure", "created_at", "updated_at"]


# ══════════════════════════════════════════════════════════════════
# ACTION PLAN
# ══════════════════════════════════════════════════════════════════

class ActionPlanSerializer(serializers.ModelSerializer):
    responsible_detail = UserSerializer(source="responsible", read_only=True)

    class Meta:
        model  = ActionPlan
        fields = [
            "id",
            # Action
            "action", "responsible", "responsible_detail",
            # Planification
            "planned_date", "actual_date",
            # Suivi
            "progress", "status", "closure_date", "registration",
            # Évaluation efficacité
            "effectiveness_criteria",
            "efficacite",                 # ← ajouté
            "initial_value", "final_value",
            "effectiveness_percentage",
            # Commentaire
            "comment",
            "created_at", "updated_at",
        ]
        read_only_fields = ["effectiveness_percentage", "created_at", "updated_at"]


# ══════════════════════════════════════════════════════════════════
# RESIDUAL RISK
# ══════════════════════════════════════════════════════════════════

class ResidualRiskSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ResidualRisk
        fields = [
            "id",
            "probability", "severity",
            "criticality", "level", "mesure",
            "created_at", "updated_at",
        ]
        read_only_fields = ["criticality", "level", "mesure", "created_at", "updated_at"]


# ══════════════════════════════════════════════════════════════════
# RISK — lecture complète (GET)
# ══════════════════════════════════════════════════════════════════

class RiskSerializer(serializers.ModelSerializer):
    evaluation        = RiskEvaluationSerializer(read_only=True)
    action_plan       = ActionPlanSerializer(read_only=True)
    residual          = ResidualRiskSerializer(read_only=True)
    created_by_detail = UserSerializer(source="created_by", read_only=True)

    process_display   = serializers.CharField(source="get_process_display",   read_only=True)
    risk_type_display = serializers.CharField(source="get_risk_type_display", read_only=True)
    origin_display    = serializers.CharField(source="get_origin_display",    read_only=True)
    status_display    = serializers.CharField(source="get_status_display",    read_only=True)
    activity_display  = serializers.CharField(source="get_activity_display",  read_only=True)

    class Meta:
        model  = Risk
        fields = [
            "id", "code", "project",
            # Step 1
            "process", "process_display",
            "activity", "activity_display",
            "title",
            "risk_type", "risk_type_display",
            "origin", "origin_display",
            "causes", "consequences", "existing_measures",
            # Statut global
            "status", "status_display",
            # Traçabilité
            "created_by", "created_by_detail",
            "created_at", "updated_at",
            # Relations imbriquées
            "evaluation", "action_plan", "residual",
        ]
        read_only_fields = ["code", "created_at", "updated_at", "created_by"]


# ══════════════════════════════════════════════════════════════════
# RISK — écriture (POST / PUT / PATCH)
# ══════════════════════════════════════════════════════════════════

class RiskWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Risk
        fields = [
            "id", "code", "project",
            "process", "activity", "title",
            "risk_type", "origin",
            "causes", "consequences", "existing_measures",
            "status",
        ]
        read_only_fields = ["code"]


# ══════════════════════════════════════════════════════════════════
# SUIVI DU PLAN D'ACTION — vue tableau complet
# ══════════════════════════════════════════════════════════════════

class ActionPlanSuiviSerializer(serializers.ModelSerializer):
    risk_code          = serializers.CharField(source="risk.code",  read_only=True)
    risk_title         = serializers.CharField(source="risk.title", read_only=True)
    responsible_name   = serializers.SerializerMethodField()
    responsible_detail = UserSerializer(source="responsible", read_only=True)

    initial_criticality  = serializers.SerializerMethodField()
    residual_criticality = serializers.SerializerMethodField()

    class Meta:
        model  = ActionPlan
        fields = [
            "risk_code", "risk_title",
            "id", "action",
            "responsible", "responsible_name", "responsible_detail",
            "planned_date", "actual_date",
            "progress", "status", "closure_date", "registration",
            "effectiveness_criteria",
            "efficacite",                 # ← ajouté
            "initial_value", "final_value",
            "effectiveness_percentage",
            "initial_criticality", "residual_criticality",
            "comment",
        ]

    def get_responsible_name(self, obj):
        if obj.responsible:
            return obj.responsible.get_full_name() or obj.responsible.username
        return None

    def get_initial_criticality(self, obj):
        try:
            return obj.risk.evaluation.criticality
        except Exception:
            return None

    def get_residual_criticality(self, obj):
        try:
            return obj.risk.residual.criticality
        except Exception:
            return None