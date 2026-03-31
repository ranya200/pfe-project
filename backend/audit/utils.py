"""
Utilitaires d'audit — fonction centrale log_action().
Appeler cette fonction depuis n'importe quelle vue pour enregistrer une action.
"""
import logging
from .models import AuditLog
from .middleware import get_audit_context

logger = logging.getLogger('audit')


def log_action(
    action,
    user=None,
    model_name='',
    object_id='',
    object_repr='',
    old_values=None,
    new_values=None,
    extra=None,
    request=None,
):
    """
    Enregistre une action dans le journal d'audit.

    Paramètres :
        action       : code action (ex: 'LOGIN', 'PROJECT_CREATE')
        user         : instance CustomUser ou None
        model_name   : nom du modèle concerné (ex: 'Project')
        object_id    : PK de l'objet sous forme de string
        object_repr  : représentation lisible de l'objet
        old_values   : dict des valeurs avant modification
        new_values   : dict des valeurs après modification
        extra        : dict de données supplémentaires
        request      : objet Request Django REST (optionnel, prioritaire sur le contexte)
    """
    # Récupérer le contexte réseau
    ctx = get_audit_context()

    # L'utilisateur passé explicitement est prioritaire
    if user is None:
        user = ctx.get('user')

    # Si un objet request est passé, extraire IP et UA directement
    if request is not None:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            ip_address = x_forwarded.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    else:
        ip_address = ctx.get('ip_address')
        user_agent = ctx.get('user_agent', '')

    try:
        entry = AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=str(object_id) if object_id else '',
            object_repr=str(object_repr)[:255],
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            extra=extra,
        )

        # Logging structuré Python
        logger.info(
            '[AUDIT] action=%s user=%s model=%s object=%s ip=%s',
            action,
            user.email if user else 'anonyme',
            model_name,
            object_repr,
            ip_address,
        )

        return entry

    except Exception as exc:
        # Ne jamais laisser l'audit bloquer l'application
        logger.error('[AUDIT ERROR] Impossible de créer l\'entrée : %s', exc)
        return None


def serialize_model_fields(instance, exclude=None):
    """
    Convertit les champs d'un modèle Django en dict JSON-sérialisable.
    Utile pour capturer old_values / new_values.
    """
    exclude = exclude or ['password', 'last_password_change']
    data = {}
    for field in instance._meta.get_fields():
        # Ignorer les relations many-to-many et les relations inverses
        if field.is_relation and (field.many_to_many or field.one_to_many):
            continue
        if field.name in exclude:
            continue
        try:
            val = getattr(instance, field.name)
            # Convertir les types non JSON-sérialisables
            if hasattr(val, 'isoformat'):
                val = val.isoformat()
            elif hasattr(val, 'pk'):
                val = val.pk
            data[field.name] = val
        except Exception:
            pass
    return data

