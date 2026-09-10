from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def get_user_from_knox_token(token_string):
    """
    Valide un token Knox et retourne l'utilisateur associé.
    Retourne AnonymousUser si le token est invalide, expiré ou absent.
    """
    from knox.auth import TokenAuthentication
    from rest_framework.exceptions import AuthenticationFailed

    if not token_string:
        return AnonymousUser()

    try:
        auth = TokenAuthentication()
        user, auth_token = auth.authenticate_credentials(token_string.encode())
        return user
    except AuthenticationFailed:
        return AnonymousUser()
    except Exception:
        return AnonymousUser()


class KnoxAuthMiddleware(BaseMiddleware):
    """
    Middleware ASGI qui lit le token Knox depuis le query string de l'URL
    WebSocket (ex: ws://host/ws/notifications/?token=xxxxx) et authentifie
    l'utilisateur avant de passer la main au Consumer.
    """

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        scope["user"] = await get_user_from_knox_token(token)

        return await super().__call__(scope, receive, send)


def KnoxAuthMiddlewareStack(inner):
    return KnoxAuthMiddleware(inner)