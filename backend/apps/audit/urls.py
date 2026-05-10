from django.urls import path,include
from . import views


urlpatterns = []

urlpatterns += [
    path("", include("apps.audit.urls_terrain")),
]