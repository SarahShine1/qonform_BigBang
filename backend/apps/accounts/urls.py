from django.conf import settings
from django.urls import path
from .views import CustomTokenObtainPairView, CustomTokenRefreshView, MeView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth_me'),
]