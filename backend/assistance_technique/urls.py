from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssistanceTechniqueViewSet,
    EquipementECMEViewSet,
    ReunionSuiviViewSet,
    ChargeRessourceViewSet,
)

router = DefaultRouter()
router.register(r'assistance-technique',  AssistanceTechniqueViewSet, basename='assistance-technique')
router.register(r'at-equipements',        EquipementECMEViewSet,       basename='at-equipements')
router.register(r'at-reunions',           ReunionSuiviViewSet,         basename='at-reunions')
router.register(r'at-charges',            ChargeRessourceViewSet,      basename='at-charges')

urlpatterns = [
    path('', include(router.urls)),
]

