from django.urls import path

from .views import (
    ContactListView,
    ConversationListView,
    ConversationMessagesView,
    MessageCreateView,
)

urlpatterns = [
    path("contacts/", ContactListView.as_view(), name="messaging-contacts"),
    path("conversations/", ConversationListView.as_view(), name="messaging-conversations"),
    path(
        "conversations/<int:conversation_id>/messages/",
        ConversationMessagesView.as_view(),
        name="messaging-conversation-messages",
    ),
    path("messages/", MessageCreateView.as_view(), name="messaging-send"),
]

