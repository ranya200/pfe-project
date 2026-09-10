from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification
from .serializers import NotificationSerializer


def notifier(
    recipient,
    title,
    message,
    notification_type=Notification.NotificationType.GENERIC,
    related_object_type=None,
    related_object_id=None,
    link_url=None,
    send_email=True,
):
    """
    Crée une notification en base de données, la pousse en temps réel
    au destinataire via WebSocket (groupe user_<id>), et lui envoie un mail
    (best-effort, en tâche de fond) — ce qui permet d'informer aussi les
    utilisateurs qui n'utilisent pas l'application au quotidien
    (ex: développeurs) d'une nouvelle action à faire, réunion, formation...

    recipient : instance CustomUser (le destinataire)
    send_email : mettre à False pour ne pousser que la notif in-app/WebSocket
                 sans envoyer de mail (ex: notifications à faible enjeu).
    """
    notification = Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        related_object_type=related_object_type,
        related_object_id=related_object_id,
        link_url=link_url,
    )

    _push_to_websocket(notification)

    if send_email:
        _push_email(notification)

    return notification


def _push_email(notification):
    """
    Déclenche l'envoi du mail de notification en tâche de fond (Celery).
    Best-effort : si Celery/le broker est indisponible, on tente un envoi
    synchrone en dernier recours plutôt que de perdre le mail silencieusement ;
    si ça échoue aussi, on log et on continue sans jamais bloquer la requête.
    """
    from .tasks import send_notification_email_task

    type_label = notification.get_notification_type_display()

    try:
        send_notification_email_task.delay(
            recipient_id=notification.recipient_id,
            title=notification.title,
            message=notification.message,
            notification_type_label=type_label,
            link_url=notification.link_url,
        )
    except Exception:
        # Le broker Celery est peut-être indisponible : on retente en synchrone
        # (best-effort) pour ne pas perdre le mail, sans jamais faire planter
        # la vue appelante.
        from .emails import send_notification_email
        send_notification_email(
            recipient=notification.recipient,
            title=notification.title,
            message=notification.message,
            notification_type_label=type_label,
            link_url=notification.link_url,
        )


def _push_to_websocket(notification):
    """
    Envoie la notification au groupe WebSocket de l'utilisateur.
    Si aucun channel layer n'est configuré ou en cas d'erreur réseau,
    on ne bloque pas la création de la notification (best-effort).
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        group_name = f"user_{notification.recipient_id}"
        payload = NotificationSerializer(notification).data

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_notification",
                "notification": payload,
            }
        )
    except Exception:
        # Ne jamais faire échouer la logique métier à cause d'un souci WebSocket
        pass


# Rôles concernés par les notifications projet (chef de projet + resp qualité)
PROJECT_NOTIFIED_ROLES = ['chef_projet', 'resp_qualite']


def notify_project_team(project, notification_type, title, message, link_url=None):
    """
    Envoie une notification (DB + WebSocket) au chef de projet et au
    responsable qualité faisant partie de l'équipe du projet (membres M2M).

    Réutilisable depuis n'importe quelle app (projects, risk_management,
    assistance_technique, ...) sans dépendance croisée vers projects.views.
    """
    concerned_members = project.membres.filter(role__in=PROJECT_NOTIFIED_ROLES)
    notifications_created = []
    for member in concerned_members:
        notifications_created.append(
            notifier(
                recipient=member,
                title=title,
                message=message,
                notification_type=notification_type,
                related_object_type='Project',
                related_object_id=project.pk,
                link_url=link_url or f"/projects/{project.pk}",
            )
        )
    return notifications_created


def notify_team_members_added(project, members):
    """
    Notifie (DB + WebSocket + mail) TOUS les membres passés en argument qu'ils
    viennent d'être ajoutés à l'équipe d'un projet — quel que soit leur rôle
    (développeur, ingénieur, stagiaire...), contrairement à
    `notify_project_team` qui ne s'adresse qu'au chef de projet et au
    responsable qualité.

    C'est le point d'entrée à utiliser pour que les développeurs et autres
    membres de l'équipe qui n'utilisent pas forcément l'application au
    quotidien soient bien informés par mail qu'ils font partie d'un projet.

    project : instance Project
    members : itérable de CustomUser (les nouveaux membres à notifier)
    """
    notifications_created = []
    for member in members:
        notifications_created.append(
            notifier(
                recipient=member,
                title="Vous avez été ajouté(e) à un projet",
                message=(
                    f"Vous faites désormais partie de l'équipe du projet "
                    f"{project.ref_projet} ({project.client})."
                ),
                notification_type=Notification.NotificationType.TEAM_ADDED,
                related_object_type='Project',
                related_object_id=project.pk,
                link_url=f"/projects/{project.pk}",
            )
        )
    return notifications_created