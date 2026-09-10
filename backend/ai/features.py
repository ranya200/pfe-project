"""
Calcul des features réelles pour le Random Forest de détection de risques.
Toutes les features sont dérivées des données existantes :
risk_management, assistance_technique, projects.
"""
from datetime import date
from django.db.models import Avg
from risk_management.models import Risk, RiskEvaluation, ActionPlan
from assistance_technique.models import AssistanceTechnique, Step4_Evaluation


def compute_project_features(project):
    """
    Calcule les 9 features pour un projet donné.
    Retourne un dict {nom_feature: valeur_float}.
    """
    today = date.today()

    # ── 1. Risques ouverts ──────────────────────────────────────────
    risks_qs = Risk.objects.filter(project=project, is_deleted=False)
    nb_risks_total = risks_qs.count()
    nb_risks_open = risks_qs.filter(status="Ouvert").count()

    # ── 2. Criticité moyenne des risques ouverts ────────────────────
    open_evaluations = RiskEvaluation.objects.filter(
        risk__project=project, risk__status="Ouvert", risk__is_deleted=False
    )
    avg_criticality = open_evaluations.aggregate(avg=Avg('criticality'))['avg'] or 0.0

    # ── 3. Ratio risques inacceptables ───────────────────────────────
    nb_inacceptable = open_evaluations.filter(level="Inacceptable").count()
    ratio_inacceptable = (nb_inacceptable / nb_risks_open) if nb_risks_open > 0 else 0.0

    # ── 4. Taux d'actions en retard ──────────────────────────────────
    action_plans = ActionPlan.objects.filter(risk__project=project, risk__is_deleted=False)
    nb_actions_total = action_plans.count()
    nb_actions_late = action_plans.filter(
        planned_date__lt=today
    ).exclude(status="Done").count()
    ratio_actions_late = (nb_actions_late / nb_actions_total) if nb_actions_total > 0 else 0.0

    # ── 5. Taux d'actions bloquées à 0% ──────────────────────────────
    nb_actions_stuck = action_plans.filter(progress=0).exclude(status="Done").count()
    ratio_actions_stuck = (nb_actions_stuck / nb_actions_total) if nb_actions_total > 0 else 0.0

    # ── 6. Indice de satisfaction client (dernier AT terminé) ────────
    last_at = AssistanceTechnique.objects.filter(project=project).order_by('-created_at').first()
    satisfaction_index = 0.5  # valeur neutre par défaut si pas de donnée
    if last_at is not None and hasattr(last_at, 'step4'):
        idx = last_at.step4.indice_satisfaction_global
        if idx is not None:
            satisfaction_index = idx

    # ── 7. Étape AT actuelle (normalisée 0-1) ─────────────────────────
    at_step_normalized = (last_at.current_step / 4) if last_at is not None else 0.0

    # ── 8. Statut AT (0 = en cours, 1 = terminée) ─────────────────────
    at_status_terminee = 1.0 if (last_at is not None and last_at.status == 'terminee') else 0.0

    # ── 9. Ancienneté du projet (en jours, normalisée sur 365) ───────
    project_age_days = (today - project.created_at.date()).days
    project_age_normalized = min(project_age_days / 365, 1.0)

    return {
        "nb_risks_open": nb_risks_open,
        "avg_criticality_open": round(avg_criticality, 2),
        "ratio_risks_inacceptable": round(ratio_inacceptable, 3),
        "ratio_actions_late": round(ratio_actions_late, 3),
        "ratio_actions_stuck": round(ratio_actions_stuck, 3),
        "satisfaction_index": round(satisfaction_index, 3),
        "at_step_normalized": round(at_step_normalized, 3),
        "at_status_terminee": at_status_terminee,
        "project_age_normalized": round(project_age_normalized, 3),
    }