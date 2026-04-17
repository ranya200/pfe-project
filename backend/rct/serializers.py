from django.core.files.storage import default_storage
from rest_framework import serializers
from .models import RCT, Step1, Step2, Step3, FRPForm, FROForm


def _ordered_uploads(request, base_name):
    if not request or not request.FILES:
        return []
    out = []
    i = 0
    while f'{base_name}__{i}' in request.FILES:
        out.append(request.FILES[f'{base_name}__{i}'])
        i += 1
    if not out and base_name in request.FILES:
        out = [request.FILES[base_name]]
    return out


def _apply_versioned_uploads(instance, request, field_name, versions_dict_key=None):
    """Ajoute les fichiers uploadés (clés field__0, field__1 ou field) et met à jour file_versions."""
    uploads = _ordered_uploads(request, field_name)
    if not uploads:
        return
    key = versions_dict_key or field_name
    fv = dict(instance.file_versions or {})
    paths = list(fv.get(key, []))
    fobj = getattr(instance, field_name)
    for upload in uploads:
        fobj.save(upload.name, upload, save=False)
        nm = fobj.name
        if nm not in paths:
            paths.append(nm)
    fv[key] = paths
    instance.file_versions = fv
    instance.save()


class Step1Serializer(serializers.ModelSerializer):
    cahier_charges_url         = serializers.SerializerMethodField()
    cahier_charges_urls        = serializers.SerializerMethodField()
    formulaire_interactif_url  = serializers.SerializerMethodField()
    formulaire_interactif_urls = serializers.SerializerMethodField()
    frp_filled                 = serializers.SerializerMethodField()
    fro_filled                 = serializers.SerializerMethodField()

    class Meta:
        model  = Step1
        fields = [
            'id', 'cahier_charges', 'cahier_charges_url', 'cahier_charges_urls',
            'formulaire_interactif', 'formulaire_interactif_url', 'formulaire_interactif_urls',
            'frp_filled', 'fro_filled',
            'file_versions',
            'completed', 'updated_at',
        ]
        read_only_fields = ['id', 'file_versions', 'updated_at']

    def _abs_from_path(self, path):
        req = self.context.get('request')
        url = default_storage.url(path) if path else None
        if url and req:
            return req.build_absolute_uri(url)
        return url

    def _paths(self, obj, key, file_field):
        p = (obj.file_versions or {}).get(key) or []
        if isinstance(p, str):
            p = [p]
        if not p and file_field and getattr(file_field, 'name', None):
            p = [file_field.name]
        return [x for x in p if x]

    def get_cahier_charges_url(self, obj):
        ps = self._paths(obj, 'cahier_charges', obj.cahier_charges)
        return self._abs_from_path(ps[-1]) if ps else None

    def get_cahier_charges_urls(self, obj):
        return [self._abs_from_path(p) for p in self._paths(obj, 'cahier_charges', obj.cahier_charges)]

    def get_formulaire_interactif_url(self, obj):
        ps = self._paths(obj, 'formulaire_interactif', obj.formulaire_interactif)
        return self._abs_from_path(ps[-1]) if ps else None

    def get_formulaire_interactif_urls(self, obj):
        return [self._abs_from_path(p) for p in self._paths(obj, 'formulaire_interactif', obj.formulaire_interactif)]

    def get_frp_filled(self, obj):
        try:
            return bool(obj.rct.frp.decision_frp)
        except Exception:
            return False

    def get_fro_filled(self, obj):
        try:
            return bool(obj.rct.fro.decision_fro)
        except Exception:
            return False

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request:
            _apply_versioned_uploads(instance, request, 'cahier_charges')
            _apply_versioned_uploads(instance, request, 'formulaire_interactif')
        return super().update(instance, validated_data)


