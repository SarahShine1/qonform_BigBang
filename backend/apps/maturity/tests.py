from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.accounts.models import Role, User, UserRole, Utilisateur
from apps.maturity.models import (
    MaturityArticle,
    MaturityAssessment,
    MaturityRequirement,
    MaturityRequirementResponse,
)


def make_user(
    username="maturity_user",
    email="maturity@esi.dz",
    password="securepass123",
    nom="Amara",
    prenom="Nina",
    est_actif=True,
    roles=None,
):
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )
    utilisateur = Utilisateur.objects.create(
        auth=user,
        nom=nom,
        prenom=prenom,
        email=email,
        est_actif=est_actif,
    )
    for role_name in roles or []:
        role, _ = Role.objects.get_or_create(libelle=role_name)
        UserRole.objects.create(utilisateur=utilisateur, role=role)
    return user, utilisateur


class MaturityAssessmentApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user, cls.utilisateur = make_user(roles=["CAQ"])

    def setUp(self):
        self.client = APIClient()
        login_response = self.client.post(
            "/api/v1/auth/token/",
            {"email": "maturity@esi.dz", "password": "securepass123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )

    def test_get_assessment_bootstraps_reference_data_and_user_responses(self):
        response = self.client.get("/api/v1/maturity/my-assessment/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["articles"]), 7)
        self.assertEqual(response.data["global_score"], 0)
        self.assertEqual(response.data["interpretation"], "Initial")
        self.assertTrue(MaturityArticle.objects.exists())
        self.assertTrue(MaturityRequirement.objects.exists())
        self.assertTrue(MaturityAssessment.objects.filter(user=self.user).exists())
        self.assertTrue(
            MaturityRequirementResponse.objects.filter(assessment__user=self.user).exists()
        )

    def test_put_assessment_updates_scores_evidence_and_radar(self):
        initial_response = self.client.get("/api/v1/maturity/my-assessment/")
        self.assertEqual(initial_response.status_code, status.HTTP_200_OK)

        requirement_ids = [
            article["exigences"][0]["id"]
            for article in initial_response.data["articles"][:3]
        ]
        payload = {
            "responses": [
                {"requirement_id": requirement_ids[0], "score": 100, "preuve": "Procedure diffusee"},
                {"requirement_id": requirement_ids[1], "score": 66, "preuve": "KPI disponible"},
                {"requirement_id": requirement_ids[2], "score": 33, "preuve": "Analyse partielle"},
            ]
        }

        response = self.client.put(
            "/api/v1/maturity/my-assessment/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["radar"]), len(response.data["articles"]))
        self.assertGreater(response.data["global_score"], 0)

        updated = {
            item["id"]: item
            for article in response.data["articles"]
            for item in article["exigences"]
        }
        self.assertEqual(updated[requirement_ids[0]]["score"], 100)
        self.assertEqual(updated[requirement_ids[0]]["preuve"], "Procedure diffusee")

    def test_unauthenticated_access_is_rejected(self):
        client = APIClient()
        response = client.get("/api/v1/maturity/my-assessment/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

