from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id_notification",
            "type_notification",
            "titre",
            "message",
            "lu",
            "lien",
            "created_at",
        ]