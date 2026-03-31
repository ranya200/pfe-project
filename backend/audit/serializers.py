from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email    = serializers.SerializerMethodField()
    user_fullname = serializers.SerializerMethodField()
    action_label  = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model  = AuditLog
        fields = [
            'id', 'timestamp',
            'user', 'user_email', 'user_fullname',
            'action', 'action_label',
            'model_name', 'object_id', 'object_repr',
            'old_values', 'new_values',
            'ip_address', 'user_agent',
            'extra',
        ]
        read_only_fields = fields  # Lecture seule

    def get_user_email(self, obj):
        return obj.user.email if obj.user else 'Système'

    def get_user_fullname(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        return 'Système'