class Step2Serializer(serializers.ModelSerializer):
    formulaire_qr_final_url   = serializers.SerializerMethodField()
    formulaire_qr_final_urls  = serializers.SerializerMethodField()
    offre_tech_financier_url  = serializers.SerializerMethodField()
    offre_tech_financier_urls = serializers.SerializerMethodField()
    fiche_revue_offre_url     = serializers.SerializerMethodField()
    planning_url              = serializers.SerializerMethodField()
    planning_urls             = serializers.SerializerMethodField()
    cr_reunions_url           = serializers.SerializerMethodField()
    cr_reunions_urls          = serializers.SerializerMethodField()
    exigences_legales_fichier_url  = serializers.SerializerMethodField()
    exigences_legales_fichier_urls = serializers.SerializerMethodField()

    class Meta:
        model  = Step2
        fields = [
            'id', 'formulaire_qr_final', 'formulaire_qr_final_url', 'formulaire_qr_final_urls',
            'exigences_legales', 'exigences_legales_fichier',
            'exigences_legales_fichier_url', 'exigences_legales_fichier_urls',
            'offre_tech_financier', 'offre_tech_financier_url', 'offre_tech_financier_urls',
            'fiche_revue_offre', 'fiche_revue_offre_url',
            'planning', 'planning_url', 'planning_urls',
            'cr_reunions', 'cr_reunions_url', 'cr_reunions_urls',
            'file_versions',
            'completed', 'updated_at',
        ]
        read_only_fields = ['id', 'file_versions', 'updated_at']

    def _abs_from_path(self, path):
        req = self.context.get('request')
        url = default_storage.url(path) if path else None
        if url and req:
            return req.build_absolute_uri(url)
        return url

    def _paths(self, obj, key, file_field):
        p = (obj.file_versions or {}).get(key) or []
        if isinstance(p, str):
            p = [p]
        if not p and file_field and getattr(file_field, 'name', None):
            p = [file_field.name]
        return [x for x in p if x]

    def _s1_interactif_paths(self, obj):
        s1 = obj.rct.step1
        return self._paths(s1, 'formulaire_interactif', s1.formulaire_interactif)

    def get_formulaire_qr_final_urls(self, obj):
        p2 = self._paths(obj, 'formulaire_qr_final', obj.formulaire_qr_final)
        if p2:
            return [self._abs_from_path(p) for p in p2]
        return [self._abs_from_path(p) for p in self._s1_interactif_paths(obj)]

    def get_formulaire_qr_final_url(self, obj):
        urls = self.get_formulaire_qr_final_urls(obj)
        return urls[-1] if urls else None

    def get_offre_tech_financier_url(self, obj):
        ps = self._paths(obj, 'offre_tech_financier', obj.offre_tech_financier)
        return self._abs_from_path(ps[-1]) if ps else None

    def get_offre_tech_financier_urls(self, obj):
        return [self._abs_from_path(p) for p in self._paths(obj, 'offre_tech_financier', obj.offre_tech_financier)]

    def get_fiche_revue_offre_url(self, obj):
        if obj.fiche_revue_offre and obj.fiche_revue_offre.name:
            return self._abs_from_path(obj.fiche_revue_offre.name)
        return None

    def get_planning_url(self, obj):
        ps = self._paths(obj, 'planning', obj.planning)
        return self._abs_from_path(ps[-1]) if ps else None

    def get_planning_urls(self, obj):
        return [self._abs_from_path(p) for p in self._paths(obj, 'planning', obj.planning)]

    def get_cr_reunions_url(self, obj):
        ps = self._paths(obj, 'cr_reunions', obj.cr_reunions)
        return self._abs_from_path(ps[-1]) if ps else None

    def get_cr_reunions_urls(self, obj):
        return [self._abs_from_path(p) for p in self._paths(obj, 'cr_reunions', obj.cr_reunions)]

    def get_exigences_legales_fichier_url(self, obj):
        ps = self._paths(obj, 'exigences_legales_fichier', obj.exigences_legales_fichier)
        return self._abs_from_path(ps[-1]) if ps else None

    def get_exigences_legales_fichier_urls(self, obj):
        return [self._abs_from_path(p) for p in self._paths(obj, 'exigences_legales_fichier', obj.exigences_legales_fichier)]

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request:
            _apply_versioned_uploads(instance, request, 'offre_tech_financier')
            _apply_versioned_uploads(instance, request, 'planning')
            _apply_versioned_uploads(instance, request, 'cr_reunions')
            _apply_versioned_uploads(instance, request, 'exigences_legales_fichier', 'exigences_legales_fichier')
            # fiche_revue et Q/R finale : gérés côté serveur / legacy
            if _ordered_uploads(request, 'fiche_revue_offre'):
                _apply_versioned_uploads(instance, request, 'fiche_revue_offre')
        return super().update(instance, validated_data)


