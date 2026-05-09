from rest_framework import serializers


class MessageCreateSerializer(serializers.Serializer):
    recipient_id = serializers.IntegerField()
    content = serializers.CharField(max_length=2000, trim_whitespace=True)

    def validate_content(self, value):
        content = str(value or "").strip()
        if not content:
            raise serializers.ValidationError("Le message ne peut pas etre vide.")
        return content

