from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    """Used for fiche documents (BPMN, Preuve, etc.) stored in Supabase Storage."""
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


class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the Support document table."""
    depose_par            = serializers.SerializerMethodField()
    type_support_display  = serializers.CharField(source="get_type_support_display",  read_only=True)
    type_document_display = serializers.CharField(source="get_type_document_display", read_only=True)

    class Meta:
        model  = Document
        fields = [
            "id_document", "nom_fichier",
            "type_document", "type_document_display",
            "type_support",  "type_support_display",
            "version_doc", "date_upload", "taille",
            "description", "depose_par",
        ]

    def get_depose_par(self, obj):
        if not obj.id_uploader:
            return ""
        try:
            from apps.accounts.models import Utilisateur
            u = Utilisateur.objects.get(id_user=obj.id_uploader)
            return f"{u.prenom} {u.nom}".strip()
        except Exception:
            return str(obj.id_uploader)


class DocumentDetailSerializer(DocumentListSerializer):
    """Full serializer for the preview panel."""
    class Meta(DocumentListSerializer.Meta):
        fields = DocumentListSerializer.Meta.fields + ["chemin_stockage"]


class DocumentUploadSerializer(serializers.Serializer):
    """Used for CAQ Support document upload (local filesystem)."""
    fichier      = serializers.FileField(write_only=True)
    nom_fichier  = serializers.CharField(max_length=500)
    type_support = serializers.ChoiceField(
        choices=["Guide", "Reglementation", "Norme"],
        required=False,
        allow_null=True,
        allow_blank=True,
    )
    description  = serializers.CharField(required=False, allow_blank=True, default="")
