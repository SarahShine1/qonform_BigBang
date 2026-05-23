from rest_framework import serializers
from .models import Processus, ProcessusExterne
from apps.accounts.models import Utilisateur, Departement


TYPE_LABELS = {
    "Management": "Pilotage",
    "Realisation": "Realisation",
    "Support": "Support",
}


class ProcessusSerializer(serializers.ModelSerializer):
    pilote_nom              = serializers.SerializerMethodField()
    departement_nom         = serializers.SerializerMethodField()
    derniere_fiche_statut   = serializers.SerializerMethodField()
    derniere_version_id     = serializers.SerializerMethodField()

    def get_pilote_nom(self, obj):
        if obj.id_pilote:
            try:
                u = Utilisateur.objects.get(id_user=obj.id_pilote)
                return f"{u.prenom} {u.nom}"
            except Utilisateur.DoesNotExist:
                return None
        return None

    def get_departement_nom(self, obj):
        if obj.id_departement:
            try:
                return Departement.objects.get(id_departement=obj.id_departement).nom
            except Departement.DoesNotExist:
                return None
        return None

    def _best_version(self, obj):
        from apps.fiches.models import VersionFiche
        return (
            VersionFiche.objects
            .filter(id_processus=obj.id_processus)
            .order_by("-date_creation")
            .first()
        )

    def get_derniere_fiche_statut(self, obj):
        v = self._best_version(obj)
        return v.statut if v else None

    def get_derniere_version_id(self, obj):
        v = self._best_version(obj)
        return v.id_version if v else None

    class Meta:
        model = Processus
        fields = [
            "id_processus", "code_process", "nom", "description",
            "type_process", "id_departement", "departement_nom",
            "id_pilote", "pilote_nom", "created_at",
            "derniere_fiche_statut", "derniere_version_id",
        ]
        read_only_fields = ["id_processus", "created_at", "pilote_nom", "departement_nom",
                            "derniere_fiche_statut", "derniere_version_id"]
        extra_kwargs = {
            "code_process": {"required": False, "allow_blank": True},
            "type_process": {"required": False},
            "description": {"required": False, "allow_blank": True, "allow_null": True},
            "id_pilote": {"required": False, "allow_null": True},
        }

    def validate_id_departement(self, value):
        if not Departement.objects.filter(id_departement=value).exists():
            raise serializers.ValidationError("Departement introuvable.")
        return value


class ProcessusExterneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessusExterne
        fields = ["id_processus_externe", "nom", "created_at"]
        read_only_fields = ["id_processus_externe", "created_at"]


class InteractionProcessRefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()
    type = serializers.CharField()


class ProcessInteractionVersionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    numero = serializers.CharField()
    statut = serializers.CharField()


class ProcessInteractionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField(allow_blank=True, allow_null=True)
    type = serializers.CharField()
    typeLabel = serializers.CharField()
    responsable = serializers.CharField(allow_blank=True, allow_null=True)
    department = serializers.CharField(allow_blank=True, allow_null=True)
    upstream = InteractionProcessRefSerializer(many=True)
    downstream = InteractionProcessRefSerializer(many=True)
    inputs = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    outputs = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    version = ProcessInteractionVersionSerializer(allow_null=True)
