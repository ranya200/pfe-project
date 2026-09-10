"""
Envoi des notifications par mail.

Ce module est volontairement découplé de `services.py` : il ne fait que
rendre un template et envoyer un mail à partir des infos d'une Notification
(ou d'infos équivalentes). Il est appelé en tâche de fond (Celery) pour ne
jamais ralentir ni faire échouer une requête HTTP à cause d'un souci mail.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.urls import NoReverseMatch

from pathlib import Path
from email.mime.image import MIMEImage

LOGO_PATH = Path(__file__).resolve().parent / 'static' / 'notifications' / 'email' / 'teltrack-logo.png'

logger = logging.getLogger('notifications')


def _absolute_link(link_url):
    """Transforme un link_url relatif ('/projects/12') en URL absolue vers le frontend."""
    if not link_url:
        return None
    if link_url.startswith('http://') or link_url.startswith('https://'):
        return link_url
    base = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
    return f"{base}{link_url}" if base else link_url


def build_email_context(recipient, title, message, notification_type_label, link_url=None):
    return {
        'app_name': getattr(settings, 'EMAIL_APP_NAME', 'la plateforme'),
        'recipient_name': (recipient.get_full_name() or recipient.email).strip() or recipient.email,
        'title': title,
        'message': message,
        'type_label': notification_type_label,
        'button_url': _absolute_link(link_url),
    }


def should_send_email(recipient):
    """
    Détermine si un mail doit être envoyé à ce destinataire, en tenant compte
    du coupe-circuit global et de la préférence individuelle de l'utilisateur.
    Ceci est une condition "définitive" : si elle est fausse, il est inutile
    de retenter l'envoi plus tard (contrairement à une panne SMTP transitoire).
    """
    if not getattr(settings, 'EMAIL_NOTIFICATIONS_ENABLED', True):
        return False
    if not getattr(recipient, 'email', None):
        return False
    if not getattr(recipient, 'email_notifications_enabled', True):
        return False
    return True


def render_and_send(recipient, title, message, notification_type_label,
                     link_url=None, subject_prefix=None):
    """
    Rend et envoie effectivement le mail. Lève une exception en cas d'échec
    (ex: serveur SMTP injoignable) afin de permettre un retry côté Celery.
    N'effectue AUCUNE vérification de préférence : à appeler après
    `should_send_email`.
    """
    context = build_email_context(recipient, title, message, notification_type_label, link_url)

    html_body = render_to_string('notifications/emails/notification_email.html', context)
    text_body = render_to_string('notifications/emails/notification_email.txt', context)

    prefix = subject_prefix or f"[{getattr(settings, 'EMAIL_APP_NAME', 'Notification')}]"
    subject = f"{prefix} {title}".strip()

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient.email],
    )
    email.attach_alternative(html_body, 'text/html')

    # Logo en pièce jointe "inline" (référencé via cid:logo dans le HTML) —
    # fonctionne dans tous les clients mail, même sans app hébergée publiquement.
    email.mixed_subtype = 'related'
    if LOGO_PATH.exists():
        with open(LOGO_PATH, 'rb') as f:
            logo = MIMEImage(f.read())
        logo.add_header('Content-ID', '<logo>')
        logo.add_header('Content-Disposition', 'inline', filename='teltrack-logo.png')
        email.attach(logo)

    email.send(fail_silently=False)


def send_notification_email(recipient, title, message, notification_type_label,
                              link_url=None, subject_prefix=None):
    """
    Envoie un mail HTML (+ fallback texte) à `recipient` pour une notification donnée.

    Best-effort : ne lève jamais d'exception vers l'appelant. Retourne True/False.
    À utiliser en dehors du contexte Celery (ex: script, admin action) quand
    on ne veut pas de retry automatique.
    """
    if not should_send_email(recipient):
        return False

    try:
        render_and_send(recipient, title, message, notification_type_label,
                         link_url=link_url, subject_prefix=subject_prefix)
        return True
    except Exception:
        logger.exception("Échec de l'envoi du mail de notification à %s", getattr(recipient, 'email', '?'))
        return False
