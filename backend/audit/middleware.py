"""
Middleware d'audit — ISO 27001.
Stocke les métadonnées de la requête (IP, User-Agent) dans un contexte
thread-local accessible par les signaux et les vues.
"""
import threading

_thread_local = threading.local()


def get_audit_context():
    """Retourne le contexte d'audit de la requête courante."""
    return {
        'ip_address': getattr(_thread_local, 'ip_address', None),
        'user_agent': getattr(_thread_local, 'user_agent', ''),
        'user':       getattr(_thread_local, 'user', None),
    }


def set_audit_context(ip_address, user_agent, user=None):
    """Définit le contexte d'audit pour le thread courant."""
    _thread_local.ip_address = ip_address
    _thread_local.user_agent = user_agent
    _thread_local.user       = user


def clear_audit_context():
    """Nettoie le contexte d'audit après la requête."""
    for attr in ('ip_address', 'user_agent', 'user'):
        if hasattr(_thread_local, attr):
            delattr(_thread_local, attr)


def _get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class AuditMiddleware:
    """
    Middleware qui capture automatiquement l'IP et le User-Agent de chaque
    requête et les rend accessibles aux vues et signaux via get_audit_context().
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Avant la vue : stocker le contexte
        user = getattr(request, 'user', None)
        if user and not user.is_authenticated:
            user = None

        set_audit_context(
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            user=user,
        )

        response = self.get_response(request)

        # Après la vue : nettoyer
        clear_audit_context()

        return response

