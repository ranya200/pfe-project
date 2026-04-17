from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.conf import settings
from projects.models import Project


# ══════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════

def compute_mesure(criticality: int) -> str:
    if criticality >= 8:
        return "Risque inacceptable: plan de contingence"
    elif criticality >= 4:
        return "A surveiller: plan d'atténuation"
    elif criticality >= 1:
        return "Risque acceptable: Clôture autorisée"
    return ""


def compute_level(criticality: int) -> str:
    if criticality >= 8:
        return "Inacceptable"
    elif criticality >= 4:
        return "Surveiller"
    return "Acceptable"


# ══════════════════════════════════════════════════════════════════
# MANAGERS
# ══════════════════════════════════════════════════════════════════

class ActiveRiskManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllRiskManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset()


# ══════════════════════════════════════════════════════════════════
# RISK — Step 1 : Analyse
# ══════════════════════════════════════════════════════════════════

class Risk(models.Model):

    PROCESS_CHOICES = [
        ("Relations Clients", "Relations Clients"),
        ("Ressources",        "Ressources"),
        ("Planification",     "Planification"),
        ("Technique",         "Technique"),
        ("Documentation",     "Documentation"),
        ("Réglementaire",     "Réglementaire"),
        ("Sécurité",          "Sécurité"),
        ("Qualité",           "Qualité"),
    ]

    ACTIVITY_CHOICES = [
        ("MEDIA",     "Média & Énergie"),
        ("SPACE",     "Space"),
        ("BE",        "BE Electronique"),
        ("MONETIQUE", "Monétique"),
        ("SI",        "SI"),
        ("TELECOM",   "Télécom"),
        ("RH",        "RH"),
        ("QUALITE",   "Qualité"),
        ("ADMIN",     "Admin"),
    ]

    TYPE_CHOICES = [
        ("Interne", "Interne"),
        ("Externe", "Externe"),
    ]

    ORIGIN_CHOICES = [
        ("Telnet", "Telnet"),
        ("Client", "Client"),
    ]

    STATUS_CHOICES = [
        ("Ouvert",   "Ouvert"),
        ("Atténué",  "Atténué"),
        ("Clôturé",  "Clôturé"),
    ]

    # ── Identification ─────────────────────────────────────────────
    code    = models.CharField(max_length=10, editable=False, db_index=True)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="risks"
    )

    # ── Step 1 : Analyse ───────────────────────────────────────────
    process           = models.CharField(max_length=30, choices=PROCESS_CHOICES)
    activity          = models.CharField(max_length=20, choices=ACTIVITY_CHOICES)
    title             = models.CharField(max_length=300)
    risk_type         = models.CharField(max_length=10, choices=TYPE_CHOICES)
    origin            = models.CharField(max_length=10, choices=ORIGIN_CHOICES)
    causes            = models.TextField()
    consequences      = models.TextField()
    existing_measures = models.TextField(blank=True)

    # ── Statut global ──────────────────────────────────────────────
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="Ouvert"
    )

    # ── Traçabilité ISO 9001 §7.5 ──────────────────────────────────
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="risks_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Soft Delete ────────────────────────────────────────────────
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="risks_deleted",
    )

    objects     = ActiveRiskManager()
    all_objects = AllRiskManager()

    class Meta:
        ordering        = ["code"]
        unique_together = [("project", "code")]

    def save(self, *args, **kwargs):
        if not self.code:
            existing = (
                Risk.all_objects
                .filter(project=self.project)
                .exclude(code="")
                .order_by("id")
                .values_list("code", flat=True)
            )
            nums = []
            for c in existing:
                try:
                    nums.append(int(c.lstrip("R")))
                except ValueError:
                    pass
            next_num  = (max(nums) + 1) if nums else 1
            self.code = f"R{next_num}"
        super().save(*args, **kwargs)

    def delete(self, deleted_by=None, *args, **kwargs):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if deleted_by:
            self.deleted_by = deleted_by
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"[{self.code}] {self.title}"


