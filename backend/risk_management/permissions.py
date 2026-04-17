from rest_framework.permissions import BasePermission

RISK_ALLOWED_ROLES = ('admin', 'resp_qualite', 'chef_projet')


class IsRiskManager(BasePermission):
    """
    Accorde l'accès complet au module Risques uniquement aux rôles :
      - admin
      - resp_qualite (Responsable Qualité)
      - chef_projet  (Chef de Projet)
    Tout autre rôle reçoit une réponse 403.
    """

    message = "Accès refusé. Seuls les administrateurs, responsables qualité et chefs de projet peuvent accéder au module Risques."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', None) in RISK_ALLOWED_ROLES

