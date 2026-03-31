from django.urls import path
from .views import AuditLogViewSet

audit_list  = AuditLogViewSet.as_view({'get': 'list'})
audit_stats = AuditLogViewSet.as_view({'get': 'stats'})

urlpatterns = [
    path('audit/logs/',       audit_list,  name='audit-logs'),
    path('audit/logs/stats/', audit_stats, name='audit-stats'),
]

