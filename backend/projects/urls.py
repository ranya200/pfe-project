from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProjectViewSet, UsersByDeptView

router = DefaultRouter()
router.register('projects', ProjectViewSet, basename='projects')

urlpatterns = [
    path('', include(router.urls)),
    path('users-by-dept/<str:dept>/', UsersByDeptView.as_view(), name='users-by-dept'),
]