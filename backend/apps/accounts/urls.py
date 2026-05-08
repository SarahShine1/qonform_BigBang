from django.urls import path

from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    ManagedUserDetailView,
    ManagedUserListCreateView,
    ManagedUserStatsView,
    MeView,
    RoleListView,
)

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="auth_me"),
    path("roles/", RoleListView.as_view(), name="role-list"),
    path("users/", ManagedUserListCreateView.as_view(), name="managed-user-list-create"),
    path("users/stats/", ManagedUserStatsView.as_view(), name="managed-user-stats"),
    path("users/<int:user_id>/", ManagedUserDetailView.as_view(), name="managed-user-detail"),
]
