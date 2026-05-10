from rest_framework import serializers
from .models import Processus
from apps.accounts.models import Utilisateur, Departement


TYPE_LABELS = {
    "Management": "Pilotage",
    "Realisation": "Realisation",
    "Support": "Support",
}


class ProcessusSerializer(serializers.ModelSerializer):
    pilote_nom = serializers.SerializerMethodField()
    departement_nom = serializers.SerializerMethodField()

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

    class Meta:
        model = Processus
        fields = [
            "id_processus", "code_process", "nom", "description",
            "type_process", "id_departement", "departement_nom",
            "id_pilote", "pilote_nom", "created_at",
        ]
        read_only_fields = ["id_processus", "created_at", "pilote_nom", "departement_nom"]


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
