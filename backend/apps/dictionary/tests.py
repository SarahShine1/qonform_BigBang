from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.accounts.models import Role, User, UserRole, Utilisateur

from .models import DictionaryTerm


def make_user(
    username,
    email,
    password="securepass123",
    nom="Nom",
    prenom="Prenom",
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
        est_actif=True,
    )
    for role_name in roles or []:
        role, _ = Role.objects.get_or_create(libelle=role_name)
        UserRole.objects.create(utilisateur=utilisateur, role=role)
    return user, utilisateur


class DictionaryApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.reader_user, cls.reader_profile = make_user(
            username="reader_user",
            email="reader@esi.dz",
            roles=["Pilote"],
        )
        cls.chef_user, cls.chef_profile = make_user(
            username="chef_user",
            email="chef@esi.dz",
            roles=["Chef cellule qualit\u00e9"],
        )
        cls.auditeur_user, cls.auditeur_profile = make_user(
            username="auditeur_user",
            email="auditeur@esi.dz",
            roles=["Auditeur interne"],
        )
        cls.term = DictionaryTerm.objects.create(
            term="Audit",
            category="Audit",
            definition="Examen methodique et documente d'une activite.",
            example="Audit interne du processus achat.",
            synonyms=["evaluation", "controle"],
            created_by=cls.chef_profile,
            updated_by=cls.chef_profile,
        )

    def setUp(self):
        self.client = APIClient()

    def test_authenticated_user_can_list_dictionary_terms(self):
        self.client.force_authenticate(user=self.reader_user)
        response = self.client.get("/api/v1/dictionary/terms/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["term"], "Audit")

    def test_authenticated_user_can_search_dictionary_terms(self):
        self.client.force_authenticate(user=self.reader_user)
        response = self.client.get("/api/v1/dictionary/terms/?search=controle")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["term"], "Audit")

    def test_anonymous_user_cannot_list_dictionary_terms(self):
        response = self.client.get("/api/v1/dictionary/terms/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_normal_user_cannot_create_dictionary_term(self):
        self.client.force_authenticate(user=self.reader_user)
        response = self.client.post(
            "/api/v1/dictionary/terms/",
            {
                "term": "Processus",
                "category": "Processus",
                "definition": "Suite d'activites liees.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_roles_can_create_dictionary_terms(self):
        for user in (self.chef_user, self.auditeur_user):
            with self.subTest(user=user.email):
                self.client.force_authenticate(user=user)
                response = self.client.post(
                    "/api/v1/dictionary/terms/",
                    {
                        "term": f"Processus {user.id}",
                        "category": "Processus",
                        "definition": "Suite d'activites liees transformant des elements d'entree.",
                        "synonyms": "flux, enchainement",
                    },
                    format="json",
                )

                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertEqual(response.data["category"], "Processus")
                self.assertEqual(response.data["synonyms"], ["flux", "enchainement"])

    def test_duplicate_term_case_insensitive_is_rejected(self):
        self.client.force_authenticate(user=self.auditeur_user)
        response = self.client.post(
            "/api/v1/dictionary/terms/",
            {
                "term": "  audit  ",
                "category": "Audit",
                "definition": "Tentative de doublon.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("term", response.data)

    def test_delete_soft_deletes_term(self):
        self.client.force_authenticate(user=self.auditeur_user)
        response = self.client.delete(f"/api/v1/dictionary/terms/{self.term.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.term.refresh_from_db()
        self.assertFalse(self.term.is_active)

        list_response = self.client.get("/api/v1/dictionary/terms/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data, [])
