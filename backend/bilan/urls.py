from django.urls import path
from . import views

urlpatterns = [
    path("projects/<int:project_id>/bilan-actions/", views.bilan_actions_projet, name="bilan-actions"),
]