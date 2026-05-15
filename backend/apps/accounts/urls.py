from django.urls import path

from .views import (
    ChangePasswordView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    ForgotPasswordView,
    ManagedUserDetailView,
    ManagedUserListCreateView,
    ManagedUserStatsView,
    MeView,
    ProfilePhotoUploadView,
    ResetPasswordView,
    RoleListView,
    UserPreferencesView,
    UserSettingsView,
)

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("password/forgot/", ForgotPasswordView.as_view(), name="password-forgot"),
    path("password/reset/", ResetPasswordView.as_view(), name="password-reset"),
    path("me/", MeView.as_view(), name="auth_me"),
    path("me/settings/", UserSettingsView.as_view(), name="me-settings"),
    path("me/photo/", ProfilePhotoUploadView.as_view(), name="me-photo"),
    path("me/change-password/", ChangePasswordView.as_view(), name="me-change-password"),
    path("me/preferences/", UserPreferencesView.as_view(), name="me-preferences"),
    path("roles/", RoleListView.as_view(), name="role-list"),
    path("users/", ManagedUserListCreateView.as_view(), name="managed-user-list-create"),
    path("users/stats/", ManagedUserStatsView.as_view(), name="managed-user-stats"),
    path("users/<int:user_id>/", ManagedUserDetailView.as_view(), name="managed-user-detail"),
]
