from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Conversation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "auditeur",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="messaging_conversations_as_auditeur",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "utilisateur",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="messaging_conversations_as_utilisateur",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "messaging_conversation",
                "ordering": ["-updated_at", "-id"],
            },
        ),
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("content", models.TextField(max_length=2000)),
                ("is_read", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="messages",
                        to="messaging.conversation",
                    ),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="messaging_sent_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "messaging_message",
                "ordering": ["created_at", "id"],
            },
        ),
        migrations.AddConstraint(
            model_name="conversation",
            constraint=models.UniqueConstraint(
                fields=("auditeur", "utilisateur"),
                name="messaging_unique_auditeur_utilisateur",
            ),
        ),
    ]
