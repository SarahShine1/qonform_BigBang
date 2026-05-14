from django.urls import path

from .views import MyMaturityAssessmentView


urlpatterns = [
    path("my-assessment/", MyMaturityAssessmentView.as_view(), name="my-maturity-assessment"),
]

