from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Role, User, UserRole, Utilisateur

from .models import Message


def make_user(
    email,
    password="securepass123",
    nom="Nom",
    prenom="Prenom",
    roles=None,
):
    user = User.objects.create_user(
        username=email,
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


class MessagingApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.auditeur_user, cls.auditeur_profile = make_user(
            email="auditeur@esi.dz",
            nom="Audit",
            prenom="Amina",
            roles=["Auditeur interne"],
        )
        cls.utilisateur_user, cls.utilisateur_profile = make_user(
            email="user@esi.dz",
            nom="User",
            prenom="Yacine",
            roles=["Pilote"],
        )
        cls.caq_user, cls.caq_profile = make_user(
            email="caq@esi.dz",
            nom="Qualite",
            prenom="Sara",
            roles=["CAQ"],
        )
        cls.other_user, cls.other_profile = make_user(
            email="other@esi.dz",
            nom="Ben",
            prenom="Nadia",
            roles=["Auditeur"],
        )
        cls.legacy_auth_user = User.objects.create_user(
            username="legacy@esi.dz",
            email="legacy@esi.dz",
            password="securepass123",
        )
        cls.legacy_profile = Utilisateur.objects.create(
            auth=None,
            nom="Legacy",
            prenom="User",
            email="legacy@esi.dz",
            est_actif=True,
        )
        legacy_role, _ = Role.objects.get_or_create(libelle="Pilote")
        UserRole.objects.create(utilisateur=cls.legacy_profile, role=legacy_role)

    def test_contacts_endpoint_returns_all_active_users_with_login_accounts(self):
        self.client.force_authenticate(user=self.auditeur_user)
        response = self.client.get("/api/v1/messaging/contacts/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {entry["id_user"] for entry in response.data}
        self.assertIn(self.utilisateur_profile.id_user, returned_ids)
        self.assertIn(self.caq_profile.id_user, returned_ids)
        self.assertIn(self.legacy_profile.id_user, returned_ids)
        self.assertIn(self.other_profile.id_user, returned_ids)
        self.assertNotIn(self.auditeur_profile.id_user, returned_ids)

    def test_user_can_send_message_to_auditeur(self):
        self.client.force_authenticate(user=self.utilisateur_user)
        response = self.client.post(
            "/api/v1/messaging/messages/",
            {
                "recipient_id": self.auditeur_profile.id_user,
                "content": "Bonjour, j'ai besoin d'un retour sur l'audit.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["conversation"]["counterpart"]["id_user"],
            self.auditeur_profile.id_user,
        )
        self.assertEqual(
            response.data["message"]["content"],
            "Bonjour, j'ai besoin d'un retour sur l'audit.",
        )

    def test_opening_messages_marks_received_messages_as_read(self):
        self.client.force_authenticate(user=self.utilisateur_user)
        create_response = self.client.post(
            "/api/v1/messaging/messages/",
            {
                "recipient_id": self.auditeur_profile.id_user,
                "content": "Premier message",
            },
            format="json",
        )
        conversation_id = create_response.data["conversation"]["id"]

        self.client.force_authenticate(user=self.auditeur_user)
        self.client.post(
            "/api/v1/messaging/messages/",
            {
                "recipient_id": self.utilisateur_profile.id_user,
                "content": "Recu, je reviens vers vous.",
            },
            format="json",
        )

        self.client.force_authenticate(user=self.utilisateur_user)
        response = self.client.get(
            f"/api/v1/messaging/conversations/{conversation_id}/messages/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unread_messages = Message.objects.exclude(sender=self.utilisateur_user).filter(
            conversation_id=conversation_id,
            is_read=False,
        )
        self.assertFalse(unread_messages.exists())

    def test_send_message_accepts_legacy_profile_resolved_by_email(self):
        self.client.force_authenticate(user=self.auditeur_user)
        response = self.client.post(
            "/api/v1/messaging/messages/",
            {
                "recipient_id": self.legacy_profile.id_user,
                "content": "Bonjour legacy",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["conversation"]["counterpart"]["id_user"],
            self.legacy_profile.id_user,
        )

    def test_non_auditeur_user_can_send_message_to_another_non_auditeur(self):
        self.client.force_authenticate(user=self.utilisateur_user)
        response = self.client.post(
            "/api/v1/messaging/messages/",
            {
                "recipient_id": self.caq_profile.id_user,
                "content": "Bonjour, je vous contacte pour le processus.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["conversation"]["counterpart"]["id_user"],
            self.caq_profile.id_user,
        )

    def test_auditeur_can_send_message_to_another_auditeur(self):
        self.client.force_authenticate(user=self.auditeur_user)
        response = self.client.post(
            "/api/v1/messaging/messages/",
            {
                "recipient_id": self.other_profile.id_user,
                "content": "Bonjour, peux-tu verifier ce point d'audit ?",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["conversation"]["counterpart"]["id_user"],
            self.other_profile.id_user,
        )
