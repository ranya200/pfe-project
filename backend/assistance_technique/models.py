from django.db import models
from projects.models import Project
from users.models import CustomUser


# ─── Main Model ──────────────────────────────────────────────────────────────

class AssistanceTechnique(models.Model):
    STATUS_CHOICES = (
        ('en_cours',  'En cours'),
        ('terminee',  'Terminée'),
    )
    STEP_CHOICES = ((1, 'Lancement'), (2, 'Réalisation'), (3, 'Suivi'), (4, 'Évaluation'))

    project            = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='assistances')
    client             = models.CharField(max_length=200)
    type_prestation    = models.CharField(max_length=100, default='Assistance Technique')
    directeur_activite = models.CharField(max_length=200, blank=True)
    current_step       = models.IntegerField(default=1, choices=STEP_CHOICES)
    status             = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_cours')
    created_by         = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True,
                             related_name='at_created')
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AT-{self.pk} — {self.project} — Étape {self.current_step}"


# ─── Step 1: Lancement ───────────────────────────────────────────────────────

class Step1_Lancement(models.Model):
    at                   = models.OneToOneField(AssistanceTechnique, on_delete=models.CASCADE, related_name='step1')
    nom_projet           = models.CharField(max_length=200, blank=True)
    reference_document   = models.CharField(max_length=200, blank=True)
    auteur               = models.CharField(max_length=200, blank=True)
    date                 = models.DateField(null=True, blank=True)
    objectifs_principaux = models.TextField(blank=True)
    contribution_client  = models.TextField(blank=True)
    contribution_telnet  = models.TextField(blank=True)
    t0_date_demarrage    = models.DateField(null=True, blank=True)
    duree_planifiee      = models.CharField(max_length=100, blank=True)
    deplacements_prevus  = models.JSONField(default=list, blank=True)
    competences_requises = models.TextField(blank=True)
    software_requis      = models.TextField(blank=True)
    hardware_requis      = models.TextField(blank=True)
    outils_requis        = models.TextField(blank=True)

    def __str__(self):
        return f"Step1 — {self.at}"


class MembreEquipe(models.Model):
    ROLE_CHOICES = (
        ('admin',           'Administrateur'),
        ('resp_qualite',    'Responsable Qualité'),
        ('chef_projet',     'Chef de Projet'),
        ('developpeur',     'Développeur'),
        ('tech_lead',       'Tech Lead'),
        ('ingenieur',       'Ingénieur'),
        ('validateur',      'Validateur'),
        ('charge_affaires', "Chargé d'Affaires"),
        ('consultant',      'Consultant'),
        ('stagiaire',       'Stagiaire'),
    )
    step1           = models.ForeignKey(Step1_Lancement, on_delete=models.CASCADE, related_name='membres')
    role            = models.CharField(max_length=30, choices=ROLE_CHOICES)
    nom             = models.CharField(max_length=200)
    responsabilites = models.TextField(blank=True)

    def __str__(self):
        return f"{self.nom} ({self.role})"


class Contact(models.Model):
    PARTIE_CHOICES = (('telnet', 'Telnet'), ('client', 'Client'))
    step1     = models.ForeignKey(Step1_Lancement, on_delete=models.CASCADE, related_name='contacts')
    partie    = models.CharField(max_length=10, choices=PARTIE_CHOICES)
    nom       = models.CharField(max_length=200)
    role      = models.CharField(max_length=200, blank=True)
    email     = models.EmailField(blank=True)
    telephone = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return f"{self.nom} ({self.partie})"


class FormationPlanifiee(models.Model):
    step1      = models.ForeignKey(Step1_Lancement, on_delete=models.CASCADE, related_name='formations')
    formation  = models.CharField(max_length=300)
    dates      = models.CharField(max_length=200, blank=True)
    ressources = models.CharField(max_length=300, blank=True)


class PlanCommunication(models.Model):
    TYPE_CHOICES = (('technique', 'Réunion technique'), ('pilotage', 'Réunion de pilotage'))
    step1          = models.ForeignKey(Step1_Lancement, on_delete=models.CASCADE, related_name='plan_communication')
    type_reunion   = models.CharField(max_length=20, choices=TYPE_CHOICES)
    objectif       = models.CharField(max_length=300, blank=True)
    frequence      = models.CharField(max_length=100, blank=True)
    responsable    = models.CharField(max_length=200, blank=True)
    participants   = models.CharField(max_length=300, blank=True)
    element_entree = models.CharField(max_length=300, blank=True)
    element_sortie = models.CharField(max_length=300, blank=True)
    date_prevue    = models.DateField(null=True, blank=True)


