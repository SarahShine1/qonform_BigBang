from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    def get_url(self, obj):
        return self.context.get("urls", {}).get(obj.id_document)

    class Meta:
        model  = Document
        fields = [
            "id_document", "id_version", "id_uploader",
            "nom_fichier", "type_document", "chemin_stockage",
            "taille", "date_upload", "description",
            "evaluation", "id_audit_field", "url",
        ]
        read_only_fields = ["id_document", "date_upload"]
