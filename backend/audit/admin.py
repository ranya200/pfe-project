from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display  = ('timestamp', 'user', 'action', 'model_name', 'object_repr', 'ip_address')
    list_filter   = ('action', 'model_name')
    search_fields = ('user__email', 'object_repr', 'ip_address')
    readonly_fields = ('user', 'action', 'timestamp', 'model_name', 'object_id',
                       'object_repr', 'old_values', 'new_values', 'ip_address',
                       'user_agent', 'extra')
    ordering      = ('-timestamp',)

    def has_add_permission(self, request):
        return False  # Lecture seule — personne ne peut créer manuellement

    def has_change_permission(self, request, obj=None):
        return False  # Lecture seule — personne ne peut modifier

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser  # Seul le superuser peut purger
