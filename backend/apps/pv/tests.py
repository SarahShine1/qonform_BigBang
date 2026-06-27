from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import PV


User = get_user_model()


class PVModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.participant1 = User.objects.create_user(
            username="participant1",
            email="participant1@example.com",
            password="testpass123",
        )
        self.participant2 = User.objects.create_user(
            username="participant2",
            email="participant2@example.com",
            password="testpass123",
        )

    def test_pv_code_generation(self):
        pv = PV.objects.create(
            type="SUIVI",
            date=date.today(),
        )
        self.assertTrue(pv.code.startswith("PV_SUIVI_"))
        self.assertEqual(pv.categorie, "PV")

    def test_unique_code_generation(self):
        pv1 = PV.objects.create(type="SUIVI", date=date.today())
        pv2 = PV.objects.create(type="SUIVI", date=date.today())

        self.assertNotEqual(pv1.code, pv2.code)
        self.assertTrue(pv1.code.startswith("PV_SUIVI_"))
        self.assertTrue(pv2.code.startswith("PV_SUIVI_"))

    def test_pv_str_representation(self):
        pv = PV.objects.create(
            code="PV_SUIVI_20260511",
            type="SUIVI",
            date=date(2026, 5, 11),
        )
        self.assertEqual(str(pv), "PV_SUIVI_20260511 - Reunion de suivi (2026-05-11)")

    def test_pv_with_participants(self):
        pv = PV.objects.create(type="REVUE_DG", date=date.today())
        pv.participants.add(self.participant1, self.participant2)

        self.assertEqual(pv.participants.count(), 2)
        self.assertIn(self.participant1, pv.participants.all())


class PVAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.participant1 = User.objects.create_user(
            username="participant1",
            email="participant1@example.com",
            password="testpass123",
        )

        self.pv = PV.objects.create(
            code="PV_SUIVI_20260511",
            type="SUIVI",
            date=date(2026, 5, 11),
        )
        self.pv.participants.add(self.participant1)

    def test_list_pvs(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/pv/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get("results", [])), 1)

    def test_retrieve_pv(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/v1/pv/{self.pv.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["code"], "PV_SUIVI_20260511")
        self.assertEqual(response.data["type"], "SUIVI")

    def test_filter_pvs_by_type(self):
        self.client.force_authenticate(user=self.user)
        PV.objects.create(type="REVUE_DG", date=date.today())

        response = self.client.get("/api/v1/pv/?type=SUIVI")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertTrue(all(pv["type"] == "SUIVI" for pv in results))

    def test_pv_statistics(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/pv/statistics/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_pvs", response.data)
        self.assertIn("by_type", response.data)

    def test_pv_participants(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/v1/pv/{self.pv.id}/participants/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pv_code"], "PV_SUIVI_20260511")
        self.assertEqual(response.data["participants_count"], 1)

    def test_unauthorized_access(self):
        response = self.client.get("/api/v1/pv/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_pv(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/v1/pv/{self.pv.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PV.objects.filter(id=self.pv.id).exists())

    def test_filter_pvs_by_date_range(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            "/api/v1/pv/by-date/?start_date=2026-05-01&end_date=2026-05-31"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
