from django.urls import path
from .views import RCTView, RCTStepView, FRPFormView, FROFormView

urlpatterns = [
    path('projects/<int:project_id>/rct/',                        RCTView.as_view(),     name='rct'),
    path('projects/<int:project_id>/rct/step/<int:step_number>/', RCTStepView.as_view(), name='rct-step'),
    path('projects/<int:project_id>/rct/frp/',                    FRPFormView.as_view(), name='rct-frp'),
    path('projects/<int:project_id>/rct/fro/',                    FROFormView.as_view(), name='rct-fro'),
]

