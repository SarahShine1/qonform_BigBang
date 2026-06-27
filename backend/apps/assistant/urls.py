from django.urls import path

from .views import AssistantQueryView


app_name = "assistant"

urlpatterns = [
    path("query/", AssistantQueryView.as_view(), name="assistant-query"),
]

