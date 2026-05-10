from django.urls import path
from .views import DocumentDetailView, DocumentDownloadView, DocumentListCreateView

app_name = "documents"

urlpatterns = [
    # Liste + création
    path("", DocumentListCreateView.as_view(), name="document-list-create"),
    # Détail + suppression
    path("<int:pk>/", DocumentDetailView.as_view(), name="document-detail"),
    # Téléchargement
    path("<int:pk>/download/", DocumentDownloadView.as_view(), name="document-download"),
]