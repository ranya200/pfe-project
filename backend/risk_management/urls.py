from rest_framework.routers import DefaultRouter
from .views import (
    RiskViewSet,
    RiskEvaluationViewSet,
    ActionPlanViewSet,
    ResidualRiskViewSet,
)

router = DefaultRouter()
router.register(r"risks",        RiskViewSet,           basename="risk")
router.register(r"evaluations",  RiskEvaluationViewSet, basename="evaluation")
router.register(r"action-plans", ActionPlanViewSet,     basename="action-plan")
router.register(r"residuals",    ResidualRiskViewSet,   basename="residual")

urlpatterns = router.urls