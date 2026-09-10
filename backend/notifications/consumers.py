import json

from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Un utilisateur connecté rejoint le groupe "user_<id>".
    Toute notification poussée sur ce groupe (via services.notifier)
    est transmise en temps réel au navigateur connecté.
    """

    async def connect(self):
        user = self.scope.get("user")

        if user is None or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f"user_{user.id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Reçoit un message côté client (optionnel, ex: ping ou "mark as read")
    async def receive(self, text_data=None, bytes_data=None):
        # Pour l'instant on n'a pas besoin de traiter les messages entrants.
        # On pourra ajouter ici un "mark_as_read" via WebSocket plus tard si besoin.
        pass

    # Handler appelé par channel_layer.group_send avec type="send_notification"
    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            "notification": event["notification"]
        }))