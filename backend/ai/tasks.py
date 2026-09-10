from celery import shared_task
from .models import AIResult, AIAlert
from .features import compute_project_features
from .ml_model import load_model, LEVEL_MAP, RECOMMENDATIONS, FEATURE_NAMES
from .verdict import generate_alerts, build_verdict
from projects.models import Project
import numpy as np


@shared_task(bind=True)
def analyze_project_risk(self, project_id, result_id=None):
    """Analyse le risque d'un projet et génère des alertes précises."""

    # Chercher le AIResult par result_id en priorité (fix race condition)
    if result_id:
        result = AIResult.objects.filter(id=result_id).first()
    else:
        result = AIResult.objects.filter(task_id=self.request.id).first()

    try:
        if result:
            result.status = 'running'
            result.save(update_fields=['status'])

        project  = Project.objects.get(id=project_id)
        features = compute_project_features(project)

        X          = np.array([[features[f] for f in FEATURE_NAMES]])
        model      = load_model()
        prediction = model.predict(X)[0]
        proba      = model.predict_proba(X)[0]
        risk_score = float(proba[prediction])
        risk_level = LEVEL_MAP[prediction]

        if result:
            alert_dicts = generate_alerts(features, result)

            # Résoudre les anciennes alertes ouvertes
            AIAlert.objects.filter(project=project, status='open').update(status='resolved')

            # Créer les nouvelles alertes
            if alert_dicts:
                AIAlert.objects.bulk_create([AIAlert(**a) for a in alert_dicts])

            verdict = build_verdict(risk_level, alert_dicts)

            result.status         = 'completed'
            result.risk_score     = risk_score
            result.risk_level     = risk_level
            result.features_used  = features
            result.recommendation = verdict
            result.iso_clause     = RECOMMENDATIONS[risk_level]['iso_clause']
            result.save()

        return {
            'project_id': project_id,
            'risk_level': risk_level,
            'risk_score': risk_score,
            'nb_alerts':  len(alert_dicts) if result else 0,
        }

    except Exception as e:
        if result:
            result.status        = 'failed'
            result.error_message = str(e)
            result.save(update_fields=['status', 'error_message'])
        raise


@shared_task
def scan_all_active_projects():
    """Celery Beat — scan automatique toutes les nuits."""
    projets = Project.objects.exclude(phase='Cloture')
    for project in projets:
        ai_result         = AIResult.objects.create(project=project, status='pending')
        task              = analyze_project_risk.delay(project.id, ai_result.id)
        ai_result.task_id = task.id
        ai_result.save(update_fields=['task_id'])
    return f"{projets.count()} projets analysés automatiquement"