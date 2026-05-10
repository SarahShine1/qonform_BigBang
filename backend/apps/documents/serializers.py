from rest_framework import serializers
from .models import Document


class DocumentListSerializer(serializers.ModelSerializer):
    """Serializer léger pour la liste (tableau)."""

    depose_par = serializers.SerializerMethodField()
    processus_lie = serializers.SerializerMethodField()
    type_support_display = serializers.CharField(
        source="get_type_support_display", read_only=True
    )
    type_document_display = serializers.CharField(
        source="get_type_document_display", read_only=True
    )

    class Meta:
        model = Document
        fields = [
            "id_document",
            "nom_fichier",
            "type_document",
            "type_document_display",
            "type_support",
            "type_support_display",
            "version_doc",
            "date_upload",
            "taille",
            "description",
            "depose_par",
            "processus_lie",
        ]

    def get_depose_par(self, obj):
        u = obj.id_uploader
        return f"{u.prenom} {u.nom}".strip() if u else ""

    def get_processus_lie(self, obj):
        if obj.id_version:
            return getattr(obj.id_version, "nom_processus", None)
        return None


class DocumentDetailSerializer(DocumentListSerializer):
    """Serializer complet pour le panneau de prévisualisation."""

    class Meta(DocumentListSerializer.Meta):
        fields = DocumentListSerializer.Meta.fields + ["chemin_stockage"]


class DocumentUploadSerializer(serializers.ModelSerializer):
    fichier = serializers.FileField(write_only=True)
    

    class Meta:
        model = Document
        fields = [
            "nom_fichier",
            
            "type_support",
            "description",
            "fichier",
        ]

    def validate_type_support(self, value):
        if value is None:
            return value
        allowed = ["Guide", "Reglementation", "Norme"]
        if value not in allowed:
            raise serializers.ValidationError(
                f"Type de support invalide. Valeurs acceptées : {', '.join(allowed)}"
            )
        return value

   