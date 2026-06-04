from rest_framework import serializers
from .models import (
    AssistanceTechnique,
    Step1_Lancement, MembreEquipe, Contact, FormationPlanifiee,
    PlanCommunication, RisqueIdentifie, PointOuvert,
    Step2_Realisation,
    Step3_Suivi, ChargeRessource, EquipementECME, ReunionSuivi,
    Step4_Evaluation, CritereEvaluation, BilanMethodesMoyens,
    AppreciationClient, ActionBilan, ParticipantBilan,
)


# ─── Step 1 sub-serializers ───────────────────────────────────────────────────

class MembreEquipeSerializer(serializers.ModelSerializer):
    nom = serializers.CharField(allow_blank=True, default='')

    class Meta:
        model = MembreEquipe
        fields = ['id', 'role', 'nom', 'responsabilites']


class ContactSerializer(serializers.ModelSerializer):
    nom = serializers.CharField(allow_blank=True, default='')

    class Meta:
        model = Contact
        fields = ['id', 'partie', 'nom', 'role', 'email', 'telephone']


class FormationPlanifieeSerializer(serializers.ModelSerializer):
    formation = serializers.CharField(allow_blank=True, default='')

    class Meta:
        model = FormationPlanifiee
        fields = ['id', 'formation', 'dates', 'ressources']


class PlanCommunicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanCommunication
        fields = ['id', 'type_reunion', 'objectif', 'frequence', 'responsable', 'participants', 'element_sortie', 'date_prevue']


class RisqueIdentifieSerializer(serializers.ModelSerializer):
    description_risque = serializers.CharField(allow_blank=True, default='')

    class Meta:
        model = RisqueIdentifie
        fields = ['id', 'description_risque', 'approche_attenuation']


class PointOuvertSerializer(serializers.ModelSerializer):
    description = serializers.CharField(allow_blank=True, default='')

    class Meta:
        model = PointOuvert
        fields = ['id', 'description', 'responsable', 'delai']


