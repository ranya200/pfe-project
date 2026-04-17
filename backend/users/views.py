from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from knox.models import AuthToken
from .models import CustomUser
from audit.utils import log_action
from knox.views import LogoutView as KnoxLogoutView

# ── Helper : extraction de l'IP ───────────────────────────────────────────
def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class RegisterViewSet(viewsets.ViewSet):

    serializer_class = RegisterSerializer 

    def get_permissions(self):
        return [permissions.IsAuthenticated()]  

    def create(self, request):
        # Vérification que c'est bien un admin
        if request.user.role != 'admin':
            return Response(
                {"error": "Seul un administrateur peut créer des utilisateurs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            log_action(
                action='USER_CREATE',
                user=request.user,
                model_name='CustomUser',
                object_id=user.pk,
                object_repr=str(user),
                new_values={'email': user.email, 'role': user.role, 'department': user.department},
                request=request,
            )
            return Response(
                {
                    "message": f"Compte de {user.first_name} {user.last_name} créé avec succès.",
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Login ─────────────────────────────────────────────────────────────────
class LoginViewSet(viewsets.ViewSet):
    serializer_class   = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email    = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # ── Vérification existence de l'user ──────────────────────────────
        try:
            user_obj = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Email ou mot de passe incorrect."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ── ISO 27001 : vérification verrouillage du compte ───────────────
        if user_obj.is_account_locked():
            minutes_left = int(
                (user_obj.account_locked_until - timezone.now()).total_seconds() / 60
            )
            log_action(
                action='ACCOUNT_LOCKED',
                model_name='CustomUser',
                object_id=user_obj.pk,
                object_repr=user_obj.email,
                extra={'minutes_left': minutes_left},
                request=request,
            )
            return Response(
                {
                    "error": f"Compte verrouillé. Réessayez dans {minutes_left} minute(s).",
                    "locked_until": user_obj.account_locked_until,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # ── Authentification ──────────────────────────────────────────────
        user = authenticate(request, username=email, password=password)

        if not user:
            # ISO 27001 : incrémenter les tentatives échouées
            user_obj.increment_failed_attempts()
            attempts_left = max(0, 5 - user_obj.failed_login_attempts)
            log_action(
                action='LOGIN_FAILED',
                model_name='CustomUser',
                object_id=user_obj.pk,
                object_repr=email,
                extra={'attempts_left': attempts_left, 'total_attempts': user_obj.failed_login_attempts},
                request=request,
            )
            return Response(
                {
                    "error": "Email ou mot de passe incorrect.",
                    "attempts_left": attempts_left,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ── Vérification du rôle autorisé à se connecter ─────────────────
        ALLOWED_ROLES = ['admin', 'chef_projet', 'resp_qualite']
        if user.role not in ALLOWED_ROLES:
            log_action(
                action='ACCESS_DENIED',
                user=user,
                model_name='CustomUser',
                object_repr=user.email,
                extra={'reason': 'role_not_allowed', 'role': user.role},
                request=request,
            )
            return Response(
                {
                    "error": (
                        "Accès non autorisé. Seuls les administrateurs, "
                        "chefs de projet et responsables qualité peuvent "
                        "accéder à l'application."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # ── ISO 27001 : enregistrement IP + reset tentatives ─────────────
        user.last_login_ip         = get_client_ip(request)
        user.failed_login_attempts = 0
        user.account_locked_until  = None
        user.save(update_fields=['last_login_ip', 'failed_login_attempts', 'account_locked_until'])

        # ── Journal d'audit : connexion réussie ───────────────────────────
        log_action(
            action='LOGIN',
            user=user,
            model_name='CustomUser',
            object_id=user.pk,
            object_repr=user.email,
            extra={'role': user.role},
            request=request,
        )

        # ── Création du token Knox ────────────────────────────────────────
        _, token = AuthToken.objects.create(user)

        # ── Réponse avec "Bonjour {prénom}" ──────────────────────────────
        return Response(
            {
                "message":    f"Bonjour {user.first_name} {user.last_name} 👋",
                "token":      token,
                "user":       UserSerializer(user).data,
                "must_change_password": user.must_change_password,
            },
            status=status.HTTP_200_OK,
        )
    
# ── Me (profil de l'utilisateur connecté) ────────────────────────────────
class MeViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        return Response(UserSerializer(request.user).data)
    
# ── Liste des utilisateurs (admin seulement) ─────────────────────────────
class UsersViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        # Seul l'admin peut voir la liste
        if request.user.role != 'admin':
            return Response(
                {"error": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Exclure l'admin lui-même de la liste
        users = CustomUser.objects.exclude(id=request.user.id).order_by('first_name')
        return Response(UserSerializer(users, many=True).data)

    def destroy(self, request, pk=None):
        # Seul l'admin peut supprimer
        if request.user.role != 'admin':
            return Response(
                {"error": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            user = CustomUser.objects.get(pk=pk)
            user_repr = str(user)
            user_id   = user.pk
            user.delete()
            log_action(
                action='USER_DELETE',
                user=request.user,
                model_name='CustomUser',
                object_id=user_id,
                object_repr=user_repr,
                request=request,
            )
            return Response({"message": "Utilisateur supprimé."}, status=status.HTTP_204_NO_CONTENT)
        except CustomUser.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    def partial_update(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = CustomUser.objects.get(pk=pk)
            old_role = user.role
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                log_action(
                    action='USER_UPDATE',
                    user=request.user,
                    model_name='CustomUser',
                    object_id=user.pk,
                    object_repr=str(user),
                    old_values={'role': old_role},
                    new_values={'role': user.role},
                    request=request,
                )
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
    
class LogoutViewSet(KnoxLogoutView):
    """Logout Knox + audit log."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        log_action(
            action='LOGOUT',
            user=request.user,
            model_name='CustomUser',
            object_id=request.user.pk,
            object_repr=request.user.email,
            request=request,
        )
        return super().post(request, *args, **kwargs)