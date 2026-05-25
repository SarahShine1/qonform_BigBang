from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.accounts.models import User, Utilisateur
from apps.dictionary.models import DictionaryTerm


def make_user(username, email, password="securepass123", nom="Nom", prenom="Prenom"):
    user = User.objects.create_user(username=username, email=email, password=password)
    profile = Utilisateur.objects.create(
        auth=user,
        nom=nom,
        prenom=prenom,
        email=email,
        est_actif=True,
    )
    return user, profile


class AssistantApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user, cls.profile = make_user(
            username="assistant-user",
            email="assistant@esi.dz",
            nom="Qualite",
            prenom="Agent",
        )
        DictionaryTerm.objects.create(
            term="KPI",
            category="Indicateur",
            definition="Indicateur cle de performance utilise pour mesurer un resultat.",
            example="Delai moyen de traitement.",
            created_by=cls.profile,
            updated_by=cls.profile,
        )

    def setUp(self):
        self.client = APIClient()

    def test_unauthenticated_user_gets_401(self):
        response = self.client.post(
            "/api/v1/assistant/query/",
            {"question": "C'est quoi un KPI ?"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_ask_dictionary_question(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/assistant/query/",
            {"question": "C'est quoi un KPI ?"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("answer", response.data)
        self.assertIn("KPI", response.data["answer"])
        self.assertEqual(response.data["intent"], "dictionary_term")

    def test_field_help_question_returns_iso_article(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/assistant/query/",
            {"question": "Quel article ISO pour les risques ?"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("6.1", response.data["answer"])
        self.assertEqual(response.data["intent"], "iso_clause_mapping")

    def test_unknown_question_returns_fallback(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/assistant/query/",
            {"question": "Question sans correspondance claire"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["intent"], "fallback")
        self.assertIn("Je n'ai pas trouve", response.data["answer"])

    def test_department_responsible_question_does_not_crash(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/assistant/query/",
            {"question": "Qui est le responsable du departement Finances ?"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("answer", response.data)
        self.assertEqual(response.data["intent"], "department_responsible")

    def test_response_always_includes_answer_field(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/assistant/query/",
            {"question": "Comment remplir le champ objectifs mesurables ?"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("answer", response.data)

