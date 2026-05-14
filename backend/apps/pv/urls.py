from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PVViewSet

router = DefaultRouter()
router.register(r'', PVViewSet, basename='pv')

app_name = 'pv'

urlpatterns = [
    path('', include(router.urls)),
]
