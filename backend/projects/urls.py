# projects/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProjectViewSet, UsersByDeptView
from .dashboard_view import DashboardSummaryView

router = DefaultRouter()
router.register('projects', ProjectViewSet, basename='projects')

urlpatterns = [
    path('', include(router.urls)),
    path('users-by-dept/<str:dept>/', UsersByDeptView.as_view(), name='users-by-dept'),
    path('projects/dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
]