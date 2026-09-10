# projects/dashboard_view.py
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication
from .models import Project
from risk_management.models import Risk, RiskEvaluation, ActionPlan, ResidualRisk
from audit.models import AuditLog
from assistance_technique.models import AssistanceTechnique, Step2_Realisation, ChargeRessource, Step4_Evaluation


def get_visible_projects(user):
    """
    Admin -> tous les projets actifs.
    Autres rôles -> uniquement les projets où l'utilisateur est membre
    de l'équipe OU en est le créateur.
    """
    if user.role == 'admin':
        return Project.objects.all()
    return Project.objects.filter(
        Q(membres=user) | Q(created_by=user)
    ).distinct()


def get_visible_audit_logs(user, projects_qs, risks_qs, actions_qs, limit=10):
    """
    Filtre le journal d'audit pour un non-admin :
    - garde les logs liés à un projet/risque/action/etc. visible par l'utilisateur
    - garde aussi ses propres logs "personnels" (connexion, son propre compte)
    car AuditLog n'a pas de FK réelle vers Project (model_name/object_id en string).
    """
    if user.role == 'admin':
        return AuditLog.objects.all()[:limit]

    project_ids = list(projects_qs.values_list('id', flat=True))
    risk_ids    = list(risks_qs.values_list('id', flat=True))
    eval_ids    = list(RiskEvaluation.objects.filter(risk__in=risks_qs).values_list('id', flat=True))
    action_ids  = list(actions_qs.values_list('id', flat=True))
    residual_ids = list(ResidualRisk.objects.filter(risk__in=risks_qs).values_list('id', flat=True))

    def as_str(ids):
        return [str(i) for i in ids]

    project_scoped = (
        Q(model_name='Project', object_id__in=as_str(project_ids)) |
        Q(model_name='Risk', object_id__in=as_str(risk_ids)) |
        Q(model_name='RiskEvaluation', object_id__in=as_str(eval_ids)) |
        Q(model_name='ActionPlan', object_id__in=as_str(action_ids)) |
        Q(model_name='ResidualRisk', object_id__in=as_str(residual_ids))
    )
    personal_scoped = (
        Q(user=user) & Q(action__in=['LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'ACCOUNT_LOCKED', 'USER_UPDATE'])
    )

    return AuditLog.objects.filter(project_scoped | personal_scoped)[:limit]


GLOBAL_STATUS_STYLE = {
    'cloture':       'Clôturé',
    'en_difficulte': 'En difficulté',
    'a_surveiller':  'À surveiller',
    'on_track':      'On track',
}


def compute_project_global_status(project, open_risks_for_project, overdue_actions_count):
    """
    Détermine automatiquement le statut global d'un projet (§ Dashboard —
    "État global" demandé par l'encadrant), basé sur :
    - Clôturé  : phase du projet = Cloture/Archive
    - En difficulté : au moins 1 risque ouvert de niveau "Inacceptable"
                       OU 3 actions en retard ou plus
    - À surveiller  : au moins 1 risque ouvert de niveau "Surveiller"
                       OU 1 à 2 actions en retard
    - On track : sinon

    ⚠️ Seuils choisis par défaut (3 actions en retard = "en difficulté") —
    ajustables facilement ici si l'encadrant a une règle précise en tête.
    """
    if project.phase in ('Cloture', 'Archive'):
        return 'cloture'

    has_inacceptable = any(
        getattr(r, 'evaluation', None) and r.evaluation.level == 'Inacceptable'
        for r in open_risks_for_project
    )
    has_surveiller = any(
        getattr(r, 'evaluation', None) and r.evaluation.level == 'Surveiller'
        for r in open_risks_for_project
    )

    if has_inacceptable or overdue_actions_count >= 3:
        return 'en_difficulte'
    if has_surveiller or overdue_actions_count >= 1:
        return 'a_surveiller'
    return 'on_track'


def compute_project_progress_pct(project):
    """
    % d'avancement d'un projet :
    - Projets Assistance Technique : basé sur l'étape courante de l'AT
      la plus récente (current_step / 4 * 100).
    - Autres projets (Forfait) : moyenne de progression des plans d'action
      liés à leurs risques, si au moins un existe.
    - Sinon : None (pas de donnée exploitable, exclu des moyennes globales).
    """
    latest_at = project.assistances.order_by('-created_at').first()
    if latest_at:
        return round((latest_at.current_step / 4) * 100, 1)

    actions = ActionPlan.objects.filter(risk__project=project)
    if actions.exists():
        avg = actions.aggregate(avg=Sum('progress') / Count('id'))['avg']
        return round(avg, 1) if avg is not None else None

    return None


def collect_jalons_summary(projects_qs, limit_echeances=6):
    """
    Agrège les jalons (pq_jalons, JSONField Step 2 AT) de tous les projets
    visibles : compte réalisés/prévus et liste les prochaines échéances
    (jalons non réalisés triés par date_prevue croissante).
    """
    today = timezone.now().date()
    realises = 0
    prevus = 0
    echeances = []

    steps2 = Step2_Realisation.objects.filter(
        at__project__in=projects_qs
    ).select_related('at', 'at__project')

    for step2 in steps2:
        jalons = step2.pq_jalons or []
        for j in jalons:
            if not isinstance(j, dict) or not (j.get('description') or '').strip():
                continue  # jalon vide (M1/M2/M3 jamais renseigné) — on ignore
            if j.get('statut') == 'realise':
                realises += 1
            else:
                prevus += 1
                date_prevue = j.get('date_prevue') or None
                echeances.append({
                    'project_id': step2.at.project_id,
                    'project_ref': step2.at.project.ref_projet,
                    'id_jalon': j.get('id_jalon'),
                    'description': j.get('description'),
                    'date_prevue': date_prevue,
                    'en_retard': bool(date_prevue) and date_prevue < str(today),
                })

    # Prochaines échéances : celles avec une date, triées, en premier ;
    # celles sans date à la fin.
    echeances.sort(key=lambda e: (e['date_prevue'] is None, e['date_prevue'] or ''))

    return {
        'realises': realises,
        'prevus': prevus,
        'total': realises + prevus,
        'prochaines_echeances': echeances[:limit_echeances],
    }


def collect_top_risks(risks_qs, limit=5):
    """Principaux risques : les plus critiques, encore ouverts, en premier."""
    top = (
        risks_qs.filter(status='Ouvert', evaluation__isnull=False)
        .select_related('evaluation', 'project')
        .order_by('-evaluation__criticality')[:limit]
    )
    return [
        {
            'id': r.id,
            'code': r.code,
            'title': r.title,
            'project_id': r.project_id,
            'project_ref': r.project.ref_projet,
            'criticality': r.evaluation.criticality,
            'level': r.evaluation.level,
        }
        for r in top
    ]


def collect_priority_actions(actions_qs, limit=5):
    """
    Actions prioritaires : celles liées aux risques les plus critiques,
    non terminées, triées par échéance la plus proche en premier.
    """
    top = (
        actions_qs.exclude(status='Done')
        .filter(risk__evaluation__isnull=False)
        .select_related('risk', 'risk__evaluation', 'risk__project', 'responsible')
        .order_by('-risk__evaluation__criticality', 'planned_date')[:limit]
    )
    return [
        {
            'id': a.id,
            'action': (a.action or '')[:150],
            'status': a.status,
            'planned_date': a.planned_date,
            'responsible': (
                f"{a.responsible.first_name} {a.responsible.last_name}".strip()
                if a.responsible else None
            ),
            'risk_code': a.risk.code,
            'project_id': a.risk.project_id,
            'project_ref': a.risk.project.ref_projet,
            'criticality': a.risk.evaluation.criticality,
        }
        for a in top
    ]


def compute_effort_variance(projects_qs):
    """
    KPI 1 — Écart d'effort/Effort (Variance) :
    = Somme(Réel - Planifié) / Somme(Planifié) × 100, sur ChargeRessource
    (Step 3 AT) de tous les projets visibles. Seuil ISO recommandé : ≤ 6 %.
    Retourne None si aucune donnée planifiée n'existe encore.
    """
    charges = ChargeRessource.objects.filter(step3__at__project__in=projects_qs)
    total_reel = 0.0
    total_planifie = 0.0
    for c in charges:
        total_reel += c.total
        total_planifie += c.total_planifie

    if total_planifie <= 0:
        return {'value': None, 'seuil': 6, 'total_reel': total_reel, 'total_planifie': total_planifie}

    variance_pct = round(((total_reel - total_planifie) / total_planifie) * 100, 1)
    return {'value': variance_pct, 'seuil': 6, 'total_reel': total_reel, 'total_planifie': total_planifie}


def compute_schedule_variance(actions_qs):
    """
    KPI 2 — Écart délai / Schedule Variance :
    = Somme(Date réelle - Date planifiée) / Somme(Durée planifiée) × 100.
    "Durée planifiée" par action = (planned_date - date de création du risque),
    en l'absence d'une date de début explicite sur ActionPlan.
    Seuil ISO recommandé : ≤ 5 %. Ne considère que les actions terminées
    (avec actual_date renseignée). Retourne None si aucune action clôturée.
    """
    closed = actions_qs.filter(
        actual_date__isnull=False, planned_date__isnull=False
    ).select_related('risk')

    total_delta_days = 0
    total_planned_duration_days = 0
    for a in closed:
        delta = (a.actual_date - a.planned_date).days
        planned_duration = (a.planned_date - a.risk.created_at.date()).days
        if planned_duration <= 0:
            continue  # évite une division par une durée nulle/négative aberrante
        total_delta_days += delta
        total_planned_duration_days += planned_duration

    if total_planned_duration_days <= 0:
        return {'value': None, 'seuil': 5}

    variance_pct = round((total_delta_days / total_planned_duration_days) * 100, 1)
    return {'value': variance_pct, 'seuil': 5}


def compute_satisfaction_index(projects_qs):
    """
    KPI 3 — Customer Satisfaction Index :
    moyenne de Step4_Evaluation.indice_satisfaction_global (déjà calculé,
    0.0–1.0) sur toutes les AT évaluées des projets visibles. Seuil ISO
    recommandé : ≥ 90 %. Retourne None si aucune évaluation n'existe encore.
    """
    steps4 = Step4_Evaluation.objects.filter(at__project__in=projects_qs)
    scores = [
        s.indice_satisfaction_global for s in steps4
        if s.indice_satisfaction_global is not None
    ]
    if not scores:
        return {'value': None, 'seuil': 90}

    avg_pct = round((sum(scores) / len(scores)) * 100, 1)
    return {'value': avg_pct, 'seuil': 90}


class DashboardSummaryView(APIView):
    """
    Vue d'ensemble globale — agrège les KPIs de tous les modules
    pour le Dashboard QA (ISO 9001 / ISO 27001), filtrée selon le rôle
    de l'utilisateur connecté.
    GET /api/projects/dashboard/summary/
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        user = request.user

        # ── Projets visibles selon le rôle ──────────────────────────
        projects_qs = get_visible_projects(user)

        projects_by_phase = list(
            projects_qs.values('phase').annotate(count=Count('id')).order_by('phase')
        )
        projects_by_type = list(
            projects_qs.values('type_projet').annotate(count=Count('id'))
        )

        # ── Risques : uniquement ceux des projets visibles ──────────
        risks_qs = Risk.objects.filter(project__in=projects_qs)
        risks_by_status = list(
            risks_qs.values('status').annotate(count=Count('id'))
        )
        risks_by_level = list(
            risks_qs.filter(evaluation__isnull=False)
            .values('evaluation__level')
            .annotate(count=Count('id'))
        )
        # Matrice Probabilité × Gravité pour le dashboard.
        risks_matrix = [
            {
                'probabilite': m['evaluation__probability'],
                'gravite': m['evaluation__severity'],
                'count': m['count'],
            }
            for m in (
                risks_qs.filter(evaluation__isnull=False)
                .values('evaluation__probability', 'evaluation__severity')
                .annotate(count=Count('id'))
            )
        ]

        # ── Actions : via risk__project (pas de FK directe) ─────────
        actions_qs = ActionPlan.objects.filter(risk__project__in=projects_qs)
        actions_by_status = list(
            actions_qs.values('status').annotate(count=Count('id'))
        )
        overdue_actions = actions_qs.filter(
            planned_date__lt=today
        ).exclude(status='Done').count()

        # ── Activité récente ─────────────────────────────────────────
        recent_logs_qs = get_visible_audit_logs(user, projects_qs, risks_qs, actions_qs, limit=10)
        recent_logs = [
            {
                'id': log.id,
                'action': log.get_action_display(),
                'timestamp': log.timestamp,
                'object_repr': log.object_repr,
                'user': log.user.email if log.user else 'Système',
            }
            for log in recent_logs_qs
        ]

        # ── État global par projet (On track / À surveiller / En difficulté / Clôturé) ──
        global_status_counts = {'on_track': 0, 'a_surveiller': 0, 'en_difficulte': 0, 'cloture': 0}
        progress_values = []
        for project in projects_qs:
            open_risks_for_project = list(
                risks_qs.filter(project=project, status='Ouvert').select_related('evaluation')
            )
            overdue_for_project = actions_qs.filter(
                risk__project=project, planned_date__lt=today
            ).exclude(status='Done').count()

            status_key = compute_project_global_status(project, open_risks_for_project, overdue_for_project)
            global_status_counts[status_key] += 1

            progress = compute_project_progress_pct(project)
            if progress is not None:
                progress_values.append(progress)

        avg_progress_pct = round(sum(progress_values) / len(progress_values), 1) if progress_values else None

        # ── Jalons (Step 2 AT — pq_jalons) ────────────────────────────
        jalons_summary = collect_jalons_summary(projects_qs)

        # ── Principaux risques / Actions prioritaires ─────────────────
        top_risks = collect_top_risks(risks_qs)
        priority_actions = collect_priority_actions(actions_qs)

        # ── KPIs (Indicateurs de performance) ──────────────────────────
        kpi_effort = compute_effort_variance(projects_qs)
        kpi_schedule = compute_schedule_variance(actions_qs)
        kpi_satisfaction = compute_satisfaction_index(projects_qs)

        return Response({
            'projects': {
                'total': projects_qs.count(),
                'total_clients': projects_qs.values('client').distinct().count(),
                'by_phase': projects_by_phase,
                'by_type': projects_by_type,
            },
            'risks': {
                'total': risks_qs.count(),
                'open': risks_qs.filter(status='Ouvert').count(),
                'critical': risks_qs.filter(status='Ouvert', evaluation__level='Inacceptable').count(),
                'by_status': risks_by_status,
                'by_level': risks_by_level,
                'matrix': risks_matrix,
                'top_risks': top_risks,
            },
            'actions': {
                'total': actions_qs.count(),
                'overdue': overdue_actions,
                'by_status': actions_by_status,
                'priority_actions': priority_actions,
            },
            'recent_activity': recent_logs,
            # ── Sections demandées pour le Dashboard QA (email encadrant) ──
            'global_status': {
                'counts': global_status_counts,
                'labels': GLOBAL_STATUS_STYLE,
            },
            'planning': {
                'avg_progress_pct': avg_progress_pct,
            },
            'jalons': jalons_summary,
            'kpis': {
                'ecart_effort': kpi_effort,
                'ecart_delai': kpi_schedule,
                'satisfaction_client': kpi_satisfaction,
            },
        })