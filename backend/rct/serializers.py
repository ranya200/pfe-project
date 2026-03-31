from rest_framework import serializers
from .models import RCT, Step1, Step2, Step3, FRPForm, FROForm


class Step1Serializer(serializers.ModelSerializer):
    cahier_charges_url        = serializers.SerializerMethodField()
    formulaire_interactif_url = serializers.SerializerMethodField()
    frp_filled                = serializers.SerializerMethodField()
    fro_filled                = serializers.SerializerMethodField()

    class Meta:
        model  = Step1
        fields = [
            'id', 'cahier_charges', 'cahier_charges_url',
            'formulaire_interactif', 'formulaire_interactif_url',
            'frp_filled', 'fro_filled',
            'completed', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']

    def _url(self, obj, field):
        req = self.context.get('request')
        f = getattr(obj, field)
        if f and req:
            return req.build_absolute_uri(f.url)
        return None

    def get_cahier_charges_url(self, obj):        return self._url(obj, 'cahier_charges')
    def get_formulaire_interactif_url(self, obj): return self._url(obj, 'formulaire_interactif')

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


class Step2Serializer(serializers.ModelSerializer):
    formulaire_qr_final_url  = serializers.SerializerMethodField()
    offre_tech_financier_url = serializers.SerializerMethodField()
    fiche_revue_offre_url    = serializers.SerializerMethodField()
    planning_url             = serializers.SerializerMethodField()
    cr_reunions_url          = serializers.SerializerMethodField()

    class Meta:
        model  = Step2
        fields = [
            'id', 'formulaire_qr_final', 'formulaire_qr_final_url',
            'exigences_legales',
            'offre_tech_financier', 'offre_tech_financier_url',
            'fiche_revue_offre', 'fiche_revue_offre_url',
            'planning', 'planning_url',
            'cr_reunions', 'cr_reunions_url',
            'completed', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']

    def _url(self, obj, field):
        req = self.context.get('request')
        f = getattr(obj, field)
        if f and req:
            return req.build_absolute_uri(f.url)
        return None

    def get_formulaire_qr_final_url(self, obj):  return self._url(obj, 'formulaire_qr_final')
    def get_offre_tech_financier_url(self, obj): return self._url(obj, 'offre_tech_financier')
    def get_fiche_revue_offre_url(self, obj):    return self._url(obj, 'fiche_revue_offre')
    def get_planning_url(self, obj):             return self._url(obj, 'planning')
    def get_cr_reunions_url(self, obj):          return self._url(obj, 'cr_reunions')


class Step3Serializer(serializers.ModelSerializer):
    derniere_version_offre_url = serializers.SerializerMethodField()
    planning_url               = serializers.SerializerMethodField()
    retour_client_url          = serializers.SerializerMethodField()
    decision_display           = serializers.CharField(source='get_decision_display', read_only=True)

    class Meta:
        model  = Step3
        fields = [
            'id', 'derniere_version_offre', 'derniere_version_offre_url',
            'planning', 'planning_url',
            'retour_client', 'retour_client_url',
            'decision', 'decision_display',
            'completed', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']

    def _url(self, obj, field):
        req = self.context.get('request')
        f = getattr(obj, field)
        if f and req:
            return req.build_absolute_uri(f.url)
        return None

    def get_derniere_version_offre_url(self, obj): return self._url(obj, 'derniere_version_offre')
    def get_planning_url(self, obj):               return self._url(obj, 'planning')
    def get_retour_client_url(self, obj):          return self._url(obj, 'retour_client')


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
    step1          = Step1Serializer(read_only=True)
    step2          = Step2Serializer(read_only=True)
    step3          = Step3Serializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    project_ref    = serializers.CharField(source='project.ref_projet', read_only=True)
    project_client = serializers.CharField(source='project.client',     read_only=True)

    class Meta:
        model  = RCT
        fields = [
            'id', 'project', 'project_ref', 'project_client',
            'current_step', 'status', 'status_display',
            'step1', 'step2', 'step3',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