class Step1Serializer(serializers.ModelSerializer):
    membres           = MembreEquipeSerializer(many=True, required=False)
    contacts          = ContactSerializer(many=True, required=False)
    formations        = FormationPlanifieeSerializer(many=True, required=False)
    plan_communication= PlanCommunicationSerializer(many=True, required=False)
    risques           = RisqueIdentifieSerializer(many=True, required=False)
    points_ouverts    = PointOuvertSerializer(many=True, required=False)

    class Meta:
        model  = Step1_Lancement
        fields = [
            'id', 'nom_projet', 'reference_document', 'auteur', 'date',
            'objectifs_principaux', 'contribution_client', 'contribution_telnet',
            't0_date_demarrage', 'duree_planifiee', 'deplacements_prevus',
            'competences_requises', 'software_requis', 'hardware_requis', 'outils_requis',
            'membres', 'contacts', 'formations', 'plan_communication', 'risques', 'points_ouverts',
        ]

    def _update_nested(self, instance, field_name, model_class, data):
        if data is None:
            return
        getattr(instance, field_name).all().delete()
        for item in data:
            model_class.objects.create(**{field_name.rstrip('s') if field_name != 'plan_communication' else 'step1': instance, **item})

    def update(self, instance, validated_data):
        membres_data           = validated_data.pop('membres', None)
        contacts_data          = validated_data.pop('contacts', None)
        formations_data        = validated_data.pop('formations', None)
        plan_comm_data         = validated_data.pop('plan_communication', None)
        risques_data           = validated_data.pop('risques', None)
        points_ouverts_data    = validated_data.pop('points_ouverts', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        def replace(rel_manager, Model, data, required_key=None):
            """Delete all and recreate. Rows where required_key is empty are skipped."""
            if data is None:
                return
            rel_manager.all().delete()
            for item in data:
                if required_key and not str(item.get(required_key, '')).strip():
                    continue  # Skip incomplete rows (e.g. empty nom)
                Model.objects.create(step1=instance, **item)

        replace(instance.membres,            MembreEquipe,       membres_data,       required_key='nom')
        replace(instance.contacts,           Contact,            contacts_data,      required_key='nom')
        replace(instance.formations,         FormationPlanifiee, formations_data,    required_key='formation')
        replace(instance.plan_communication, PlanCommunication,  plan_comm_data)
        replace(instance.risques,            RisqueIdentifie,    risques_data,       required_key='description_risque')
        replace(instance.points_ouverts,     PointOuvert,        points_ouverts_data, required_key='description')

        return instance


# ─── Step 2 serializer ────────────────────────────────────────────────────────

class Step2Serializer(serializers.ModelSerializer):
    class Meta:
        model  = Step2_Realisation
        fields = [
            'id',
            # Plan de Qualité — général
            'pq_nom_projet', 'pq_reference_doc', 'pq_date', 'pq_auteur',
            'pq_version', 'pq_objectif', 'pq_domaine', 'pq_documents_ref',
            # Plan de Qualité — nouvelles sections
            'pq_presentation_projet',
            'pq_org_client', 'pq_membres_equipe_pq', 'pq_equipe_validation',
            'pq_competences',
            'pq_formations', 'pq_planning',
            'pq_communication_pq', 'pq_reunions_pq',
            'pq_cycle_vie', 'pq_phases',
            'pq_criteres_acceptation', 'pq_jalons',
            'pq_materiels', 'pq_outils',
            'pq_env_dev', 'pq_env_test',
            'pq_garantie', 'pq_has_garantie',
            'pq_support_maintenance', 'pq_has_maintenance',
            'pq_incidents_secu',
            'pq_org_chart_url', 'pq_cycle_vie_file', 'pq_version_num',
            # Plan de Configuration
            'pc_outils_cm', 'pc_formations_cm', 'pc_politiques', 'pc_gestion_branches',
            'pc_branches_qa',
            'pc_items_config', 'pc_baselines',
            'pc_versioning_docs', 'pc_versioning_docs_items',
            'pc_versioning_src', 'pc_versioning_src_items',
            'pc_audits',
            # Assets Management Plan
            'amp_assets',
            # Liste des Livrables
            'livrables',
            # PV de Libération
            'pv_nom_projet', 'pv_reference', 'pv_objet_livraison', 'pv_perimetre',
            'pv_type_livraison', 'pv_date_revue', 'pv_decision',
            'pv_commentaire', 'pv_participants', 'pv_criteres', 'pv_actions',
            # backward-compat
            'notes',
        ]


# ─── Step 3 sub-serializers ───────────────────────────────────────────────────

class ChargeRessourceSerializer(serializers.ModelSerializer):
    total = serializers.ReadOnlyField()

    class Meta:
        model  = ChargeRessource
        fields = ['id', 'nom_ressource', 'role', 'semaine_1', 'semaine_2', 'semaine_3', 'semaine_4', 'total']


class EquipementECMESerializer(serializers.ModelSerializer):
    class Meta:
        model  = EquipementECME
        fields = ['id', 'ecme_id', 'designation', 'type_ecme', 'fournisseur', 'statut']


class ReunionSuiviSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ReunionSuivi
        fields = [
            'id', 'date', 'date_tenue', 'type_reunion', 'statut',
            'objectif', 'pilote', 'frequence',
            'participants', 'actions', 'commentaire', 'source',
            'compte_rendu',
        ]
        extra_kwargs = {
            'date':      {'required': False, 'allow_null': True},
            'type_reunion': {'required': False},
        }


class Step3Serializer(serializers.ModelSerializer):
    charges_ressources = ChargeRessourceSerializer(many=True, required=False)
    equipements        = EquipementECMESerializer(many=True, required=False)
    reunions           = ReunionSuiviSerializer(many=True, required=False)

    class Meta:
        model  = Step3_Suivi
        fields = ['id', 'notes', 'charges_ressources', 'equipements', 'reunions', 'suivi_reunions']

    def update(self, instance, validated_data):
        charges_data     = validated_data.pop('charges_ressources', None)
        equipements_data = validated_data.pop('equipements', None)
        reunions_data    = validated_data.pop('reunions', None)
        suivi_reunions   = validated_data.get('suivi_reunions', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        def replace(rel_manager, Model, data, required_key=None):
            if data is None:
                return
            rel_manager.all().delete()
            for item in data:
                if required_key and not str(item.get(required_key, '')).strip():
                    continue
                # Remove fields not in the model to avoid errors
                safe_fields = {
                    k: v for k, v in item.items()
                    if k in [f.name for f in Model._meta.get_fields()]
                }
                Model.objects.create(step3=instance, **safe_fields)

        replace(instance.charges_ressources, ChargeRessource, charges_data,     required_key='nom_ressource')
        replace(instance.equipements,        EquipementECME,  equipements_data, required_key='designation')

        # If frontend sends suivi_reunions (JSON array), sync it to ReunionSuivi ORM table too
        if suivi_reunions is not None:
            instance.reunions.all().delete()
            reunion_model_fields = {f.name for f in ReunionSuivi._meta.get_fields()}
            for item in suivi_reunions:
                if not isinstance(item, dict):
                    continue
                safe = {k: v for k, v in item.items()
                        if k in reunion_model_fields and k not in ('id', 'step3', 'compte_rendu')}
                # compte_rendu handled separately via saveReunion API
                ReunionSuivi.objects.create(step3=instance, **safe)
        elif reunions_data is not None:
            replace(instance.reunions, ReunionSuivi, reunions_data)

        return instance


# ─── Step 4 sub-serializers ───────────────────────────────────────────────────

class CritereEvaluationSerializer(serializers.ModelSerializer):
    score        = serializers.ReadOnlyField()
    # Accept both legacy strings AND numeric strings (1-4) from the frontend
    satisfaction = serializers.CharField(allow_blank=True, default='na', required=False)

    def validate_satisfaction(self, value):
        # Map numeric → legacy string if needed
        numeric_map = {'1': 'tres_insatisfait', '2': 'insatisfait', '3': 'satisfait', '4': 'tres_satisfait'}
        valid = {'tres_satisfait', 'satisfait', 'insatisfait', 'tres_insatisfait', 'na', ''}
        v = str(value).strip() if value is not None else 'na'
        if v in numeric_map:
            return numeric_map[v]
        if v in valid:
            return v or 'na'
        return 'na'

    class Meta:
        model  = CritereEvaluation
        fields = ['id', 'categorie', 'numero', 'critere', 'satisfaction', 'score', 'commentaire']


class BilanMethodesMoyensSerializer(serializers.ModelSerializer):
    # Normalize frontend display values ('Oui', 'Non', 'N/A') → model choices
    reponse = serializers.CharField(allow_blank=True, default='-', required=False)

    def validate_reponse(self, value):
        mapping = {'oui': 'oui', 'non': 'non', 'na': 'na', '-': '-',
                   'Oui': 'oui', 'Non': 'non', 'N/A': 'na', 'Partiel': 'na'}
        return mapping.get(value, '-')

    class Meta:
        model  = BilanMethodesMoyens
        fields = ['id', 'question', 'reponse', 'commentaire']


class AppreciationClientSerializer(serializers.ModelSerializer):
    # Normalize frontend display values → model choices
    reponse = serializers.CharField(allow_blank=True, default='-', required=False)

    lien_archivage = serializers.CharField(allow_blank=True, required=False)

    def validate_reponse(self, value):
        mapping = {'oui': 'oui', 'non': 'non', '-': '-',
                   'Oui': 'oui', 'Non': 'non', 'N/A': '-', 'Partiel': '-'}
        return mapping.get(value, '-')

    class Meta:
        model  = AppreciationClient
        fields = ['id', 'element', 'reponse', 'lien_archivage']


class ActionBilanSerializer(serializers.ModelSerializer):
    action   = serializers.CharField(allow_blank=True, default='')
    due_date = serializers.DateField(required=False, allow_null=True)

    def validate_type_action(self, value):
        mapping = {
            'Corrective': 'corrective', 'corrective': 'corrective',
            'preventive': 'preventive', 'Préventive': 'preventive',
            'Améliorative': 'amelioration', 'amelioration': 'amelioration',
        }
        return mapping.get(value, 'corrective')

    def validate_due_date(self, value):
        if value in (None, '', 'null'):
            return None
        return value

    class Meta:
        model  = ActionBilan
        fields = ['id', 'action_id', 'type_action', 'action', 'due_date', 'responsable']


class ParticipantBilanSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ParticipantBilan
        fields = ['id', 'fonction', 'nom', 'note', 'est_destinataire', 'est_cc']


class Step4Serializer(serializers.ModelSerializer):
    criteres           = CritereEvaluationSerializer(many=True, required=False)
    bilan_methodes     = BilanMethodesMoyensSerializer(many=True, required=False)
    appreciations      = AppreciationClientSerializer(many=True, required=False)
    actions_bilan      = ActionBilanSerializer(many=True, required=False)
    participants_bilan = ParticipantBilanSerializer(many=True, required=False)
    indice_satisfaction_global = serializers.ReadOnlyField()

    # Mapped field to handle competencies list from/to database columns transparently
    bilan_competences  = serializers.ListField(child=serializers.DictField(), required=False)

    class Meta:
        model  = Step4_Evaluation
        fields = [
            'id', 'nom_projet', 'cdc_ref_commande', 'date_evaluation',
            'client_referent', 'fonction', 'commentaire_general',
            'capitalisation_bonne_pratique',
            
            # Underlying competencies fields
            'lien_matrice_competences', 'nouvelles_competences',
            'enregistrements_a_maj', 'formations_a_planifier', 'besoin_recrutement',
            
            # New evaluation assessment fields
            'bilan_projet', 'bilan_client', 'bilan_activite', 'bilan_etat',
            'bilan_periode', 'plan_action_file_url',
            
            # Virtual / read-only fields & relations
            'indice_satisfaction_global', 'bilan_competences',
            'criteres', 'bilan_methodes', 'appreciations', 'actions_bilan', 'participants_bilan',
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['bilan_competences'] = [
            {'question': "Lien de la matrice des compétences", 'reponse': instance.lien_matrice_competences},
            {'question': "Est-ce qu'il y a des nouvelles compétences et/ou connaissances qui ont été acquises par les ressources du projet?", 'reponse': instance.nouvelles_competences},
            {'question': "Est-ce qu'il y a des enregistrements à mettre à jour? (CV, Fiche Fonction,…)", 'reponse': instance.enregistrements_a_maj},
            {'question': "Est-ce qu'il y a des formations à planifier?", 'reponse': instance.formations_a_planifier},
            {'question': "Est-ce qu'il y a une nécessité de recrutement?", 'reponse': instance.besoin_recrutement},
        ]
        return ret

    def update(self, instance, validated_data):
        criteres_data   = validated_data.pop('criteres', None)
        bilan_data      = validated_data.pop('bilan_methodes', None)
        apprec_data     = validated_data.pop('appreciations', None)
        actions_data    = validated_data.pop('actions_bilan', None)
        parts_data      = validated_data.pop('participants_bilan', None)

        # Map bilan_competences back to underlying columns
        bilan_competences_data = validated_data.pop('bilan_competences', None)
        if bilan_competences_data is not None:
            fields_mapping = [
                'lien_matrice_competences',
                'nouvelles_competences',
                'enregistrements_a_maj',
                'formations_a_planifier',
                'besoin_recrutement'
            ]
            for idx, field_name in enumerate(fields_mapping):
                if idx < len(bilan_competences_data):
                    val = bilan_competences_data[idx].get('reponse', '')
                    setattr(instance, field_name, val)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        def replace(rel_manager, Model, data, required_key=None):
            if data is None:
                return
            rel_manager.all().delete()
            for item in data:
                if required_key and not str(item.get(required_key, '')).strip():
                    continue
                Model.objects.create(step4=instance, **item)

        replace(instance.criteres,           CritereEvaluation,   criteres_data)
        replace(instance.bilan_methodes,     BilanMethodesMoyens, bilan_data)
        replace(instance.appreciations,      AppreciationClient,  apprec_data)
        replace(instance.actions_bilan,      ActionBilan,         actions_data,    required_key='action')
        replace(instance.participants_bilan, ParticipantBilan,    parts_data,      required_key='nom')
        return instance


# ─── Main AT Serializer ───────────────────────────────────────────────────────

class AssistanceTechniqueSerializer(serializers.ModelSerializer):
    step1 = Step1Serializer(read_only=True)
    step2 = Step2Serializer(read_only=True)
    step3 = Step3Serializer(read_only=True)
    step4 = Step4Serializer(read_only=True)
    project_name              = serializers.CharField(source='project.client', read_only=True)
    project_ref               = serializers.CharField(source='project.ref_projet', read_only=True)
    project_nom               = serializers.CharField(source='project.nom_projet', read_only=True)
    project_departement       = serializers.CharField(source='project.departement', read_only=True)
    project_membres           = serializers.SerializerMethodField()
    project_competences       = serializers.SerializerMethodField()
    project_client_info       = serializers.SerializerMethodField()
    project_langages          = serializers.ListField(source='project.langages',          read_only=True, default=list)
    project_os_outils         = serializers.ListField(source='project.os_outils',         read_only=True, default=list)
    project_metier_generique  = serializers.ListField(source='project.metier_generique',  read_only=True, default=list)
    project_metier_specifique = serializers.ListField(source='project.metier_specifique', read_only=True, default=list)
    project_devops            = serializers.ListField(source='project.devops',            read_only=True, default=list)
    project_management        = serializers.ListField(source='project.management',        read_only=True, default=list)

    def get_project_membres(self, obj):
        """Return all members of the linked project with their user profile."""
        return [
            {
                'id': m.id,
                'first_name': m.first_name,
                'last_name': m.last_name,
                'email': m.email,
                'phone_number': getattr(m, 'phone_number', '') or '',
                'role': m.role,
            }
            for m in obj.project.membres.all()
        ]

    def get_project_client_info(self, obj):
        """Look up the Client record by name and return full contact details."""
        from clients.models import Client
        client_name = obj.project.client
        if not client_name:
            return None
        try:
            c = Client.objects.get(nom_client=client_name)
            return {
                'nom': c.nom_client,
                'email': c.email or '',
                'telephone': c.telephone or '',
                'domaine': c.domaine or '',
            }
        except Client.DoesNotExist:
            return {'nom': client_name, 'email': '', 'telephone': '', 'domaine': ''}

    def get_project_competences(self, obj):
        """Aggregate all competence lists from the project into one flat list."""
        p = obj.project
        items = []
        for field in ['langages', 'os_outils', 'metier_generique', 'metier_specifique', 'devops', 'management']:
            items.extend(getattr(p, field, []) or [])
        return items

    class Meta:
        model  = AssistanceTechnique
        fields = [
            'id', 'project', 'project_name', 'project_ref', 'project_nom',
            'project_departement',
            'project_membres', 'project_competences', 'project_client_info',
            'project_langages', 'project_os_outils',
            'project_metier_generique', 'project_metier_specifique',
            'project_devops', 'project_management',
            'client', 'type_prestation',
            'directeur_activite', 'current_step', 'status',
            'created_by', 'created_at', 'updated_at',
            'step1', 'step2', 'step3', 'step4',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class AssistanceTechniqueListSerializer(serializers.ModelSerializer):
    """Serializer léger pour les listes (sans nested steps)."""
    project_name = serializers.CharField(source='project.client', read_only=True)
    project_ref  = serializers.CharField(source='project.ref_projet', read_only=True)

    class Meta:
        model  = AssistanceTechnique
        fields = ['id', 'project', 'project_name', 'project_ref', 'client',
                  'type_prestation', 'directeur_activite', 'current_step', 'status',
                  'created_at', 'updated_at']