from django.urls import path
from .views import chat_message, list_conversations, get_conversation, delete_conversation

urlpatterns = [
    path("message/", chat_message, name="chatbot-message"),
    path("conversations/", list_conversations, name="chatbot-conversations"),
    path("conversations/<int:conversation_id>/", get_conversation, name="chatbot-conversation-detail"),
    path("conversations/<int:conversation_id>/delete/", delete_conversation, name="chatbot-conversation-delete"),
]