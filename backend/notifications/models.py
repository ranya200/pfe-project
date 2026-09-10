from django.db import models
from django.conf import settings


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        PROJECT_CREATED = 'PROJECT_CREATED', 'Nouveau projet créé'
        STEP_CHANGE = 'STEP_CHANGE', 'Nouvelle étape'
        RISK_ADDED = 'RISK_ADDED', 'Risque ajouté'
        ACTION_ASSIGNED = 'ACTION_ASSIGNED', 'Action à faire assignée'
        MEETING_SCHEDULED = 'MEETING_SCHEDULED', 'Réunion programmée'
        TRAINING_SCHEDULED = 'TRAINING_SCHEDULED', 'Formation programmée'
        TEAM_ADDED = 'TEAM_ADDED', 'Ajouté à une équipe projet'
        AI_ALERT = 'AI_ALERT', 'Alerte IA'
        AUDIT = 'AUDIT', 'Audit'
        GENERIC = 'GENERIC', 'Générique'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.GENERIC
    )
    title = models.CharField(max_length=255)
    message = models.TextField()

    # Lien optionnel vers un objet lié (projet, AT, risque, etc.)
    related_object_type = models.CharField(max_length=100, blank=True, null=True)
    related_object_id = models.PositiveIntegerField(blank=True, null=True)
    link_url = models.CharField(max_length=500, blank=True, null=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} -> {self.recipient}"