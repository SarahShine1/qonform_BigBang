from django.urls import path
from .views import (
    DocumentListView,
    DocumentUploadView,
    DocumentListCreateView,
    DocumentDetailView,
    DocumentDownloadView,
)

app_name = "documents"

urlpatterns = [
    # Fiche documents — filtered by ?id_version=X, stored in Supabase
    path("",                   DocumentListView.as_view(),       name="document-list"),
    path("upload/",            DocumentUploadView.as_view(),     name="document-upload"),

    # Support documents — CAQ management, local storage
    path("support/",           DocumentListCreateView.as_view(), name="document-support"),

    # Detail + delete (handles both Supabase and local docs)
    path("<int:pk>/",          DocumentDetailView.as_view(),     name="document-detail"),
    path("<int:pk>/download/", DocumentDownloadView.as_view(),   name="document-download"),
]
