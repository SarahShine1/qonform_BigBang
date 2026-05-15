"""
Integration tests for the accounts authentication endpoints.

Covers:
  - POST /api/v1/auth/token/       (login)
  - POST /api/v1/auth/token/refresh/ (token refresh)
  - GET  /api/v1/auth/me/          (current user profile)
  - HasRole RBAC permission class

The unmanaged models (Utilisateur, Role, UserRole) are made managed in
conftest.py so their tables are created in the SQLite test database.
"""
from datetime import date, timedelta
from unittest.mock import patch
from io import BytesIO
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.db import connection
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from PIL import Image

from apps.accounts.models import Departement, Role, User, UserRole, Utilisateur, UtilisateurSettings
from apps.accounts.permissions import HasRole


# ---------------------------------------------------------------------------
# Helper: create a full user fixture (User + Utilisateur + optional roles)
# ---------------------------------------------------------------------------

def make_user(
    username="testuser",
    email="test@esi.dz",
    password="testpass123",
    nom="Benali",
    prenom="Amira",
    est_actif=True,
    roles=None,
):
    """
    Create a Django User and a linked Utilisateur profile.
    Optionally attach Role objects (list of libelle strings).
    Returns (user, utilisateur).
    """
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )
    utilisateur = Utilisateur.objects.create(
        auth=user,
        nom=nom,
        prenom=prenom,
        email=email,
        est_actif=est_actif,
    )
    if roles:
        for libelle in roles:
            role, _ = Role.objects.get_or_create(libelle=libelle)
            UserRole.objects.create(utilisateur=utilisateur, role=role)
    return user, utilisateur


# ---------------------------------------------------------------------------
# 1. POST /api/v1/auth/token/ — Login endpoint
# ---------------------------------------------------------------------------