class RisqueIdentifie(models.Model):
    step1                = models.ForeignKey(Step1_Lancement, on_delete=models.CASCADE, related_name='risques')
    description_risque   = models.TextField()
    approche_attenuation = models.TextField(blank=True)


class PointOuvert(models.Model):
    step1       = models.ForeignKey(Step1_Lancement, on_delete=models.CASCADE, related_name='points_ouverts')
    description = models.TextField()
    responsable = models.CharField(max_length=200, blank=True)
    delai       = models.DateField(null=True, blank=True)


# ─── Step 2: Réalisation ─────────────────────────────────────────────────────

class Step2_Realisation(models.Model):
    at = models.OneToOneField(AssistanceTechnique, on_delete=models.CASCADE, related_name='step2')

    # ── Plan de Qualité — Informations générales ──────────────────────────────
    pq_nom_projet      = models.CharField(max_length=200, blank=True)
    pq_reference_doc   = models.CharField(max_length=200, blank=True)
    pq_date            = models.DateField(null=True, blank=True)
    pq_auteur          = models.CharField(max_length=200, blank=True)
    pq_version         = models.CharField(max_length=50, blank=True, default='1.0')
    pq_objectif        = models.TextField(blank=True)
    pq_domaine         = models.TextField(blank=True)
    pq_documents_ref   = models.TextField(blank=True)

    # ── Plan de Qualité — Tables (JSONField) ──────────────────────────────────
    pq_presentation_projet   = models.TextField(blank=True)
    # [{role, nom_complet, email, telephone}]
    pq_org_client            = models.JSONField(default=list, blank=True)
    # [{role, nom, responsabilites}]
    pq_membres_equipe_pq     = models.JSONField(default=list, blank=True)
    # [{role, nom}]
    pq_equipe_validation     = models.JSONField(default=list, blank=True)
    # [{competence, spm, pm, tl, scm_c, id, iv}]
    pq_competences           = models.JSONField(default=list, blank=True)
    # [{formation, stagiaires, formateur, date_prevue, type_formation}]
    pq_formations      = models.JSONField(default=list, blank=True)
    pq_planning              = models.TextField(blank=True)
    # [{sujet, parties_prenantes, moyen}]
    pq_communication_pq      = models.JSONField(default=list, blank=True)
    # [{type_reunion, objectif, resultats, pilote, participants, frequence}]
    pq_reunions_pq           = models.JSONField(default=list, blank=True)
    pq_cycle_vie             = models.TextField(blank=True)
    # [{phase, entrees_client, sorties_telnet}]
    pq_phases                = models.JSONField(default=list, blank=True)
    pq_criteres_acceptation  = models.TextField(blank=True)
    # [{id_jalon, description, reference_interne}]
    pq_jalons                = models.JSONField(default=list, blank=True)
    # [{nom, usage, date_reception}]
    pq_materiels       = models.JSONField(default=list, blank=True)
    # [{nom, version, usage, date_acquisition}]
    pq_outils          = models.JSONField(default=list, blank=True)
    # [{nom_logiciel, version, usage}]
    pq_env_dev         = models.JSONField(default=list, blank=True)
    # [{nom_logiciel, version, usage}]
    pq_env_test        = models.JSONField(default=list, blank=True)
    pq_garantie              = models.TextField(blank=True)
    pq_has_garantie          = models.BooleanField(default=False)
    pq_support_maintenance   = models.TextField(blank=True)
    pq_has_maintenance       = models.BooleanField(default=False)
    # [{evenement, description, nature, date, ref_evenement, statut_changement, risques, commentaires}]
    pq_incidents_secu  = models.JSONField(default=list, blank=True)

    # ── Fichiers attachés (org chart client, diagramme cycle de vie) ──────────
    pq_org_chart_url   = models.CharField(max_length=500, blank=True)
    pq_cycle_vie_file  = models.CharField(max_length=500, blank=True)

    # ── Versioning automatique ────────────────────────────────────────────────
    pq_version_num     = models.PositiveIntegerField(default=0)

    # ── Plan de Configuration ─────────────────────────────────────────────────
    pc_outils_cm       = models.TextField(blank=True)
    pc_formations_cm   = models.TextField(blank=True)
    pc_politiques      = models.TextField(blank=True)
    pc_gestion_branches= models.TextField(blank=True)
    # [{item, responsable, evenement, date, localisation}]
    pc_items_config    = models.JSONField(default=list, blank=True)
    # [{id_baseline, contenu, date}]
    pc_baselines       = models.JSONField(default=list, blank=True)
    pc_versioning_docs = models.TextField(blank=True)
    # [{version, description, document_url}]
    pc_versioning_docs_items = models.JSONField(default=list, blank=True)
    pc_versioning_src  = models.TextField(blank=True)
    # [{version, description, document_url}]
    pc_versioning_src_items  = models.JSONField(default=list, blank=True)
    # {q1..q8} — Questions à répondre sur la gestion des branches
    pc_branches_qa     = models.JSONField(default=dict, blank=True)
    # [{date_audit, auditeur, constats, actions}]
    pc_audits          = models.JSONField(default=list, blank=True)

    # ── Assets Management Plan ────────────────────────────────────────────────
    # [{id_asset, nom, type, version, responsable, statut, commentaire}]
    amp_assets         = models.JSONField(default=list, blank=True)

    # ── Liste des Livrables ───────────────────────────────────────────────────
    # [{id_livrable, lot, nom, description, date_prevue, responsable, statut}]
    livrables          = models.JSONField(default=list, blank=True)

    # ── PV de Libération ──────────────────────────────────────────────────────
    pv_nom_projet      = models.CharField(max_length=200, blank=True)
    pv_reference       = models.CharField(max_length=200, blank=True)   # ex: PVL.MUL.TRIAD-DEV.855.22 – Éd:01
    pv_objet_livraison = models.TextField(blank=True)                    # ce qui est livré exactement
    pv_perimetre       = models.TextField(blank=True)
    pv_type_livraison  = models.CharField(max_length=50, blank=True)     # documents/logiciels/sources/correctif/materiel/systeme
    pv_date_revue      = models.DateField(null=True, blank=True)
    pv_decision        = models.CharField(max_length=20, blank=True)  # accepte / rejete / reserves
    pv_commentaire     = models.TextField(blank=True)
    # [{role, nom, organisation}]
    pv_participants    = models.JSONField(default=list, blank=True)
    # [{categorie, critere, preuve, commentaire, conforme}]  conforme: oui/non/na
    pv_criteres        = models.JSONField(default=list, blank=True)
    # [{action, responsable, delai}]
    pv_actions         = models.JSONField(default=list, blank=True)

    # Backward-compat
    notes              = models.TextField(blank=True)

    def __str__(self):
        return f"Step2 — {self.at}"


