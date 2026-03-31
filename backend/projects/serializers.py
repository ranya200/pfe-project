from rest_framework import serializers
from users.models import CustomUser
from .models import Project


class ProjectMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CustomUser
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'department', 'image']


class ProjectSerializer(serializers.ModelSerializer):
    membres_details     = ProjectMemberSerializer(source='membres', many=True, read_only=True)
    membres             = serializers.PrimaryKeyRelatedField(
                            many=True, queryset=CustomUser.objects.all(), required=False)
    created_by_name     = serializers.SerializerMethodField()
    type_projet_display = serializers.CharField(source='get_type_projet_display', read_only=True)
    phase_display       = serializers.CharField(source='get_phase_display',       read_only=True)
    dept_display        = serializers.CharField(source='get_departement_display', read_only=True)

    class Meta:
        model  = Project
        fields = [
            'id', 'ref_projet', 'client', 'type_projet', 'type_projet_display',
            'departement', 'dept_display', 'phase', 'phase_display',
            'langages', 'os_outils', 'metier_generique', 'metier_specifique',
            'devops', 'management', 'membres', 'membres_details',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'ref_projet', 'phase', 'created_by', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None