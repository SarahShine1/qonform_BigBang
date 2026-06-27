from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DictionaryTermViewSet

router = DefaultRouter()
router.register("terms", DictionaryTermViewSet, basename="dictionary-terms")

urlpatterns = [
    path("", include(router.urls)),
]