# ─── Step 3: Suivi ───────────────────────────────────────────────────────────

class Step3_Suivi(models.Model):
    at    = models.OneToOneField(AssistanceTechnique, on_delete=models.CASCADE, related_name='step3')
    notes = models.TextField(blank=True)
    # [{type_reunion, pilote, frequence, participants, date_tenue, statut, compte_rendu, actions_decidees}]
    suivi_reunions = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Step3 — {self.at}"


class ChargeRessource(models.Model):
    step3         = models.ForeignKey(Step3_Suivi, on_delete=models.CASCADE, related_name='charges_ressources')
    nom_ressource = models.CharField(max_length=200)
    role          = models.CharField(max_length=200, blank=True)

    # ── Effort réel (déjà existant — renseigné au fil du suivi) ────────────
    semaine_1     = models.FloatField(default=0)
    semaine_2     = models.FloatField(default=0)
    semaine_3     = models.FloatField(default=0)
    semaine_4     = models.FloatField(default=0)

    # ── Effort planifié (nouveau — renseigné à la planification initiale) ──
    # Sert au calcul de l'écart d'effort du dashboard QA :
    # Variance = Sum(Réel - Planifié) / Total Planifié
    semaine_1_planifie = models.FloatField(default=0)
    semaine_2_planifie = models.FloatField(default=0)
    semaine_3_planifie = models.FloatField(default=0)
    semaine_4_planifie = models.FloatField(default=0)

    @property
    def total(self):
        return self.semaine_1 + self.semaine_2 + self.semaine_3 + self.semaine_4

    @property
    def total_planifie(self):
        return (
            self.semaine_1_planifie + self.semaine_2_planifie
            + self.semaine_3_planifie + self.semaine_4_planifie
        )

    def __str__(self):
        return f"{self.nom_ressource} — total: {self.total}h"


class EquipementECME(models.Model):
    STATUT_CHOICES = (
        ('en_cours',   'En cours'),
        ('disponible', 'Disponible'),
        ('maintenance','En maintenance'),
    )
    step3       = models.ForeignKey(Step3_Suivi, on_delete=models.CASCADE, related_name='equipements')
    ecme_id     = models.CharField(max_length=50)
    designation = models.CharField(max_length=300)
    type_ecme   = models.CharField(max_length=200, blank=True)
    fournisseur = models.CharField(max_length=200, blank=True)
    statut      = models.CharField(max_length=20, choices=STATUT_CHOICES, default='disponible')

    def __str__(self):
        return f"{self.ecme_id} — {self.designation}"


