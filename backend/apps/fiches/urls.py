from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import SectionTemplateViewSet, VersionFicheViewSet

router = DefaultRouter()
router.register(r"template/sections", SectionTemplateViewSet, basename="section-template")
router.register(r"", VersionFicheViewSet, basename="fiche")

urlpatterns = [
    path("", include(router.urls)),
]
