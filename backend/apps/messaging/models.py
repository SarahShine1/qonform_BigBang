from django.conf import settings
from django.db import models
from django.utils import timezone


class Conversation(models.Model):
    auditeur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messaging_conversations_as_auditeur",
    )
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messaging_conversations_as_utilisateur",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "messaging_conversation"
        ordering = ["-updated_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["auditeur", "utilisateur"],
                name="messaging_unique_auditeur_utilisateur",
            ),
        ]

    def __str__(self):
        return f"Conversation #{self.pk}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messaging_sent_messages",
    )
    content = models.TextField(max_length=2000)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "messaging_message"
        ordering = ["created_at", "id"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        Conversation.objects.filter(pk=self.conversation_id).update(
            updated_at=timezone.now()
        )

    def __str__(self):
        return f"Message #{self.pk} in conversation #{self.conversation_id}"

