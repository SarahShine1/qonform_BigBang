from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied


def HasRole(*required_roles):
    """
    Permission factory for role-based access control.

    Usage on a view:
        permission_classes = [IsAuthenticated, HasRole('CAQ', 'Direction')]

    Returns a DRF BasePermission subclass that grants access when the
    authenticated user's JWT 'roles' claim contains at least one of the
    required roles.  Roles are read directly from the token payload — no
    additional database query is performed.

    Example:
        HasRole('CAQ')           # only CAQ users
        HasRole('CAQ', 'Pilote') # CAQ or Pilote users
    """

    class _HasRole(BasePermission):
        def has_permission(self, request, view):
            if not request.auth:
                return False

            token_roles = {
                str(role).strip().upper()
                for role in request.auth.payload.get('roles', [])
            }
            normalized_required = {
                str(role).strip().upper()
                for role in required_roles
            }
            if token_roles.intersection(normalized_required):
                return True

            raise PermissionDenied("Permission refusée.")

    # Give the class a meaningful name for debugging / repr
    _HasRole.__name__ = f"HasRole({', '.join(required_roles)})"
    _HasRole.__qualname__ = _HasRole.__name__

    return _HasRole
