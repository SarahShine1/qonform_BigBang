from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import CustomTokenObtainPairSerializer
from .models import Utilisateur


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/v1/auth/token/
    Returns an access + refresh token pair along with the user profile dict.
    Uses CustomTokenObtainPairSerializer which embeds email, roles, and
    departement_id into the JWT claims and rejects inactive accounts.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class CustomTokenRefreshView(TokenRefreshView):
    """
    POST /api/v1/auth/token/refresh/
    Standard simplejwt refresh endpoint, explicitly open to unauthenticated
    callers (the refresh token itself is the credential).
    """
    permission_classes = [AllowAny]


class MeView(APIView):
    """
    GET /api/v1/auth/me/
    Returns the authenticated user's profile by reading claims from the
    decoded JWT payload.  A single DB query fetches nom and prenom because
    those fields are not stored in the token.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payload = request.auth.payload

        email = payload.get('email')
        roles = payload.get('roles', [])
        departement_id = payload.get('departement_id')
        user_id = payload.get('user_id')

        # nom and prenom are not in the JWT — one DB query to retrieve them.
        utilisateur = Utilisateur.objects.get(email=email)

        return Response({
            'id_user': utilisateur.id_user,
            'nom': utilisateur.nom,
            'prenom': utilisateur.prenom,
            'email': email,
            'roles': roles,
            'departement': departement_id,
        })
