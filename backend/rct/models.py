from django.db import models
from users.models import CustomUser
from projects.models import Project


class RCT(models.Model):
    """Réponse à un appel d'offre — liée à un projet."""

    STATUS_CHOICES = (
        ('en_cours', 'En cours'),
        ('pause',    'En pause'),
        ('termine',  'Terminé'),
    )

    project      = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='rct')
    current_step = models.PositiveIntegerField(default=1)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_cours')
    # Permet de rouvrir le RCT terminé pour correction (phase Kickoff/Archive).
    post_edit_mode = models.BooleanField(default=False)
    created_by   = models.ForeignKey(CustomUser, on_delete=models.SET_NULL,
                       null=True, related_name='rcts_crees')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"RCT — {self.project.ref_projet}"


class Step1(models.Model):
    """Étude de faisabilité des besoins."""
    rct                   = models.OneToOneField(RCT, on_delete=models.CASCADE, related_name='step1')
    cahier_charges        = models.FileField(upload_to='rct/step1/', null=True, blank=True)
    formulaire_interactif = models.FileField(upload_to='rct/step1/', null=True, blank=True)
    # Clés : cahier_charges, formulaire_interactif → liste de chemins stockage (dernier = plus récent).
    file_versions         = models.JSONField(default=dict, blank=True)
    completed             = models.BooleanField(default=False)
    updated_at            = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Step1 — {self.rct}"


class Step2(models.Model):
    """Développement de l'offre."""
    rct                  = models.OneToOneField(RCT, on_delete=models.CASCADE, related_name='step2')
    formulaire_qr_final  = models.FileField(upload_to='rct/step2/', null=True, blank=True)
    exigences_legales    = models.TextField(blank=True, default='')
    exigences_legales_fichier = models.FileField(upload_to='rct/step2/', null=True, blank=True)
    offre_tech_financier = models.FileField(upload_to='rct/step2/', null=True, blank=True)
    fiche_revue_offre    = models.FileField(upload_to='rct/step2/', null=True, blank=True)
    planning             = models.FileField(upload_to='rct/step2/', null=True, blank=True)
    cr_reunions          = models.FileField(upload_to='rct/step2/', null=True, blank=True)
    file_versions        = models.JSONField(default=dict, blank=True)
    completed            = models.BooleanField(default=False)
    updated_at           = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Step2 — {self.rct}"


class Step3(models.Model):
    """Clôture de la réponse à l'offre."""
    DECISION_CHOICES = (
        ('en_attente', 'En attente'),
        ('acceptee',   'Offre acceptée'),
        ('refusee',    'Offre refusée'),
    )

    rct                    = models.OneToOneField(RCT, on_delete=models.CASCADE, related_name='step3')
    derniere_version_offre = models.FileField(upload_to='rct/step3/', null=True, blank=True)
    planning               = models.FileField(upload_to='rct/step3/', null=True, blank=True)
    retour_client          = models.FileField(upload_to='rct/step3/', null=True, blank=True)
    file_versions          = models.JSONField(default=dict, blank=True)
    decision               = models.CharField(max_length=20, choices=DECISION_CHOICES, default='en_attente')
    completed              = models.BooleanField(default=False)
    updated_at             = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Step3 — {self.rct}"


class FRPForm(models.Model):
    """Formulaire FRP Telnet — Fiche de revue de l'offre d'assistance technique."""
    rct        = models.OneToOneField(RCT, on_delete=models.CASCADE, related_name='frp')
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Revue et analyse du besoin (6 questions, poids: 5,4,5,3,3,2) ─────
    rev1_score      = models.FloatField(default=0)
    rev1_conclusion = models.TextField(blank=True, default='')
    rev2_score      = models.FloatField(default=0)
    rev2_conclusion = models.TextField(blank=True, default='')
    rev3_score      = models.FloatField(default=0)
    rev3_conclusion = models.TextField(blank=True, default='')
    rev4_score      = models.FloatField(default=0)
    rev4_conclusion = models.TextField(blank=True, default='')
    rev5_score      = models.FloatField(default=0)
    rev5_conclusion = models.TextField(blank=True, default='')
    rev6_score      = models.FloatField(default=0)
    rev6_conclusion = models.TextField(blank=True, default='')

    # ── Étude de faisabilité (7 questions, poids: 5,5,4,4,3,2,2) ─────────
    fais1_score       = models.FloatField(default=0)
    fais1_commentaire = models.TextField(blank=True, default='')
    fais2_score       = models.FloatField(default=0)
    fais2_commentaire = models.TextField(blank=True, default='')
    fais3_score       = models.FloatField(default=0)
    fais3_commentaire = models.TextField(blank=True, default='')
    fais4_score       = models.FloatField(default=0)
    fais4_commentaire = models.TextField(blank=True, default='')
    fais5_score       = models.FloatField(default=0)
    fais5_commentaire = models.TextField(blank=True, default='')
    fais6_score       = models.FloatField(default=0)
    fais6_commentaire = models.TextField(blank=True, default='')
    fais7_score       = models.FloatField(default=0)
    fais7_commentaire = models.TextField(blank=True, default='')

    # ── Décision ──────────────────────────────────────────────────────────
    decision_frp      = models.CharField(max_length=20, blank=True, default='')
    commentaire_final = models.TextField(blank=True, default='')

    # ── Besoins ponctuels (liste JSON dynamique) ───────────────────────────
    besoins_ponctuels = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"FRP — {self.rct}"