class Step3Serializer(serializers.ModelSerializer):
    derniere_version_offre_url = serializers.SerializerMethodField()
    derniere_version_offre_urls = serializers.SerializerMethodField()
    planning_url               = serializers.SerializerMethodField()
    planning_urls              = serializers.SerializerMethodField()
    retour_client_url          = serializers.SerializerMethodField()
    retour_client_urls         = serializers.SerializerMethodField()
    decision_display           = serializers.CharField(source='get_decision_display', read_only=True)

    class Meta:
        model  = Step3
        fields = [
            'id', 'derniere_version_offre', 'derniere_version_offre_url', 'derniere_version_offre_urls',
            'planning', 'planning_url', 'planning_urls',
            'retour_client', 'retour_client_url', 'retour_client_urls',
            'file_versions',
            'decision', 'decision_display',
            'completed', 'updated_at',
        ]
        read_only_fields = ['id', 'file_versions', 'updated_at']

    def _abs_from_path(self, path):
        req = self.context.get('request')
        url = default_storage.url(path) if path else None
        if url and req:
            return req.build_absolute_uri(url)
        return url

    def _paths(self, obj, key, file_field):
        p = (obj.file_versions or {}).get(key) or []
        if isinstance(p, str):
            p = [p]
        if not p and file_field and getattr(file_field, 'name', None):
            p = [file_field.name]
        return [x for x in p if x]

    def _s2_offre_paths(self, obj):
        s2 = obj.rct.step2
        return self._paths(s2, 'offre_tech_financier', s2.offre_tech_financier)

    def _s2_planning_paths(self, obj):
        s2 = obj.rct.step2
        return self._paths(s2, 'planning', s2.planning)

    def get_derniere_version_offre_urls(self, obj):
        p3 = self._paths(obj, 'derniere_version_offre', obj.derniere_version_offre)
        if p3:
            return [self._abs_from_path(p) for p in p3]
        return [self._abs_from_path(p) for p in self._s2_offre_paths(obj)]

    def get_derniere_version_offre_url(self, obj):
        urls = self.get_derniere_version_offre_urls(obj)
        return urls[-1] if urls else None

    def get_planning_urls(self, obj):
        p3 = self._paths(obj, 'planning', obj.planning)
        if p3:
            return [self._abs_from_path(p) for p in p3]
        return [self._abs_from_path(p) for p in self._s2_planning_paths(obj)]

    def get_planning_url(self, obj):
        urls = self.get_planning_urls(obj)
        return urls[-1] if urls else None

    def get_retour_client_url(self, obj):
        ps = self._paths(obj, 'retour_client', obj.retour_client)
        return self._abs_from_path(ps[-1]) if ps else None

    def get_retour_client_urls(self, obj):
        return [self._abs_from_path(p) for p in self._paths(obj, 'retour_client', obj.retour_client)]

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request:
            _apply_versioned_uploads(instance, request, 'retour_client')
            _apply_versioned_uploads(instance, request, 'derniere_version_offre')
            _apply_versioned_uploads(instance, request, 'planning')
        return super().update(instance, validated_data)


class FRPFormSerializer(serializers.ModelSerializer):
    class Meta:
        model            = FRPForm
        fields           = '__all__'
        read_only_fields = ['id', 'rct', 'updated_by', 'updated_at']


class FROFormSerializer(serializers.ModelSerializer):
    class Meta:
        model            = FROForm
        fields           = '__all__'
        read_only_fields = ['id', 'rct', 'updated_by', 'updated_at']


class RCTSerializer(serializers.ModelSerializer):
    step1           = Step1Serializer(read_only=True)
    step2           = Step2Serializer(read_only=True)
    step3           = Step3Serializer(read_only=True)
    status_display  = serializers.CharField(source='get_status_display', read_only=True)
    project_ref     = serializers.CharField(source='project.ref_projet', read_only=True)
    project_client  = serializers.CharField(source='project.client',     read_only=True)
    project_type    = serializers.CharField(source='project.type_projet', read_only=True)

    class Meta:
        model  = RCT
        fields = [
            'id', 'project', 'project_ref', 'project_client', 'project_type',
            'current_step', 'status', 'status_display', 'post_edit_mode',
            'step1', 'step2', 'step3',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
