import logging

from celery import shared_task

from .emails import should_send_email, render_and_send

logger = logging.getLogger('notifications')


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_notification_email_task(self, recipient_id, title, message,
                                    notification_type_label, link_url=None):
    """
    Envoie un mail de notification en tâche de fond (ne bloque jamais la
    requête HTTP qui a déclenché la notification).

    - Si le destinataire a désactivé les mails (ou coupe-circuit global) :
      on ne fait rien, pas de retry (ce n'est pas une erreur).
    - Si l'envoi échoue pour une raison technique (SMTP down, etc.) :
      on retente automatiquement jusqu'à 3 fois.
    """
    from users.models import CustomUser

    try:
        recipient = CustomUser.objects.get(pk=recipient_id)
    except CustomUser.DoesNotExist:
        return False

    if not should_send_email(recipient):
        return False

    try:
        render_and_send(
            recipient=recipient,
            title=title,
            message=message,
            notification_type_label=notification_type_label,
            link_url=link_url,
        )
        return True
    except Exception as exc:
        logger.warning(
            "Échec envoi mail notification à %s (tentative %s/%s) : %s",
            recipient.email, self.request.retries + 1, self.max_retries, exc,
        )
        raise self.retry(exc=exc)