class ReunionSuivi(models.Model):
    TYPE_CHOICES = (
        ('kick_off',     'Kick-off'),
        ('suivi_hebdo',  'Suivi hebdomadaire'),
        ('autre',        'Autre'),
    )
    STATUT_CHOICES = (
        ('Planifiée',  'Planifiée'),
        ('Tenue',      'Tenue'),
        ('Reportée',   'Reportée'),
        ('Annulée',    'Annulée'),
    )
    step3            = models.ForeignKey(Step3_Suivi, on_delete=models.CASCADE, related_name='reunions')
    date             = models.DateField(null=True, blank=True)
    date_tenue       = models.CharField(max_length=20, blank=True)   # ISO date string from frontend
    type_reunion     = models.CharField(max_length=100, blank=True)  # free text from step1/step2
    statut           = models.CharField(max_length=20, choices=STATUT_CHOICES, default='Planifiée', blank=True)
    objectif         = models.TextField(blank=True)
    pilote           = models.CharField(max_length=200, blank=True)
    frequence        = models.CharField(max_length=100, blank=True)
    participants     = models.TextField(blank=True)
    actions          = models.TextField(blank=True)
    commentaire      = models.TextField(blank=True)
    source           = models.CharField(max_length=50, blank=True)
    compte_rendu     = models.FileField(upload_to='comptes_rendus/', blank=True, null=True)

    def __str__(self):
        return f"Réunion {self.type_reunion} — {self.date_tenue or self.date}"


# ─── Step 4: Évaluation ──────────────────────────────────────────────────────

class Step4_Evaluation(models.Model):
    at                           = models.OneToOneField(AssistanceTechnique, on_delete=models.CASCADE, related_name='step4')
    nom_projet                   = models.CharField(max_length=200, blank=True)
    cdc_ref_commande             = models.CharField(max_length=200, blank=True)
    date_evaluation              = models.DateField(null=True, blank=True)
    client_referent              = models.CharField(max_length=200, blank=True)
    fonction                     = models.CharField(max_length=200, blank=True)
    commentaire_general          = models.TextField(blank=True)
    capitalisation_bonne_pratique= models.TextField(blank=True)
    
    # Bilan - changed to TextField to allow free text and avoid strict validation
    lien_matrice_competences     = models.TextField(blank=True)
    nouvelles_competences        = models.TextField(blank=True)
    enregistrements_a_maj        = models.TextField(blank=True)
    formations_a_planifier       = models.TextField(blank=True)
    besoin_recrutement           = models.TextField(blank=True)

    # Added fields from migration 0010
    bilan_projet                 = models.CharField(max_length=200, blank=True)
    bilan_client                 = models.CharField(max_length=200, blank=True)
    bilan_activite               = models.CharField(max_length=200, blank=True)
    bilan_etat                   = models.CharField(max_length=50, blank=True, default='En cours')
    bilan_periode                = models.CharField(max_length=100, blank=True)
    plan_action_file_url         = models.CharField(max_length=500, blank=True)

    # Évaluation client — document d'évaluation client importé (ex: enquête remplie par le client)
    document_evaluation_client_url = models.CharField(max_length=500, blank=True)

    @property
    def indice_satisfaction_global(self):
        """
        Formule : =MOYENNE(scores) — identique à =MOYENNE(N17:N26) dans Excel.
        Retourne un float 0.0–1.0 (ex: 0.75 = 75 %).
        """
        criteres = self.criteres.exclude(satisfaction__in=['na', ''])
        if not criteres.exists():
            return None
        scores = [c.score for c in criteres]
        return round(sum(scores) / len(scores), 3)

    def __str__(self):
        return f"Step4 — {self.at}"


class CritereEvaluation(models.Model):
    CATEGORIE_CHOICES = (
        ('organisation_processus',      'Organisation / Processus'),
        ('taches',                      'Tâches'),
        ('moyens',                      'Moyens'),
        ('comportement_competences',    'Comportement et compétences'),
        ('securite_information',        'Sécurité de l\'information'),
    )
    SATISFACTION_CHOICES = (
        ('tres_satisfait',   'Très satisfait'),
        ('satisfait',        'Satisfait'),
        ('insatisfait',      'Insatisfait'),
        ('tres_insatisfait', 'Très insatisfait'),
        ('na',               'N/A'),
    )
    # 1 → 0.2 | 2 → 0.3 | 3 → 0.8 | 4 → 1.0
    SCORE_MAP = {
        'tres_insatisfait': 0.2,
        'insatisfait':      0.3,
        'satisfait':        0.8,
        'tres_satisfait':   1.0,
        'na':               0.0,
    }

    step4        = models.ForeignKey(Step4_Evaluation, on_delete=models.CASCADE, related_name='criteres')
    categorie    = models.CharField(max_length=40, choices=CATEGORIE_CHOICES)
    numero       = models.IntegerField()
    critere      = models.CharField(max_length=400)
    satisfaction = models.CharField(max_length=20, choices=SATISFACTION_CHOICES, default='na')
    commentaire  = models.TextField(blank=True)

    @property
    def score(self):
        return self.SCORE_MAP.get(self.satisfaction, 0.0)

    class Meta:
        ordering = ['numero']

    def __str__(self):
        return f"C{self.numero} — {self.critere[:50]}"