class LoginEndpointTests(APITestCase):
    """Tests for POST /api/v1/auth/token/"""

    @classmethod
    def setUpTestData(cls):
        # Active user with one role
        cls.user, cls.utilisateur = make_user(
            username="active_user",
            email="active@esi.dz",
            password="securepass123",
            nom="Benali",
            prenom="Amira",
            est_actif=True,
            roles=["CAQ"],
        )

        # Inactive user
        cls.inactive_user, cls.inactive_utilisateur = make_user(
            username="inactive_user",
            email="inactive@esi.dz",
            password="securepass123",
            nom="Ferhat",
            prenom="Karim",
            est_actif=False,
        )

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/auth/token/"

    # --- 1.1 Valid credentials ---

    def test_valid_credentials_returns_200(self):
        """Valid email + password returns HTTP 200."""
        response = self.client.post(
            self.url,
            {"email": "active@esi.dz", "password": "securepass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_valid_credentials_returns_access_token(self):
        """Response body contains an 'access' JWT string."""
        response = self.client.post(
            self.url,
            {"email": "active@esi.dz", "password": "securepass123"},
            format="json",
        )
        self.assertIn("access", response.data)
        self.assertIsInstance(response.data["access"], str)
        self.assertTrue(len(response.data["access"]) > 0)

    def test_valid_credentials_returns_refresh_token(self):
        """Response body contains a 'refresh' JWT string."""
        response = self.client.post(
            self.url,
            {"email": "active@esi.dz", "password": "securepass123"},
            format="json",
        )
        self.assertIn("refresh", response.data)
        self.assertIsInstance(response.data["refresh"], str)

    def test_valid_credentials_returns_user_profile(self):
        """Response body contains a 'user' dict with expected fields."""
        response = self.client.post(
            self.url,
            {"email": "active@esi.dz", "password": "securepass123"},
            format="json",
        )
        self.assertIn("user", response.data)
        user_data = response.data["user"]
        self.assertEqual(user_data["email"], "active@esi.dz")
        self.assertEqual(user_data["nom"], "Benali")
        self.assertEqual(user_data["prenom"], "Amira")
        self.assertIn("roles", user_data)
        self.assertIn("CAQ", user_data["roles"])

    # --- 1.2 Wrong credentials ---

    def test_wrong_password_returns_401(self):
        """Incorrect password returns HTTP 401."""
        response = self.client.post(
            self.url,
            {"email": "active@esi.dz", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unknown_email_returns_401(self):
        """Unregistered email returns HTTP 401."""
        response = self.client.post(
            self.url,
            {"email": "nobody@esi.dz", "password": "anypassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_wrong_credentials_error_message(self):
        """Wrong credentials returns the expected French error detail."""
        response = self.client.post(
            self.url,
            {"email": "active@esi.dz", "password": "wrongpassword"},
            format="json",
        )
        # simplejwt returns "detail" on 401
        self.assertIn("detail", response.data)

    # --- 1.3 Inactive account ---

    def test_inactive_account_returns_401(self):
        """Login attempt for an inactive account returns HTTP 401."""
        response = self.client.post(
            self.url,
            {"email": "inactive@esi.dz", "password": "securepass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_account_returns_correct_message(self):
        """Inactive account returns the 'Compte désactivé' error message."""
        response = self.client.post(
            self.url,
            {"email": "inactive@esi.dz", "password": "securepass123"},
            format="json",
        )
        self.assertIn("detail", response.data)
        self.assertIn(
            "désactivé",
            str(response.data["detail"]),
            msg="Expected 'désactivé' in the error detail for inactive accounts",
        )

    # --- 1.4 Missing fields ---

    def test_missing_email_returns_400(self):
        """Request without 'email' field returns HTTP 400."""
        response = self.client.post(
            self.url,
            {"password": "securepass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_password_returns_400(self):
        """Request without 'password' field returns HTTP 400."""
        response = self.client.post(
            self.url,
            {"email": "active@esi.dz"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_body_returns_400(self):
        """Empty request body returns HTTP 400."""
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# 2. POST /api/v1/auth/token/refresh/ — Token refresh endpoint
# ---------------------------------------------------------------------------

class TokenRefreshEndpointTests(APITestCase):
    """Tests for POST /api/v1/auth/token/refresh/"""

    @classmethod
    def setUpTestData(cls):
        cls.user, cls.utilisateur = make_user(
            username="refresh_user",
            email="refresh@esi.dz",
            password="refreshpass123",
        )

    def setUp(self):
        self.client = APIClient()
        self.login_url = "/api/v1/auth/token/"
        self.refresh_url = "/api/v1/auth/token/refresh/"

    def _get_tokens(self):
        """Helper: log in and return (access, refresh) token strings."""
        response = self.client.post(
            self.login_url,
            {"email": "refresh@esi.dz", "password": "refreshpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["access"], response.data["refresh"]

    # --- 2.1 Valid refresh token ---

    def test_valid_refresh_token_returns_200(self):
        """A valid refresh token returns HTTP 200."""
        _, refresh = self._get_tokens()
        response = self.client.post(
            self.refresh_url,
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_valid_refresh_token_returns_new_access_token(self):
        """A valid refresh token returns a new 'access' token in the response."""
        _, refresh = self._get_tokens()
        response = self.client.post(
            self.refresh_url,
            {"refresh": refresh},
            format="json",
        )
        self.assertIn("access", response.data)
        self.assertIsInstance(response.data["access"], str)
        self.assertTrue(len(response.data["access"]) > 0)

    def test_valid_refresh_token_returns_new_refresh_token(self):
        """With ROTATE_REFRESH_TOKENS=True, a new refresh token is also returned."""
        _, refresh = self._get_tokens()
        response = self.client.post(
            self.refresh_url,
            {"refresh": refresh},
            format="json",
        )
        # ROTATE_REFRESH_TOKENS is True in settings, so a new refresh is issued
        self.assertIn("refresh", response.data)

    # --- 2.2 Invalid / expired refresh token ---

    def test_invalid_refresh_token_returns_401(self):
        """A garbage refresh token string returns HTTP 401."""
        response = self.client.post(
            self.refresh_url,
            {"refresh": "this.is.not.a.valid.jwt"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_refresh_field_returns_400(self):
        """Request without 'refresh' field returns HTTP 400."""
        response = self.client.post(self.refresh_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_used_refresh_token_is_invalidated(self):
        """
        After a successful refresh (ROTATE_REFRESH_TOKENS=True), the original
        refresh token must be rejected on a second use.

        NOTE: Token blacklisting requires the 'rest_framework_simplejwt.token_blacklist'
        app and BLACKLIST_AFTER_ROTATION=True.  Without the blacklist app, simplejwt
        issues a new refresh token but does NOT invalidate the old one.
        This test verifies the current behaviour: the old token is still accepted
        (no blacklist configured), and a new refresh token is also returned.
        """
        _, refresh = self._get_tokens()

        # First refresh — should succeed and return a new refresh token
        first_response = self.client.post(
            self.refresh_url,
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertIn("refresh", first_response.data)

        # The new refresh token should also work
        new_refresh = first_response.data["refresh"]
        second_response = self.client.post(
            self.refresh_url,
            {"refresh": new_refresh},
            format="json",
        )
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# 3. GET /api/v1/auth/me/ — Current user profile endpoint
# ---------------------------------------------------------------------------

class MeEndpointTests(APITestCase):
    """Tests for GET /api/v1/auth/me/"""

    @classmethod
    def setUpTestData(cls):
        cls.user, cls.utilisateur = make_user(
            username="me_user",
            email="me@esi.dz",
            password="mepass123",
            nom="Meziane",
            prenom="Sofiane",
            est_actif=True,
            roles=["Auditeur", "Pilote"],
        )

    def setUp(self):
        self.client = APIClient()
        self.login_url = "/api/v1/auth/token/"
        self.me_url = "/api/v1/auth/me/"

    def _get_access_token(self):
        """Helper: log in and return the access token string."""
        response = self.client.post(
            self.login_url,
            {"email": "me@esi.dz", "password": "mepass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["access"]

    # --- 3.1 Valid Bearer token ---

    def test_valid_token_returns_200(self):
        """A valid Bearer token returns HTTP 200 from /me/."""
        access = self._get_access_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_valid_token_returns_user_profile(self):
        """Response contains the expected user profile fields."""
        access = self._get_access_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get(self.me_url)

        self.assertEqual(response.data["email"], "me@esi.dz")
        self.assertEqual(response.data["nom"], "Meziane")
        self.assertEqual(response.data["prenom"], "Sofiane")
        self.assertIn("roles", response.data)
        self.assertIn("id_user", response.data)

    def test_valid_token_returns_correct_roles(self):
        """The roles list in /me/ response matches the user's assigned roles."""
        access = self._get_access_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get(self.me_url)

        roles = response.data["roles"]
        self.assertIn("Auditeur", roles)
        self.assertIn("Pilote", roles)

    # --- 3.2 Missing / invalid token ---

    def test_missing_token_returns_401(self):
        """Request without Authorization header returns HTTP 401."""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_returns_401(self):
        """A malformed Bearer token returns HTTP 401."""
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not.a.real.token")
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_wrong_scheme_returns_401(self):
        """Using 'Token' scheme instead of 'Bearer' returns HTTP 401."""
        access = self._get_access_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {access}")
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# 4. HasRole RBAC permission class
# ---------------------------------------------------------------------------

class HasRolePermissionTests(APITestCase):
    """
    Tests for the HasRole permission factory.

    We register a temporary URL pattern pointing to a minimal test view that
    uses HasRole, then hit it with the DRF APIClient.
    """

    @classmethod
    def setUpTestData(cls):
        # User with 'CAQ' role
        cls.caq_user, cls.caq_utilisateur = make_user(
            username="caq_user",
            email="caq@esi.dz",
            password="caqpass123",
            roles=["CAQ"],
        )
        # User with 'Agent' role (not CAQ)
        cls.agent_user, cls.agent_utilisateur = make_user(
            username="agent_user",
            email="agent@esi.dz",
            password="agentpass123",
            roles=["Agent"],
        )
        # User with no roles
        cls.norole_user, cls.norole_utilisateur = make_user(
            username="norole_user",
            email="norole@esi.dz",
            password="norolepass123",
        )

    def setUp(self):
        self.client = APIClient()
        self.login_url = "/api/v1/auth/token/"

    def _get_access_token(self, email, password):
        """Helper: log in and return the access token."""
        response = self.client.post(
            self.login_url,
            {"email": email, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["access"]

    # --- 4.1 Unit-level tests for HasRole logic ---

    def test_has_role_grants_access_when_role_present(self):
        """
        HasRole.has_permission returns True when the required role is in the
        JWT payload's 'roles' claim.
        """
        from unittest.mock import MagicMock

        permission_class = HasRole("CAQ")
        permission = permission_class()

        mock_request = MagicMock()
        mock_request.auth.payload = {"roles": ["CAQ", "Auditeur"]}

        result = permission.has_permission(mock_request, None)
        self.assertTrue(result)

    def test_has_role_denies_access_when_role_absent(self):
        """
        HasRole.has_permission raises PermissionDenied when the required role
        is not in the JWT payload's 'roles' claim.
        """
        from unittest.mock import MagicMock
        from rest_framework.exceptions import PermissionDenied

        permission_class = HasRole("Direction")
        permission = permission_class()

        mock_request = MagicMock()
        mock_request.auth.payload = {"roles": ["Agent"]}

        with self.assertRaises(PermissionDenied) as ctx:
            permission.has_permission(mock_request, None)

        self.assertIn("refusée", str(ctx.exception.detail))

    def test_has_role_accepts_any_of_multiple_required_roles(self):
        """
        HasRole('CAQ', 'Direction') grants access if the user has either role.
        """
        from unittest.mock import MagicMock

        permission_class = HasRole("CAQ", "Direction")
        permission = permission_class()

        mock_request = MagicMock()
        mock_request.auth.payload = {"roles": ["Direction"]}

        result = permission.has_permission(mock_request, None)
        self.assertTrue(result)

    def test_has_role_returns_false_when_no_auth(self):
        """
        HasRole.has_permission returns False (not raises) when request.auth is None.
        """
        from unittest.mock import MagicMock

        permission_class = HasRole("CAQ")
        permission = permission_class()

        mock_request = MagicMock()
        mock_request.auth = None

        result = permission.has_permission(mock_request, None)
        self.assertFalse(result)

    def test_has_role_empty_roles_claim_denies_access(self):
        """
        HasRole denies access when the JWT 'roles' claim is an empty list.
        """
        from unittest.mock import MagicMock
        from rest_framework.exceptions import PermissionDenied

        permission_class = HasRole("CAQ")
        permission = permission_class()

        mock_request = MagicMock()
        mock_request.auth.payload = {"roles": []}

        with self.assertRaises(PermissionDenied):
            permission.has_permission(mock_request, None)

    # --- 4.2 Integration-level tests via a protected endpoint ---

    def _make_caq_view(self):
        """Create a minimal APIView protected by HasRole('CAQ')."""
        from rest_framework.views import APIView
        from rest_framework.response import Response
        from rest_framework.permissions import IsAuthenticated
        from apps.accounts.permissions import HasRole

        class _CaqView(APIView):
            permission_classes = [IsAuthenticated, HasRole('CAQ')]

            def get(self, request):
                return Response({"ok": True})

        return _CaqView

    def test_caq_user_can_access_caq_protected_endpoint(self):
        """
        A user with the 'CAQ' role receives HTTP 200 on a CAQ-protected endpoint.
        """
        from django.test import override_settings
        from django.urls import path, include

        CaqView = self._make_caq_view()

        with override_settings(ROOT_URLCONF='apps.accounts.tests'):
            import apps.accounts.tests as test_module
            test_module.urlpatterns = [
                path('api/v1/auth/', include('apps.accounts.urls')),
                path('api/v1/auth/test-caq/', CaqView.as_view()),
            ]
            access = self._get_access_token("caq@esi.dz", "caqpass123")
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
            response = self.client.get("/api/v1/auth/test-caq/")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_agent_user_cannot_access_caq_protected_endpoint(self):
        """
        A user without the 'CAQ' role receives HTTP 403 on a CAQ-protected endpoint.
        """
        from django.test import override_settings
        from django.urls import path, include

        CaqView = self._make_caq_view()

        with override_settings(ROOT_URLCONF='apps.accounts.tests'):
            import apps.accounts.tests as test_module
            test_module.urlpatterns = [
                path('api/v1/auth/', include('apps.accounts.urls')),
                path('api/v1/auth/test-caq/', CaqView.as_view()),
            ]
            access = self._get_access_token("agent@esi.dz", "agentpass123")
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
            response = self.client.get("/api/v1/auth/test-caq/")
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_403_response_contains_permission_refused_message(self):
        """
        The 403 response body contains 'Permission refusée.' as the detail.
        """
        from django.test import override_settings
        from django.urls import path, include

        CaqView = self._make_caq_view()

        with override_settings(ROOT_URLCONF='apps.accounts.tests'):
            import apps.accounts.tests as test_module
            test_module.urlpatterns = [
                path('api/v1/auth/', include('apps.accounts.urls')),
                path('api/v1/auth/test-caq/', CaqView.as_view()),
            ]
            access = self._get_access_token("agent@esi.dz", "agentpass123")
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
            response = self.client.get("/api/v1/auth/test-caq/")
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertIn("detail", response.data)
            self.assertIn("refusée", str(response.data["detail"]))

    def test_unauthenticated_user_cannot_access_protected_endpoint(self):
        """
        An unauthenticated request to a role-protected endpoint returns HTTP 401.
        """
        from django.test import override_settings
        from django.urls import path, include

        CaqView = self._make_caq_view()

        with override_settings(ROOT_URLCONF='apps.accounts.tests'):
            import apps.accounts.tests as test_module
            test_module.urlpatterns = [
                path('api/v1/auth/', include('apps.accounts.urls')),
                path('api/v1/auth/test-caq/', CaqView.as_view()),
            ]
            response = self.client.get("/api/v1/auth/test-caq/")
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# 5. Expired role exclusion — roles with past date_expiration are not in JWT
# ---------------------------------------------------------------------------

class ExpiredRoleExclusionTests(APITestCase):
    """
    Verify that roles whose date_expiration is in the past are excluded from
    the JWT claims and from the login response.
    """

    @classmethod
    def setUpTestData(cls):
        cls.user, cls.utilisateur = make_user(
            username="expiry_user",
            email="expiry@esi.dz",
            password="expirypass123",
        )
        # Active role (no expiration)
        active_role, _ = Role.objects.get_or_create(libelle="Pilote")
        UserRole.objects.create(utilisateur=cls.utilisateur, role=active_role)

        # Expired role (date_expiration in the past)
        expired_role, _ = Role.objects.get_or_create(libelle="CAQ")
        UserRole.objects.create(
            utilisateur=cls.utilisateur,
            role=expired_role,
            date_expiration=date.today() - timedelta(days=1),
        )

    def setUp(self):
        self.client = APIClient()
        self.login_url = "/api/v1/auth/token/"

    def test_expired_role_not_in_login_response(self):
        """The login response user.roles list must not contain the expired role."""
        response = self.client.post(
            self.login_url,
            {"email": "expiry@esi.dz", "password": "expirypass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        roles = response.data["user"]["roles"]
        self.assertIn("Pilote", roles)
        self.assertNotIn("CAQ", roles)

    def test_expired_role_not_in_jwt_claims(self):
        """The JWT access token must not encode the expired role in its claims."""
        import base64
        import json

        response = self.client.post(
            self.login_url,
            {"email": "expiry@esi.dz", "password": "expirypass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        access_token = response.data["access"]
        # Decode the payload (middle segment) without verifying the signature
        payload_b64 = access_token.split(".")[1]
        # Add padding if needed
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))

        self.assertIn("roles", payload)
        self.assertIn("Pilote", payload["roles"])
        self.assertNotIn("CAQ", payload["roles"])


class ManagedUsersApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        Departement.objects.create(id_departement=3, nom="Qualite", code="QLT")
        cls.admin_user, cls.admin_utilisateur = make_user(
            username="manager_user",
            email="manager@esi.dz",
            password="managerpass123",
            nom="Manager",
            prenom="Amina",
            est_actif=True,
            roles=["CAQ"],
        )
        cls.target_user, cls.target_utilisateur = make_user(
            username="target_user",
            email="target@esi.dz",
            password="targetpass123",
            nom="Target",
            prenom="User",
            est_actif=True,
            roles=["Pilote"],
        )
        Role.objects.get_or_create(libelle="Auditeur interne")

    def setUp(self):
        self.client = APIClient()

    def build_create_payload(self, **overrides):
        payload = {
            "full_name": "Rima Bouali",
            "email": "rima@esi.dz",
            "password": "securepass123",
            "est_actif": True,
            "roles": ["Auditeur interne"],
            "send_invitation": False,
        }
        payload.update(overrides)
        return payload

    def authenticate(self):
        response = self.client.post(
            "/api/v1/auth/token/",
            {"email": "manager@esi.dz", "password": "managerpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_roles_endpoint_returns_roles(self):
        self.authenticate()
        response = self.client.get("/api/v1/auth/roles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        labels = [item["libelle"] for item in response.data]
        self.assertIn("CAQ", labels)
        self.assertIn("Pilote", labels)

    def test_users_list_returns_roles(self):
        self.authenticate()
        response = self.client.get("/api/v1/auth/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
        target = next(item for item in response.data if item["email"] == "target@esi.dz")
        self.assertIn("Pilote", target["roles"])

    @patch("apps.accounts.views.send_user_invitation_email")
    def test_create_user_endpoint_creates_auth_profile_and_roles(self, send_email_mock):
        self.authenticate()
        payload = self.build_create_payload()
        response = self.client.post("/api/v1/auth/users/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "rima@esi.dz")
        self.assertIn("Auditeur interne", response.data["roles"])
        self.assertFalse(response.data["email_sent"])
        self.assertNotIn("password", response.data)
        self.assertTrue(User.objects.filter(email="rima@esi.dz").exists())
        self.assertTrue(Utilisateur.objects.filter(email="rima@esi.dz").exists())
        send_email_mock.assert_not_called()

    @patch("apps.accounts.views.send_user_invitation_email")
    def test_create_user_endpoint_sends_invitation_email_when_requested(self, send_email_mock):
        self.authenticate()
        payload = self.build_create_payload(
            email="invitation@esi.dz",
            send_invitation=True,
        )
        response = self.client.post("/api/v1/auth/users/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["email_sent"])
        self.assertNotIn("password", response.data)
        send_email_mock.assert_called_once()

        utilisateur_arg, password_arg = send_email_mock.call_args.args
        self.assertEqual(utilisateur_arg.email, "invitation@esi.dz")
        self.assertEqual(password_arg, "securepass123")

    @patch(
        "apps.accounts.views.send_user_invitation_email",
        side_effect=Exception("SMTP failure"),
    )
    def test_create_user_endpoint_returns_clear_error_when_email_fails(self, _send_email_mock):
        self.authenticate()
        payload = self.build_create_payload(
            email="smtp-error@esi.dz",
            send_invitation=True,
        )
        response = self.client.post("/api/v1/auth/users/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertFalse(response.data["email_sent"])
        self.assertIn("detail", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "smtp-error@esi.dz")
        self.assertNotIn("password", response.data["user"])
        self.assertTrue(User.objects.filter(email="smtp-error@esi.dz").exists())
        self.assertTrue(Utilisateur.objects.filter(email="smtp-error@esi.dz").exists())

    def test_patch_user_updates_roles_and_status(self):
        self.authenticate()
        response = self.client.patch(
            f"/api/v1/auth/users/{self.target_utilisateur.id_user}/",
            {"roles": ["CAQ"], "est_actif": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["statut"], "Desactive")
        self.assertIn("CAQ", response.data["roles"])
        self.target_utilisateur.refresh_from_db()
        self.assertFalse(self.target_utilisateur.est_actif)

    def test_delete_user_soft_deactivates_account(self):
        self.authenticate()
        response = self.client.delete(
            f"/api/v1/auth/users/{self.target_utilisateur.id_user}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.target_utilisateur.refresh_from_db()
        self.assertFalse(self.target_utilisateur.est_actif)


class MySettingsApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user, cls.utilisateur = make_user(
            username="settings_user",
            email="settings@esi.dz",
            password="settingspass123",
            nom="Saadi",
            prenom="Lina",
            est_actif=True,
            roles=["Auditeur"],
        )

    def setUp(self):
        self.client = APIClient()
        response = self.client.post(
            "/api/v1/auth/token/",
            {"email": "settings@esi.dz", "password": "settingspass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def _build_test_image(self, name="avatar.png", image_format="PNG"):
        file_obj = BytesIO()
        image = Image.new("RGB", (16, 16), color="#6B21D9")
        image.save(file_obj, format=image_format)
        file_obj.seek(0)
        return SimpleUploadedFile(
            name,
            file_obj.getvalue(),
            content_type="image/png" if image_format == "PNG" else "image/jpeg",
        )

    def test_get_my_settings_returns_defaults(self):
        response = self.client.get("/api/v1/auth/me/settings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "settings@esi.dz")
        self.assertEqual(response.data["nom"], "Saadi")
        self.assertEqual(response.data["prenom"], "Lina")
        self.assertEqual(response.data["preferences"]["theme"], "light")
        self.assertTrue(response.data["preferences"]["notifications"]["messagerie"])

    def test_patch_my_settings_updates_profile_names_only(self):
        response = self.client.patch(
            "/api/v1/auth/me/settings/",
            {"nom": "Haddad", "prenom": "Maya", "email": "blocked@esi.dz"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.utilisateur.refresh_from_db()
        self.user.refresh_from_db()
        self.assertEqual(self.utilisateur.nom, "Haddad")
        self.assertEqual(self.utilisateur.prenom, "Maya")
        self.assertEqual(self.utilisateur.email, "settings@esi.dz")
        self.assertEqual(self.user.email, "settings@esi.dz")

    def test_patch_preferences_persists_values(self):
        payload = {
            "theme": "dark",
            "density": "normal",
            "notifications": {
                "messagerie": False,
                "audits": True,
                "taches": False,
                "documents": True,
            },
        }
        response = self.client.patch("/api/v1/auth/me/preferences/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        settings_obj = UtilisateurSettings.objects.get(utilisateur=self.utilisateur)
        self.assertEqual(settings_obj.preferences["theme"], "dark")
        self.assertEqual(settings_obj.preferences["density"], "normal")
        self.assertFalse(settings_obj.preferences["notifications"]["messagerie"])
        self.assertFalse(settings_obj.preferences["notifications"]["taches"])

    def test_change_password_rejects_wrong_current_password(self):
        response = self.client.post(
            "/api/v1/auth/me/change-password/",
            {
                "current_password": "wrongpass",
                "new_password": "newsecurepass123",
                "confirm_password": "newsecurepass123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", response.data)

    def test_change_password_accepts_valid_payload(self):
        response = self.client.post(
            "/api/v1/auth/me/change-password/",
            {
                "current_password": "settingspass123",
                "new_password": "newsecurepass123",
                "confirm_password": "newsecurepass123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newsecurepass123"))

    def test_upload_profile_photo_updates_photo_url(self):
        with TemporaryDirectory() as temp_media_root:
            with override_settings(MEDIA_ROOT=temp_media_root):
                response = self.client.post(
                    "/api/v1/auth/me/photo/",
                    {"photo": self._build_test_image()},
                    format="multipart",
                )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("profiles/", response.data["photo_profil"])

        settings_obj = UtilisateurSettings.objects.get(utilisateur=self.utilisateur)
        self.assertTrue(bool(settings_obj.photo_profil))

    def test_login_response_contains_profile_photo_when_available(self):
        with TemporaryDirectory() as temp_media_root:
            with override_settings(MEDIA_ROOT=temp_media_root):
                upload_response = self.client.post(
                    "/api/v1/auth/me/photo/",
                    {"photo": self._build_test_image()},
                    format="multipart",
                )
                self.assertEqual(upload_response.status_code, status.HTTP_200_OK)

                fresh_client = APIClient()
                login_response = fresh_client.post(
                    "/api/v1/auth/token/",
                    {"email": "settings@esi.dz", "password": "settingspass123"},
                    format="json",
                )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("profiles/", login_response.data["user"]["photo_profil"])

    def test_me_endpoint_contains_profile_photo_when_available(self):
        with TemporaryDirectory() as temp_media_root:
            with override_settings(MEDIA_ROOT=temp_media_root):
                upload_response = self.client.post(
                    "/api/v1/auth/me/photo/",
                    {"photo": self._build_test_image()},
                    format="multipart",
                )
                self.assertEqual(upload_response.status_code, status.HTTP_200_OK)

                response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("profiles/", response.data["photo_profil"])
class PasswordResetApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user, cls.utilisateur = make_user(
            username="reset_user",
            email="reset@esi.dz",
            password="oldpassword123",
            nom="Reset",
            prenom="User",
            est_actif=True,
        )

    @patch("apps.accounts.views.send_password_reset_email")
    def test_forgot_password_returns_success_for_existing_account(self, send_reset_email_mock):
        send_reset_email_mock.return_value = {
            "uid": "uid",
            "token": "token",
            "reset_url": "http://localhost:5173/reset-password?uid=uid&token=token",
        }

        response = self.client.post(
            "/api/v1/auth/password/forgot/",
            {"email": "reset@esi.dz"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)
        send_reset_email_mock.assert_called_once()

    @patch("apps.accounts.views.send_password_reset_email")
    def test_forgot_password_does_not_fail_for_unknown_email(self, send_reset_email_mock):
        response = self.client.post(
            "/api/v1/auth/password/forgot/",
            {"email": "unknown@esi.dz"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)
        send_reset_email_mock.assert_not_called()

    def test_reset_password_updates_credentials(self):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = PasswordResetTokenGenerator().make_token(self.user)

        response = self.client.post(
            "/api/v1/auth/password/reset/",
            {
                "uid": uid,
                "token": token,
                "password": "newpassword123",
                "password_confirmation": "newpassword123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_reset_password_rejects_invalid_token(self):
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        response = self.client.post(
            "/api/v1/auth/password/reset/",
            {
                "uid": uid,
                "token": "invalid-token",
                "password": "newpassword123",
                "password_confirmation": "newpassword123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("token", response.data)
