from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Departement, Role, User, Utilisateur
from .utils import (
    get_auth_user_for_utilisateur,
    get_active_role_labels_for_user,
    normalize_role_names,
    split_full_name,
    sync_roles_for_user,
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom simplejwt serializer for email login.
    It adds active roles and department to the JWT without exposing passwords.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email

        utilisateur = Utilisateur.objects.filter(email=user.email).first()
        if utilisateur:
            token["roles"] = get_active_role_labels_for_user(utilisateur.id_user)
            token["departement_id"] = utilisateur.id_departement
        else:
            token["roles"] = []
            token["departement_id"] = None

        return token

    def validate(self, attrs):
        validated_data = super().validate(attrs)

        email = attrs.get(self.username_field)

        try:
            utilisateur = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return validated_data

        if not utilisateur.est_actif:
            raise AuthenticationFailed("Compte désactivé. Contactez l'administrateur.")

        validated_data["user"] = {
            "id_user": utilisateur.id_user,
            "nom": utilisateur.nom,
            "prenom": utilisateur.prenom,
            "email": utilisateur.email,
            "roles": get_active_role_labels_for_user(utilisateur.id_user),
            "departement": utilisateur.id_departement,
        }

        return validated_data


class UserProfileSerializer(serializers.Serializer):
    id_user = serializers.IntegerField(read_only=True)
    nom = serializers.CharField(read_only=True)
    prenom = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    roles = serializers.ListField(child=serializers.CharField(), read_only=True)
    departement = serializers.IntegerField(allow_null=True, read_only=True)


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id_role", "libelle"]


class DepartementSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="id_departement", read_only=True)
    name = serializers.CharField(source="nom", read_only=True)

    class Meta:
        model = Departement
        fields = ["id", "name"]


class ManagedUserSerializer(serializers.Serializer):
    id_user = serializers.IntegerField(read_only=True)
    nom = serializers.CharField(read_only=True)
    prenom = serializers.CharField(read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(read_only=True)
    est_actif = serializers.BooleanField(read_only=True)
    statut = serializers.SerializerMethodField()
    departement = serializers.IntegerField(
        source="id_departement",
        allow_null=True,
        read_only=True,
    )
    departement_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return f"{obj.prenom} {obj.nom}".strip()

    def get_statut(self, obj):
        return "Actif" if obj.est_actif else "Desactive"

    def get_roles(self, obj):
        return get_active_role_labels_for_user(obj.id_user)

    def get_departement_name(self, obj):
        if not obj.id_departement:
            return None

        departement = Departement.objects.filter(
            id_departement=obj.id_departement
        ).first()

        return departement.nom if departement else None


class ManagedUserWriteSerializer(serializers.Serializer):
    nom = serializers.CharField(required=False, allow_blank=True, max_length=100)
    prenom = serializers.CharField(required=False, allow_blank=True, max_length=100)
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=220)
    email = serializers.EmailField(required=False)

    password = serializers.CharField(
        required=False,
        allow_blank=False,
        min_length=8,
        write_only=True,
    )

    est_actif = serializers.BooleanField(required=False)
    departement = serializers.IntegerField(required=False, allow_null=True)

    roles = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )

    role = serializers.CharField(required=False, allow_blank=True)

    def validate_departement(self, value):
        """
        Prevent database IntegrityError.

        If the frontend sends departement=5 but departement 5 does not exist
        in table departement, we reject the request cleanly with 400 instead
        of crashing with IntegrityError.
        """

        if value in (None, ""):
            return None

        if not Departement.objects.filter(id_departement=value).exists():
            raise serializers.ValidationError(
                "Département invalide. Sélectionnez un département existant ou Non assigné."
            )

        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)

        role = str(attrs.pop("role", "") or "").strip()
        roles = attrs.get("roles")

        if role:
            attrs["roles"] = normalize_role_names([role])
        elif roles is not None:
            attrs["roles"] = normalize_role_names(roles)

        full_name = str(attrs.get("full_name", "") or "").strip()
        nom = str(attrs.get("nom", "") or "").strip()
        prenom = str(attrs.get("prenom", "") or "").strip()

        if full_name and (not nom or not prenom):
            computed_nom, computed_prenom = split_full_name(full_name)
            attrs["nom"] = nom or computed_nom
            attrs["prenom"] = prenom or computed_prenom
        else:
            attrs["nom"] = nom
            attrs["prenom"] = prenom

        is_create = self.instance is None

        if is_create and not attrs.get("email"):
            raise serializers.ValidationError({"email": "Email obligatoire."})

        if is_create and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Mot de passe obligatoire."})

        if is_create and not attrs.get("nom"):
            raise serializers.ValidationError({"nom": "Nom obligatoire."})

        if is_create and not attrs.get("prenom"):
            raise serializers.ValidationError({"prenom": "Prenom obligatoire."})

        email = attrs.get("email")

        if email:
            user_qs = User.objects.filter(email=email)
            utilisateur_qs = Utilisateur.objects.filter(email=email)

            if self.instance:
                auth_user = get_auth_user_for_utilisateur(self.instance)
                user_qs = user_qs.exclude(pk=getattr(auth_user, "pk", None))
                utilisateur_qs = utilisateur_qs.exclude(pk=self.instance.pk)

            if user_qs.exists() or utilisateur_qs.exists():
                raise serializers.ValidationError({"email": "Cet email existe deja."})

        return attrs

    def create(self, validated_data):
        roles = validated_data.pop("roles", [])
        validated_data.pop("full_name", None)

        email = validated_data["email"]
        password = validated_data.pop("password")
        est_actif = validated_data.pop("est_actif", True)
        departement = validated_data.pop("departement", None)

        auth_user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            is_active=est_actif,
        )

        utilisateur = Utilisateur.objects.create(
            auth=auth_user,
            nom=validated_data["nom"],
            prenom=validated_data["prenom"],
            email=email,
            est_actif=est_actif,
            id_departement=departement,
        )

        sync_roles_for_user(utilisateur.id_user, roles)

        return utilisateur

    def update(self, instance, validated_data):
        roles = validated_data.pop("roles", None)
        validated_data.pop("full_name", None)
        password = validated_data.pop("password", None)

        auth_user = get_auth_user_for_utilisateur(instance)

        if "nom" in validated_data:
            instance.nom = validated_data["nom"]

        if "prenom" in validated_data:
            instance.prenom = validated_data["prenom"]

        if "email" in validated_data:
            instance.email = validated_data["email"]

        if "est_actif" in validated_data:
            instance.est_actif = validated_data["est_actif"]

        if "departement" in validated_data:
            instance.id_departement = validated_data["departement"]

        instance.save()

        if auth_user:
            if "email" in validated_data:
                auth_user.email = validated_data["email"]
                auth_user.username = validated_data["email"]

            if "est_actif" in validated_data:
                auth_user.is_active = validated_data["est_actif"]

            if password:
                auth_user.set_password(password)

            auth_user.save()

        if roles is not None:
            sync_roles_for_user(instance.id_user, roles)

        return instance