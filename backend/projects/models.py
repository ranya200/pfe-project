from django.db import models
from django.utils import timezone
from users.models import CustomUser
import random, string

DEPT_ABBREV = {
    'MEDIA': 'MED', 'SPACE': 'SPA', 'BE': 'BE',
    'MONETIQUE': 'MON', 'SI': 'SI', 'TELECOM': 'TEL',
    'RH': 'RH', 'QUALITE': 'QUA', 'ADMIN': 'ADM',
}

def generate_ref(department):
    abbrev = DEPT_ABBREV.get(department, 'PRJ')
    digits = ''.join(random.choices(string.digits, k=4))
    return f"Tel-{abbrev}-{digits}"


class ActiveProjectManager(models.Manager):
    """Manager par défaut — exclut les projets soft-deleted."""
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllProjectManager(models.Manager):
    """Manager alternatif — retourne TOUS les projets y compris supprimés."""
    def get_queryset(self):
        return super().get_queryset()


class Project(models.Model):
    TYPE_CHOICES = (
        ('forfait',    'Forfait'),
        ('assistance', 'Assistance Technique'),
    )
    PHASE_CHOICES = (
        ('IDLE',        'IDLE'),
        ('Offre',       'Offre'),
        ('Kickoff',     'Kickoff'),
        ('Realisation', 'Réalisation'),
        ('Cloture',     'Clôture'),
        ('Archive',     'Archivé'),
    )

    ref_projet        = models.CharField(max_length=20, unique=True, editable=False)
    client            = models.CharField(max_length=100)
    type_projet       = models.CharField(max_length=20, choices=TYPE_CHOICES)
    departement       = models.CharField(max_length=20, choices=CustomUser.DEPARTMENT_CHOICES)
    phase             = models.CharField(max_length=20, choices=PHASE_CHOICES, default='IDLE')
    langages          = models.JSONField(default=list, blank=True)
    os_outils         = models.JSONField(default=list, blank=True)
    metier_generique  = models.JSONField(default=list, blank=True)
    metier_specifique = models.JSONField(default=list, blank=True)
    devops            = models.JSONField(default=list, blank=True)
    management        = models.JSONField(default=list, blank=True)
    membres           = models.ManyToManyField(CustomUser, blank=True, related_name='projets')
    created_by        = models.ForeignKey(CustomUser, on_delete=models.SET_NULL,
                            null=True, related_name='projets_crees')
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    # ── Soft Delete — ISO 9001 (aucune donnée ne disparaît définitivement) ──
    is_deleted  = models.BooleanField(default=False, db_index=True)
    deleted_at  = models.DateTimeField(null=True, blank=True)
    deleted_by  = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='projets_supprimes'
    )

    # Managers : Project.objects → actifs, Project.all_objects → tous
    objects     = ActiveProjectManager()
    all_objects = AllProjectManager()

    def save(self, *args, **kwargs):
        if not self.ref_projet:
            ref = generate_ref(self.departement)
            while Project.all_objects.filter(ref_projet=ref).exists():
                ref = generate_ref(self.departement)
            self.ref_projet = ref
        super().save(*args, **kwargs)

    def delete(self, deleted_by=None, *args, **kwargs):
        """Soft delete : marque comme supprimé au lieu d'effacer."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if deleted_by:
            self.deleted_by = deleted_by
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])

    def hard_delete(self, *args, **kwargs):
        """Suppression physique réelle (superuser seulement)."""
        super().delete(*args, **kwargs)

    def __str__(self):
        deleted_tag = ' [SUPPRIMÉ]' if self.is_deleted else ''
        return f"{self.ref_projet} — {self.client}{deleted_tag}"