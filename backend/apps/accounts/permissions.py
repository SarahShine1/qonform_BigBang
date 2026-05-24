from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission, SAFE_METHODS


def normalize_role(role):
    return " ".join(str(role or "").strip().upper().split())


def get_request_roles(request):
    if not request:
        return set()

    auth = getattr(request, "auth", None)
    payload = getattr(auth, "payload", None)
    if isinstance(payload, dict):
        roles = {
            normalize_role(role)
            for role in payload.get("roles", [])
            if str(role or "").strip()
        }
        if roles:
            return roles

    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return set()

    try:
        from .models import Utilisateur
        from .utils import get_active_role_labels_for_user

        utilisateur = Utilisateur.objects.filter(auth=user).first()
        if not utilisateur and getattr(user, "email", ""):
            utilisateur = Utilisateur.objects.filter(email__iexact=user.email).first()
        if not utilisateur:
            return set()

        return {
            normalize_role(role)
            for role in get_active_role_labels_for_user(utilisateur.id_user)
            if str(role or "").strip()
        }
    except Exception:
        return set()


def request_has_role(request, *roles):
    requested_roles = {
        normalize_role(role)
        for role in roles
        if str(role or "").strip()
    }
    if not requested_roles:
        return False
    return bool(get_request_roles(request).intersection(requested_roles))


def HasRole(*required_roles):
    """
    Permission factory for role-based access control.

    Usage on a view:
        permission_classes = [IsAuthenticated, HasRole('CAQ', 'Direction')]

    Returns a DRF BasePermission subclass that grants access when the
    authenticated user's JWT 'roles' claim contains at least one of the
    required roles.
    """

    class _HasRole(BasePermission):
        def has_permission(self, request, view):
            if not getattr(request, "user", None) or not request.user.is_authenticated:
                return False

            if request_has_role(request, *required_roles):
                return True

            raise PermissionDenied("Permission refusee.")

    _HasRole.__name__ = f"HasRole({', '.join(required_roles)})"
    _HasRole.__qualname__ = _HasRole.__name__
    return _HasRole


def DenyRole(*denied_roles):
    class _DenyRole(BasePermission):
        def has_permission(self, request, view):
            if request_has_role(request, *denied_roles):
                raise PermissionDenied("Permission refusee.")
            return True

    _DenyRole.__name__ = f"DenyRole({', '.join(denied_roles)})"
    _DenyRole.__qualname__ = _DenyRole.__name__
    return _DenyRole


def ReadOnlyForRole(*restricted_roles):
    class _ReadOnlyForRole(BasePermission):
        def has_permission(self, request, view):
            if request.method in SAFE_METHODS:
                return True
            if request_has_role(request, *restricted_roles):
                raise PermissionDenied("Permission refusee.")
            return True

    _ReadOnlyForRole.__name__ = f"ReadOnlyForRole({', '.join(restricted_roles)})"
    _ReadOnlyForRole.__qualname__ = _ReadOnlyForRole.__name__
    return _ReadOnlyForRole