class BilanMethodesMoyens(models.Model):
    REPONSE_CHOICES = (('oui', 'Oui'), ('non', 'Non'), ('na', 'N/A'), ('-', '-'))
    step4       = models.ForeignKey(Step4_Evaluation, on_delete=models.CASCADE, related_name='bilan_methodes')
    question    = models.CharField(max_length=400)
    reponse     = models.CharField(max_length=5, choices=REPONSE_CHOICES, default='-')
    commentaire = models.TextField(blank=True)

    def __str__(self):
        return f"Q: {self.question[:50]}"


class AppreciationClient(models.Model):
    ELEMENT_CHOICES = (
        ('enquete_satisfaction',      "Enquête de satisfaction"),
        ('emails_satisfaction',       "Emails de satisfaction"),
        ('emails_nonsatisfaction',    "Emails de non-satisfaction"),
        ('reclamations',              "Réclamations"),
    )
    REPONSE_CHOICES = (('oui', 'Oui'), ('non', 'Non'), ('-', '-'))
    step4          = models.ForeignKey(Step4_Evaluation, on_delete=models.CASCADE, related_name='appreciations')
    element        = models.CharField(max_length=30, choices=ELEMENT_CHOICES)
    reponse        = models.CharField(max_length=5, choices=REPONSE_CHOICES, default='-')
    lien_archivage = models.CharField(max_length=300, blank=True)


class ActionBilan(models.Model):
    TYPE_CHOICES = (
        ('corrective',   'Action corrective'),
        ('preventive',   'Action préventive'),
        ('amelioration', "Action d'amélioration"),
    )
    step4       = models.ForeignKey(Step4_Evaluation, on_delete=models.CASCADE, related_name='actions_bilan')
    action_id   = models.CharField(max_length=50, blank=True)
    type_action = models.CharField(max_length=20, choices=TYPE_CHOICES)
    action      = models.TextField()
    due_date    = models.DateField(null=True, blank=True)
    responsable = models.CharField(max_length=200, blank=True)


class ParticipantBilan(models.Model):
    step4           = models.ForeignKey(Step4_Evaluation, on_delete=models.CASCADE, related_name='participants_bilan')
    fonction        = models.CharField(max_length=200, blank=True)
    nom             = models.CharField(max_length=200)
    note            = models.CharField(max_length=100, blank=True)
    est_destinataire= models.BooleanField(default=False)
    est_cc          = models.BooleanField(default=False)

    def __str__(self):
        return self.nom


# ─── Default data helpers ────────────────────────────────────────────────────

DEFAULT_CRITERES = [
    ('organisation_processus', 1, "Efficacité de réponse aux demandes"),
    ('organisation_processus', 2, "Respect des processus et méthodes spécifiés"),
    ('taches',                 3, "Respect du délai de soumission des tâches"),
    ('taches',                 4, "Qualité des tâches"),
    ('moyens',                 5, "Contrôle et connaissances des outils"),
    ('comportement_competences', 6, "Compétences"),
    ('comportement_competences', 7, "Communication"),
    ('comportement_competences', 8, "Réactivité"),
    ('comportement_competences', 9, "Autonomie et esprit d'initiative"),
    ('securite_information',   10, "Confidentialité / Intégrité / Disponibilité"),
]

DEFAULT_BILAN_QUESTIONS = [
    "Les méthodes de travail convenues ont-elles été respectées ?",
    "Les outils et moyens fournis étaient-ils adaptés ?",
    "Le planning initial a-t-il été respecté ?",
    "La qualité des livrables est-elle conforme aux attentes ?",
    "La communication avec l'équipe a-t-elle été fluide ?",
    "Les risques identifiés ont-ils été correctement gérés ?",
    "Les réunions de suivi ont-elles été efficaces ?",
    "La documentation produite est-elle complète ?",
    "Les exigences de sécurité ont-elles été respectées ?",
    "Le bilan de compétences est-il à jour ?",
]