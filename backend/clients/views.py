from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """
    GET    /api/clients/       → liste tous les clients (authentifié)
    POST   /api/clients/       → créer un client (admin seulement)
    GET    /api/clients/{id}/  → détail (authentifié)
    PUT    /api/clients/{id}/  → modifier (admin seulement)
    PATCH  /api/clients/{id}/  → modifier partiellement (admin seulement)
    DELETE /api/clients/{id}/  → supprimer (admin seulement)
    """
    serializer_class   = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Client.objects.all()

    def create(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"error": "Seul l'administrateur peut créer un client."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"error": "Seul l'administrateur peut modifier un client."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"error": "Seul l'administrateur peut modifier un client."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"error": "Seul l'administrateur peut supprimer un client."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
