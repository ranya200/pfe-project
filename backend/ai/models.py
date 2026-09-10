from django.db import models

# Create your models here.

from django.conf import settings
from projects.models import Project


class AIResult(models.Model):

    LEVEL_CHOICES = (
        ('vert',   'Vert — Sain'),
        ('orange', 'Orange — Modéré'),
        ('rouge',  'Rouge — Critique'),
    )

    STATUS_CHOICES = (
        ('pending',   'En attente'),
        ('running',   'En cours'),
        ('completed', 'Terminé'),
        ('failed',    'Échoué'),
    )

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name='ai_results'
    )
    task_id = models.CharField(max_length=255, blank=True, db_index=True)
    status  = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    risk_score = models.FloatField(null=True, blank=True)
    risk_level = models.CharField(max_length=10, choices=LEVEL_CHOICES, blank=True)
    features_used = models.JSONField(default=dict, blank=True)
    recommendation   = models.TextField(blank=True)
    iso_clause       = models.CharField(max_length=255, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AIResult — {self.project} — {self.risk_level or self.status} ({self.created_at:%Y-%m-%d})"

class AIAlert(models.Model):

    SEVERITY_CHOICES = (
        ('info',     'Info'),
        ('warning',  'Avertissement'),
        ('critical', 'Critique'),
    )
    STATUS_CHOICES = (
        ('open',         'Ouverte'),
        ('acknowledged', 'Acquittée'),
        ('resolved',     'Résolue'),
    )

    project           = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='ai_alerts')
    ai_result         = models.ForeignKey(AIResult, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    severity          = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='warning')
    status            = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    feature_triggered = models.CharField(max_length=100, blank=True)
    title             = models.CharField(max_length=255)
    detail            = models.TextField(blank=True)
    iso_clause        = models.CharField(max_length=255, blank=True)
    acknowledged_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='acknowledged_alerts'
    )
    acknowledged_at   = models.DateTimeField(null=True, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.title} — {self.project}"