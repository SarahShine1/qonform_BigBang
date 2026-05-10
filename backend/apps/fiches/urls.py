from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import NormeViewSet, SectionTemplateViewSet, ChampTemplateViewSet, VersionFicheViewSet

router = DefaultRouter()
router.register(r"normes",            NormeViewSet,           basename="norme")
router.register(r"template/sections", SectionTemplateViewSet, basename="section-template")
router.register(r"template/champs",   ChampTemplateViewSet,   basename="champ-template")
router.register(r"",                  VersionFicheViewSet,    basename="fiche")

urlpatterns = [
    path("", include(router.urls)),
]
