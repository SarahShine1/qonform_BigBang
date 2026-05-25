from rest_framework import serializers
from .models import Norme, SectionTemplate, ChampTemplate, ColonneTemplate, OptionChamp, VersionFiche, ChampFiche, ProcessusLiaison

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

CHAMP_TYPE_CHOICES = ["text", "nombre", "date", "booleen", "checklist", "liste", "tableau"]


class NormeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Norme
        fields = ["id_norme", "code", "version", "titre", "date_publication", "est_active", "created_at"]
        read_only_fields = ["id_norme", "created_at"]


class SectionTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionTemplate
        fields = [
            "id_section_template", "nom", "description",
            "ordre", "est_actif", "id_norme", "created_at", "updated_at",
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
    liaisons_amont          = serializers.SerializerMethodField()
    liaisons_aval           = serializers.SerializerMethodField()
    liaisons_amont_externes = serializers.SerializerMethodField()
    liaisons_aval_externes  = serializers.SerializerMethodField()

    def get_liaisons_amont(self, obj):
        return list(
            ProcessusLiaison.objects.filter(id_processus_aval=obj.id_processus)
            .values_list("id_processus_amont", flat=True)
        )

    def get_liaisons_aval(self, obj):
        return list(
            ProcessusLiaison.objects.filter(id_processus_amont=obj.id_processus)
            .values_list("id_processus_aval", flat=True)
        )

    def get_liaisons_amont_externes(self, obj):
        from apps.processus.models import ProcessusLiaisonExterne, ProcessusExterne
        ids = list(
            ProcessusLiaisonExterne.objects.filter(id_processus=obj.id_processus, sens="amont")
            .values_list("id_processus_externe", flat=True)
        )
        return [
            {"id_processus_externe": e.id_processus_externe, "nom": e.nom}
            for e in ProcessusExterne.objects.filter(id_processus_externe__in=ids)
        ]

    def get_liaisons_aval_externes(self, obj):
        from apps.processus.models import ProcessusLiaisonExterne, ProcessusExterne
        ids = list(
            ProcessusLiaisonExterne.objects.filter(id_processus=obj.id_processus, sens="aval")
            .values_list("id_processus_externe", flat=True)
        )
        return [
            {"id_processus_externe": e.id_processus_externe, "nom": e.nom}
            for e in ProcessusExterne.objects.filter(id_processus_externe__in=ids)
        ]

    class Meta:
        model = VersionFiche
        fields = [
            "id_version", "id_processus", "statut", "id_redacteur",
            "numero_version", "commentaire_version",
            "date_creation", "date_derniere_modif", "date_validation",
            "revue", "commit",
            "liaisons_amont", "liaisons_aval",
            "liaisons_amont_externes", "liaisons_aval_externes",
            "id_norme",
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


# ── Nested write serializers for template editor ─────────────────────────────

class ColonneWriteSerializer(serializers.Serializer):
    cle         = serializers.CharField(max_length=50)
    libelle     = serializers.CharField(max_length=200)
    placeholder = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    ordre       = serializers.IntegerField(default=1)


class OptionWriteSerializer(serializers.Serializer):
    valeur  = serializers.CharField(max_length=100)
    libelle = serializers.CharField(max_length=200)
    ordre   = serializers.IntegerField(default=1)


class ChampTemplateCreateSerializer(serializers.Serializer):
    id_section_template = serializers.IntegerField()
    libelle             = serializers.CharField(max_length=255)
    type_champ          = serializers.ChoiceField(choices=CHAMP_TYPE_CHOICES)
    est_obligatoire     = serializers.BooleanField(default=False)
    placeholder         = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    aide                = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ordre               = serializers.IntegerField(default=1)
    colonnes            = ColonneWriteSerializer(many=True, required=False, default=list)
    options             = OptionWriteSerializer(many=True, required=False, default=list)

    def create(self, validated_data):
        colonnes = validated_data.pop("colonnes", [])
        options  = validated_data.pop("options", [])
        champ = ChampTemplate.objects.create(**validated_data)
        for col in colonnes:
            ColonneTemplate.objects.create(id_champ=champ.id_champ_template, **col)
        for opt in options:
            OptionChamp.objects.create(id_champ=champ.id_champ_template, **opt)
        return champ
