from datetime import date

from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Utilisateur


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom simplejwt serializer for email login.
    It adds active roles and department to the JWT without exposing passwords.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email

        # The current Supabase schema stores utilisateur.auth_id as UUID,
        # while local Django auth users use integer ids. Looking up by email
        # avoids uuid/int joins and works for both seeded and linked users.
        utilisateur = Utilisateur.objects.filter(email=user.email).first()

        if utilisateur:
            today = date.today()
            active_roles = (
                utilisateur.userrole_set
                .select_related('role')
                .filter(Q(date_expiration__isnull=True) | Q(date_expiration__gt=today))
            )
            token['roles'] = [ur.role.libelle for ur in active_roles]
            token['departement_id'] = utilisateur.id_departement
        else:
            token['roles'] = []
            token['departement_id'] = None

        return token

    def validate(self, attrs):
        validated_data = super().validate(attrs)

        email = attrs.get(self.username_field)
        try:
            utilisateur = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return validated_data

        if not utilisateur.est_actif:
            raise AuthenticationFailed(
                "Compte désactivé. Contactez l'administrateur."
            )

        today = date.today()
        active_roles = (
            utilisateur.userrole_set
            .select_related('role')
            .filter(Q(date_expiration__isnull=True) | Q(date_expiration__gt=today))
        )
        roles = [ur.role.libelle for ur in active_roles]

        validated_data['user'] = {
            'id_user': utilisateur.id_user,
            'nom': utilisateur.nom,
            'prenom': utilisateur.prenom,
            'email': utilisateur.email,
            'roles': roles,
            'departement': utilisateur.id_departement,
        }

        return validated_data


class UserProfileSerializer(serializers.Serializer):
    """Read-only serializer for the user profile returned by /me/."""

    id_user = serializers.IntegerField(read_only=True)
    nom = serializers.CharField(read_only=True)
    prenom = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    roles = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )
    departement = serializers.IntegerField(allow_null=True, read_only=True)
