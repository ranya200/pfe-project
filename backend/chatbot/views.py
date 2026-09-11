import requests
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import ConversationSerializer, ConversationDetailSerializer

SYSTEM_PROMPT = (
    "Tu es l'assistant intégré à l'application TelTrack. "
    "Tu aides les utilisateurs à naviguer dans l'app et tu réponds à leurs questions "
    "générales sur son fonctionnement (gestion de projets, workflows AT, ISO 9001/27001). "
    "Réponds toujours en français, de façon brève et claire. "
    "Si tu ne sais pas, dis-le simplement."
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    conversations = Conversation.objects.filter(user=request.user)
    return Response(ConversationSerializer(conversations, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_conversation(request, conversation_id):
    conv = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    return Response(ConversationDetailSerializer(conv).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conversation_id):
    conv = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    conv.delete()
    return Response(status=204)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_message(request):
    user_message = request.data.get("message", "").strip()
    conversation_id = request.data.get("conversation_id")

    if not user_message:
        return Response({"error": "Message vide."}, status=400)

    if conversation_id:
        conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    else:
        title = user_message[:50] + ("..." if len(user_message) > 50 else "")
        conversation = Conversation.objects.create(user=request.user, title=title)

    Message.objects.create(conversation=conversation, role="user", content=user_message)

    history = list(conversation.messages.order_by("created_at").values("role", "content"))
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history[-20:])

    try:
        resp = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": settings.OPENROUTER_MODEL, "messages": messages},
            timeout=30,
        )
        resp.raise_for_status()
        reply = resp.json()["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException:
        return Response({"error": "Le chatbot est momentanément indisponible."}, status=502)

    Message.objects.create(conversation=conversation, role="assistant", content=reply)
    conversation.save()  # met à jour updated_at

    return Response({"reply": reply, "conversation_id": conversation.id})