# ══════════════════════════════════════════════════════════════════
# RISK EVALUATION — Step 2 : Évaluation initiale
# ══════════════════════════════════════════════════════════════════

class RiskEvaluation(models.Model):

    DECISION_CHOICES = [
        ("Acceptation", "Acceptation"),
        ("Réduction",   "Réduction"),
        ("Éradication", "Éradication"),
    ]

    risk = models.OneToOneField(
        Risk, on_delete=models.CASCADE, related_name="evaluation"
    )

    probability  = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)]
    )
    severity     = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)]
    )
    criticality  = models.IntegerField(editable=False, default=0)

    level  = models.CharField(max_length=15, editable=False, default="Acceptable")
    mesure = models.CharField(max_length=100, editable=False, blank=True)

    decision      = models.CharField(
        max_length=12, choices=DECISION_CHOICES, blank=True
    )
    justification = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.criticality = self.probability * self.severity
        self.mesure      = compute_mesure(self.criticality)
        self.level       = compute_level(self.criticality)
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Éval. {self.risk.code} — {self.level} "
            f"(P={self.probability}, G={self.severity}, C={self.criticality})"
        )


# ══════════════════════════════════════════════════════════════════
# ACTION PLAN — Step 3 : Plan d'action
# ══════════════════════════════════════════════════════════════════

class ActionPlan(models.Model):

    STATUS_CHOICES = [
        ("IDLE",        "IDLE"),
        ("Blocked",     "Blocked"),
        ("In Progress", "In Progress"),
        ("Done",        "Done"),
    ]

    risk = models.OneToOneField(
        Risk, on_delete=models.CASCADE, related_name="action_plan"
    )

    # ── Action ────────────────────────────────────────────────────
    action      = models.TextField()
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="action_plans",
    )

    # ── Planification ─────────────────────────────────────────────
    planned_date = models.DateField()
    actual_date  = models.DateField(null=True, blank=True)

    # ── Suivi ─────────────────────────────────────────────────────
    progress      = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    status        = models.CharField(
        max_length=12, choices=STATUS_CHOICES, default="IDLE"
    )
    closure_date  = models.DateField(null=True, blank=True)
    registration  = models.TextField(blank=True)

    # ── Évaluation efficacité ─────────────────────────────────────
    effectiveness_criteria   = models.TextField(blank=True)
    efficacite               = models.TextField(blank=True)   # ← champ libre Step 3
    initial_value            = models.CharField(max_length=200, blank=True)
    final_value              = models.CharField(max_length=200, blank=True)
    effectiveness_percentage = models.FloatField(null=True, blank=True)

    # ── Commentaire ───────────────────────────────────────────────
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Action [{self.risk.code}] — {self.status} ({self.progress}%)"


# ══════════════════════════════════════════════════════════════════
# RESIDUAL RISK — Step 4 : Risque résiduel
# ══════════════════════════════════════════════════════════════════

class ResidualRisk(models.Model):

    risk = models.OneToOneField(
        Risk, on_delete=models.CASCADE, related_name="residual"
    )

    probability = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)]
    )
    severity    = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)]
    )
    criticality = models.IntegerField(editable=False, default=0)

    level  = models.CharField(max_length=15, editable=False, default="Acceptable")
    mesure = models.CharField(max_length=100, editable=False, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.criticality = self.probability * self.severity
        self.mesure      = compute_mesure(self.criticality)
        self.level       = compute_level(self.criticality)

        try:
            initial_c = self.risk.evaluation.criticality
            if initial_c > 0 and hasattr(self.risk, "action_plan"):
                pct = ((initial_c - self.criticality) / initial_c) * 100
                self.risk.action_plan.effectiveness_percentage = round(pct, 1)
                self.risk.action_plan.save(update_fields=["effectiveness_percentage"])
        except Exception:
            pass

        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Résiduel {self.risk.code} — {self.level} "
            f"(P={self.probability}, G={self.severity}, C={self.criticality})"
        )