from django.urls import path
from . import views

urlpatterns = [
    path("", views.mes_notifications, name="mes-notifications"),
    path("<int:pk>/lue/", views.marquer_lue, name="notification-lue"),
]