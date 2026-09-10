from django.urls import path
from .views import (
    AnalyzeProjectRiskView,
    ProjectRiskResultView,
    ProjectRiskHistoryView,
    ProjectAlertsView,
    AcknowledgeAlertView,
    MyProjectAlertsView,
)

urlpatterns = [
    path('projects/<int:project_id>/analyze/', AnalyzeProjectRiskView.as_view(), name='ai-analyze'),
    path('projects/<int:project_id>/result/', ProjectRiskResultView.as_view(), name='ai-result'),
    path('projects/<int:project_id>/history/', ProjectRiskHistoryView.as_view(), name='ai-history'),
    path('projects/<int:project_id>/alerts/',  ProjectAlertsView.as_view(),       name='ai-alerts'),
    path('ai/alerts/<int:alert_id>/acknowledge/', AcknowledgeAlertView.as_view(), name='ai-alert-ack'),
     path('ai/my-alerts/',                      MyProjectAlertsView.as_view(),     name='ai-my-alerts'),
]