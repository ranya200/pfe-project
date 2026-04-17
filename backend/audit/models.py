from django.db import models
from django.conf import settings
from django.utils import timezone


class AuditLog(models.Model):
    """
    Traçabilité complète des actions — ISO 9001 / ISO 27001.
    Chaque ligne représente une action utilisateur horodatée avec son contexte.
    """

    # ── Types d'actions ─────────────────────────────────────────────────────
    ACTION_CHOICES = [
        # Authentification
        ('LOGIN',         'Connexion réussie'),
        ('LOGIN_FAILED',  'Tentative de connexion échouée'),
        ('LOGOUT',        'Déconnexion'),
        ('ACCOUNT_LOCKED','Compte verrouillé'),
        # CRUD Projets
        ('PROJECT_CREATE', 'Projet créé'),
        ('PROJECT_UPDATE', 'Projet modifié'),
        ('PROJECT_DELETE', 'Projet supprimé'),
        ('PROJECT_VIEW',   'Projet consulté'),
        # CRUD Utilisateurs
        ('USER_CREATE',   'Utilisateur créé'),
        ('USER_UPDATE',   'Utilisateur modifié'),
        ('USER_DELETE',   'Utilisateur supprimé'),
        # RCT
        ('RCT_CREATE',    'RCT créé'),
        ('RCT_UPDATE',    'RCT mis à jour'),
        ('RCT_FINISH',    'RCT terminé'),
        # Gestion des Risques
        ('RISK_CREATE',      'Risque créé'),
        ('RISK_UPDATE',      'Risque modifié'),
        ('RISK_DELETE',      'Risque supprimé'),
        ('RISK_EVAL',        'Évaluation risque mise à jour'),
        ('ACTION_CREATE',    'Plan d\'action créé'),
        ('ACTION_UPDATE',    'Plan d\'action mis à jour'),
        ('RESIDUAL_CREATE',  'Risque résiduel créé'),
        ('RESIDUAL_UPDATE',  'Risque résiduel mis à jour'),
        # Sécurité
        ('ACCESS_DENIED', 'Accès refusé'),
        ('OTHER',         'Autre'),
    ]

    # ── Champs principaux ────────────────────────────────────────────────────
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='audit_logs',
        verbose_name='Utilisateur',
    )
    action      = models.CharField(max_length=30, choices=ACTION_CHOICES, db_index=True)
    timestamp   = models.DateTimeField(default=timezone.now, db_index=True)

    # ── Objet concerné ──────────────────────────────────────────────────────
    model_name  = models.CharField(max_length=50, blank=True, verbose_name='Modèle')
    object_id   = models.CharField(max_length=50, blank=True, verbose_name='ID objet')
    object_repr = models.CharField(max_length=255, blank=True, verbose_name='Représentation')

    # ── Valeurs avant/après (versioning léger) ───────────────────────────────
    old_values  = models.JSONField(null=True, blank=True, verbose_name='Anciennes valeurs')
    new_values  = models.JSONField(null=True, blank=True, verbose_name='Nouvelles valeurs')

    # ── Contexte réseau ─────────────────────────────────────────────────────
    ip_address  = models.GenericIPAddressField(null=True, blank=True, verbose_name='Adresse IP')
    user_agent  = models.TextField(blank=True, verbose_name='User-Agent')

    # ── Informations complémentaires ─────────────────────────────────────────
    extra       = models.JSONField(null=True, blank=True, verbose_name='Données supplémentaires')

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Journal d\'audit'
        verbose_name_plural = 'Journaux d\'audit'
        indexes = [
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]

    def __str__(self):
        user_str = self.user.email if self.user else 'Anonyme'
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {user_str} — {self.get_action_display()}"
