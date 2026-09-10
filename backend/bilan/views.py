# bilan/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from risk_management.models import ActionPlan
from assistance_technique.models import (
    RisqueIdentifie, PointOuvert, FormationPlanifiee,
    Step2_Realisation, ReunionSuivi, ActionBilan, Step4_Evaluation,
)


def _fmt_user(u):
    return (u.get_full_name() or u.username) if u else None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bilan_actions_projet(request, project_id):
    items = []

    # 1) Actions liées aux Risques
    for ap in ActionPlan.objects.filter(
        risk__project_id=project_id, risk__is_deleted=False
    ).select_related("risk", "responsible"):
        items.append({
            "origine": "Risques", "sous_origine": ap.risk.code,
            "type": "Action", "description": ap.action,
            "responsable": _fmt_user(ap.responsible),
            "date_prevue": ap.planned_date, "date_realisee": ap.actual_date,
            "statut": ap.status,
        })

    # 2) Risques identifiés (AT — Step1)
    for r in RisqueIdentifie.objects.filter(step1__at__project_id=project_id):
        items.append({
            "origine": "AT — Lancement", "sous_origine": f"AT-{r.step1.at_id}",
            "type": "Risque", "description": r.description_risque,
            "responsable": None, "date_prevue": None, "date_realisee": None,
            "statut": r.approche_attenuation or "À définir",
        })

    # 3) Points ouverts / actions (AT — Step1)
    for p in PointOuvert.objects.filter(step1__at__project_id=project_id):
        items.append({
            "origine": "AT — Lancement", "sous_origine": f"AT-{p.step1.at_id}",
            "type": "Action", "description": p.description,
            "responsable": p.responsable, "date_prevue": p.delai,
            "date_realisee": None, "statut": "En cours",
        })

    # 4) Formations planifiées (AT — Step1)
    for f in FormationPlanifiee.objects.filter(step1__at__project_id=project_id):
        items.append({
            "origine": "AT — Lancement", "sous_origine": f"AT-{f.step1.at_id}",
            "type": "Formation", "description": f.formation,
            "responsable": f.ressources, "date_prevue": f.dates,
            "date_realisee": None, "statut": "À planifier",
        })

    # 5) Actions du PV de Libération (AT — Step2, JSON)
    for s2 in Step2_Realisation.objects.filter(at__project_id=project_id):
        for a in (s2.pv_actions or []):
            items.append({
                "origine": "AT — Réalisation", "sous_origine": f"AT-{s2.at_id}",
                "type": "Action", "description": a.get("action", ""),
                "responsable": a.get("responsable"), "date_prevue": a.get("delai"),
                "date_realisee": None, "statut": "En cours",
            })

    # 6) Actions décidées en réunion de suivi (AT — Step3)
    for r in ReunionSuivi.objects.filter(
        step3__at__project_id=project_id
    ).exclude(actions=""):
        items.append({
            "origine": "AT — Suivi", "sous_origine": f"AT-{r.step3.at_id}",
            "type": "Action", "description": r.actions,
            "responsable": r.pilote, "date_prevue": r.date,
            "date_realisee": None, "statut": r.statut,
        })

    # 7) Actions du bilan (AT — Step4)
    for a in ActionBilan.objects.filter(step4__at__project_id=project_id):
        items.append({
            "origine": "AT — Évaluation", "sous_origine": f"AT-{a.step4.at_id}",
            "type": a.get_type_action_display(), "description": a.action,
            "responsable": a.responsable, "date_prevue": a.due_date,
            "date_realisee": None, "statut": "En cours",
        })

    # 8) Formations à planifier (AT — Step4, texte libre)
    for s4 in Step4_Evaluation.objects.filter(
        at__project_id=project_id
    ).exclude(formations_a_planifier=""):
        items.append({
            "origine": "AT — Évaluation", "sous_origine": f"AT-{s4.at_id}",
            "type": "Formation", "description": s4.formations_a_planifier,
            "responsable": None, "date_prevue": None, "date_realisee": None,
            "statut": "À planifier",
        })

    return Response(items)