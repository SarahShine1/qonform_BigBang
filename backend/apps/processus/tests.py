from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.accounts.models import Role, User, UserRole, Utilisateur
from apps.processus.models import Processus


def make_user(
    username,
    email,
    password,
    roles=None,
    nom="Test",
    prenom="User",
):
    user = User.objects.create_user(username=username, email=email, password=password)
    utilisateur = Utilisateur.objects.create(
        auth=user,
        nom=nom,
        prenom=prenom,
        email=email,
        est_actif=True,
    )
    for role_name in roles or []:
        role, _ = Role.objects.get_or_create(libelle=role_name)
        UserRole.objects.create(utilisateur=utilisateur, role=role)
    return user, utilisateur


class ProcessusExternalAuditorApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        make_user(
            username="external_processus_user",
            email="external-processus@esi.dz",
            password="externalpass123",
            roles=["Auditeur Externe"],
        )
        Processus.objects.create(
            code_process="QLT-SUP-001",
            nom="Gestion documentaire",
            description="Processus test",
            type_process="Support",
            id_departement=1,
            id_pilote=None,
        )

    def setUp(self):
        self.client = APIClient()
        response = self.client.post(
            "/api/v1/auth/token/",
            {"email": "external-processus@esi.dz", "password": "externalpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_external_auditor_can_list_processes(self):
        response = self.client.get("/api/v1/processus/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_external_auditor_cannot_create_process(self):
        response = self.client.post(
            "/api/v1/processus/",
            {
                "code_process": "QLT-SUP-002",
                "nom": "Nouveau processus",
                "type_process": "Support",
                "id_departement": 1,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
