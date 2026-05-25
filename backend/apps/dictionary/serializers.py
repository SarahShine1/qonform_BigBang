from rest_framework import serializers

from .models import (
    DICTIONARY_CATEGORY_CHOICES,
    DictionaryTerm,
    normalize_term,
)


def profile_display_name(profile):
    if not profile:
        return ""
    full_name = f"{profile.prenom} {profile.nom}".strip()
    return full_name or getattr(profile, "email", "") or ""


class DictionaryTermSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DictionaryTerm
        fields = [
            "id",
            "term",
            "category",
            "definition",
            "example",
            "synonyms",
            "created_by_name",
            "updated_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by_name",
            "updated_by_name",
            "created_at",
            "updated_at",
        ]

    def get_created_by_name(self, obj):
        return profile_display_name(obj.created_by)

    def get_updated_by_name(self, obj):
        return profile_display_name(obj.updated_by)

    def validate_term(self, value):
        cleaned = " ".join(str(value or "").strip().split())
        if not cleaned:
            raise serializers.ValidationError("Le terme est obligatoire.")
        normalized = normalize_term(cleaned)
        queryset = DictionaryTerm.objects.filter(normalized_term=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Ce terme existe deja dans le dictionnaire.")
        return cleaned

    def validate_category(self, value):
        allowed = {choice[0] for choice in DICTIONARY_CATEGORY_CHOICES}
        if value not in allowed:
            raise serializers.ValidationError("Categorie invalide.")
        return value

    def validate_definition(self, value):
        cleaned = str(value or "").strip()
        if not cleaned:
            raise serializers.ValidationError("La definition est obligatoire.")
        return cleaned

    def validate_synonyms(self, value):
        if value in (None, ""):
            return []

        if isinstance(value, str):
            raw_items = value.split(",")
        elif isinstance(value, list):
            raw_items = value
        else:
            raise serializers.ValidationError(
                "Les synonymes doivent etre une liste ou une chaine separee par des virgules."
            )

        cleaned = []
        seen = set()
        for item in raw_items:
            current = " ".join(str(item or "").strip().split())
            if not current:
                continue
            key = normalize_term(current)
            if not key or key in seen:
                continue
            seen.add(key)
            cleaned.append(current)
        return cleaned

    def validate(self, attrs):
        attrs["example"] = str(attrs.get("example", "") or "").strip()
        return attrs

