from rest_framework import serializers
from .models import SectionTemplate, ChampTemplate, ColonneTemplate, OptionChamp, VersionFiche, ChampFiche

# champ_template utilise 'text'/'checklist'/'tableau'
# mais la contrainte DB de champ_fiche n'accepte que 'texte'/'liste'
_TYPE_MAP = {
    "text": "texte",
    "texte": "texte",
    "checklist": "liste",
    "tableau": "liste",
    "nombre": "nombre",
    "date": "date",
    "booleen": "booleen",
    "liste": "liste",
}


class SectionTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionTemplate
        fields = [
            "id_section_template", "nom", "description",
            "ordre", "est_actif", "created_at", "updated_at",
        ]
        read_only_fields = ["id_section_template", "created_at", "updated_at"]


class ColonneTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ColonneTemplate
        fields = ["id", "cle", "libelle", "placeholder", "ordre"]


class OptionChampSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionChamp
        fields = ["id", "valeur", "libelle", "ordre"]


class ChampTemplateSerializer(serializers.ModelSerializer):
    colonnes = serializers.SerializerMethodField()
    options  = serializers.SerializerMethodField()

    def get_colonnes(self, obj):
        qs = ColonneTemplate.objects.filter(id_champ=obj.id_champ_template).order_by("ordre")
        return ColonneTemplateSerializer(qs, many=True).data

    def get_options(self, obj):
        qs = OptionChamp.objects.filter(id_champ=obj.id_champ_template).order_by("ordre")
        return OptionChampSerializer(qs, many=True).data

    class Meta:
        model = ChampTemplate
        fields = [
            "id_champ_template", "id_section_template", "libelle",
            "type_champ", "configuration", "est_obligatoire",
            "placeholder", "aide", "ordre", "est_actif",
            "created_at", "updated_at",
            "colonnes", "options",
        ]
        read_only_fields = ["id_champ_template", "created_at", "updated_at"]


class VersionFicheSerializer(serializers.ModelSerializer):
    class Meta:
        model = VersionFiche
        fields = [
            "id_version", "id_processus", "statut", "id_redacteur",
            "numero_version", "commentaire_version",
            "date_creation", "date_derniere_modif", "date_validation",
            "id_processus_amont", "id_processus_aval",
        ]
        read_only_fields = ["id_version", "id_redacteur", "date_creation"]


class ChampFicheSerializer(serializers.ModelSerializer):
    # Plain CharField so DRF doesn't reject template type values ('text','checklist','tableau')
    # before validate_type_champ can remap them to DB-allowed values.
    type_champ = serializers.CharField(max_length=20)

    class Meta:
        model = ChampFiche
        fields = [
            "id_champ", "id_version", "libelle", "type_champ",
            "valeur", "est_obligatoire", "ordre",
            "id_champ_template", "valeur_json",
        ]
        read_only_fields = ["id_champ"]

    def validate_type_champ(self, value):
        return _TYPE_MAP.get(value, "texte")
