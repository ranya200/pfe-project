import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Scan automatique toutes les nuits à 2h00
app.conf.beat_schedule = {
    'scan-projets-nightly': {
        'task':     'ai.tasks.scan_all_active_projects',
        'schedule': crontab(hour=2, minute=0),
    },
}