class FROForm(models.Model):
    """Fiche de revue de l'offre d'assistance technique (GPT_RCT_TM_003_FR_08)."""
    rct        = models.OneToOneField(RCT, on_delete=models.CASCADE, related_name='fro')
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Revue des exigences (16 questions) ────────────────────────────────
    exig1_score  = models.FloatField(default=0); exig1_conclusion  = models.TextField(blank=True, default='')
    exig2_score  = models.FloatField(default=0); exig2_conclusion  = models.TextField(blank=True, default='')
    exig3_score  = models.FloatField(default=0); exig3_conclusion  = models.TextField(blank=True, default='')
    exig4_score  = models.FloatField(default=0); exig4_conclusion  = models.TextField(blank=True, default='')
    exig5_score  = models.FloatField(default=0); exig5_conclusion  = models.TextField(blank=True, default='')
    exig6_score  = models.FloatField(default=0); exig6_conclusion  = models.TextField(blank=True, default='')
    exig7_score  = models.FloatField(default=0); exig7_conclusion  = models.TextField(blank=True, default='')
    exig8_score  = models.FloatField(default=0); exig8_conclusion  = models.TextField(blank=True, default='')
    exig9_score  = models.FloatField(default=0); exig9_conclusion  = models.TextField(blank=True, default='')
    exig10_score = models.FloatField(default=0); exig10_conclusion = models.TextField(blank=True, default='')
    exig11_score = models.FloatField(default=0); exig11_conclusion = models.TextField(blank=True, default='')
    exig12_score = models.FloatField(default=0); exig12_conclusion = models.TextField(blank=True, default='')
    exig13_score = models.FloatField(default=0); exig13_conclusion = models.TextField(blank=True, default='')
    exig14_score = models.FloatField(default=0); exig14_conclusion = models.TextField(blank=True, default='')
    exig15_score = models.FloatField(default=0); exig15_conclusion = models.TextField(blank=True, default='')
    exig16_score = models.FloatField(default=0); exig16_conclusion = models.TextField(blank=True, default='')

    # ── Étude de faisabilité (17 questions) ───────────────────────────────
    fais1_score  = models.FloatField(default=0); fais1_commentaire  = models.TextField(blank=True, default='')
    fais2_score  = models.FloatField(default=0); fais2_commentaire  = models.TextField(blank=True, default='')
    fais3_score  = models.FloatField(default=0); fais3_commentaire  = models.TextField(blank=True, default='')
    fais4_score  = models.FloatField(default=0); fais4_commentaire  = models.TextField(blank=True, default='')
    fais5_score  = models.FloatField(default=0); fais5_commentaire  = models.TextField(blank=True, default='')
    fais6_score  = models.FloatField(default=0); fais6_commentaire  = models.TextField(blank=True, default='')
    fais7_score  = models.FloatField(default=0); fais7_commentaire  = models.TextField(blank=True, default='')
    fais8_score  = models.FloatField(default=0); fais8_commentaire  = models.TextField(blank=True, default='')
    fais9_score  = models.FloatField(default=0); fais9_commentaire  = models.TextField(blank=True, default='')
    fais10_score = models.FloatField(default=0); fais10_commentaire = models.TextField(blank=True, default='')
    fais11_score = models.FloatField(default=0); fais11_commentaire = models.TextField(blank=True, default='')
    fais12_score = models.FloatField(default=0); fais12_commentaire = models.TextField(blank=True, default='')
    fais13_score = models.FloatField(default=0); fais13_commentaire = models.TextField(blank=True, default='')
    fais14_score = models.FloatField(default=0); fais14_commentaire = models.TextField(blank=True, default='')
    fais15_score = models.FloatField(default=0); fais15_commentaire = models.TextField(blank=True, default='')
    fais16_score = models.FloatField(default=0); fais16_commentaire = models.TextField(blank=True, default='')
    fais17_score = models.FloatField(default=0); fais17_commentaire = models.TextField(blank=True, default='')

    # ── Décision ──────────────────────────────────────────────────────────
    faisabilite_pct   = models.FloatField(default=0)
    estimation        = models.TextField(blank=True, default='')
    t0_possible       = models.CharField(max_length=20, blank=True, default='')
    decision_fro      = models.CharField(max_length=20, blank=True, default='')
    commentaire_final = models.TextField(blank=True, default='')

    def __str__(self):
        return f"FRO — {self.rct}"
