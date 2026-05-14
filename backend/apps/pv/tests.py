from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import date
from .models import PV

User = get_user_model()


class PVModelTestCase(TestCase):
    """Test cases for PV model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.participant1 = User.objects.create_user(
            username='participant1',
            email='participant1@example.com',
            password='testpass123'
        )
        self.participant2 = User.objects.create_user(
            username='participant2',
            email='participant2@example.com',
            password='testpass123'
        )

    def test_pv_code_generation(self):
        """Test automatic PV code generation."""
        pv = PV.objects.create(
            type='AUDIT',
            date=date.today(),
        )
        self.assertTrue(pv.code.startswith('PV_AUDIT_'))
        self.assertEqual(len(pv.code), 19)  # PV_AUDIT_YYYYMMDD

    def test_unique_code_generation(self):
        """Test that generated codes are unique."""
        pv1 = PV.objects.create(type='AUDIT', date=date.today())
        pv2 = PV.objects.create(type='AUDIT', date=date.today())

        self.assertNotEqual(pv1.code, pv2.code)
        self.assertTrue(pv1.code.startswith('PV_AUDIT_'))
        self.assertTrue(pv2.code.startswith('PV_AUDIT_'))

    def test_pv_str_representation(self):
        """Test PV string representation."""
        pv = PV.objects.create(
            code='PV_AUDIT_20260511',
            type='AUDIT',
            date=date(2026, 5, 11),
        )
        expected = 'PV_AUDIT_20260511 - Audit (2026-05-11)'
        self.assertEqual(str(pv), expected)

    def test_pv_with_participants(self):
        """Test PV with multiple participants."""
        pv = PV.objects.create(type='MEETING', date=date.today())
        pv.participants.add(self.participant1, self.participant2)

        self.assertEqual(pv.participants.count(), 2)
        self.assertIn(self.participant1, pv.participants.all())


class PVAPITestCase(APITestCase):
    """Test cases for PV API endpoints."""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.participant1 = User.objects.create_user(
            username='participant1',
            email='participant1@example.com',
            password='testpass123'
        )

        self.pv = PV.objects.create(
            code='PV_AUDIT_20260511',
            type='AUDIT',
            date=date(2026, 5, 11),
        )
        self.pv.participants.add(self.participant1)

    def test_list_pvs(self):
        """Test GET /api/v1/pv/"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/pv/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get('results', [])), 1)

    def test_retrieve_pv(self):
        """Test GET /api/v1/pv/{id}/"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/v1/pv/{self.pv.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'PV_AUDIT_20260511')
        self.assertEqual(response.data['type'], 'AUDIT')

    def test_filter_pvs_by_type(self):
        """Test GET /api/v1/pv/?type=AUDIT"""
        self.client.force_authenticate(user=self.user)
        PV.objects.create(type='SUIVI', date=date.today())

        response = self.client.get('/api/v1/pv/?type=AUDIT')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertTrue(all(pv['type'] == 'AUDIT' for pv in results))

    def test_pv_statistics(self):
        """Test GET /api/v1/pv/statistics/"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/pv/statistics/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_pvs', response.data)
        self.assertIn('by_type', response.data)

    def test_pv_participants(self):
        """Test GET /api/v1/pv/{id}/participants/"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/v1/pv/{self.pv.id}/participants/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['pv_code'], 'PV_AUDIT_20260511')
        self.assertEqual(response.data['participants_count'], 1)

    def test_unauthorized_access(self):
        """Test unauthenticated users cannot access PV API."""
        response = self.client.get('/api/v1/pv/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ✅ Test suppression PV
    def test_delete_pv(self):
        """Test DELETE /api/v1/pv/{id}/"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/v1/pv/{self.pv.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PV.objects.filter(id=self.pv.id).exists())

    # ✅ Test filtre par date
    def test_filter_pvs_by_date_range(self):
        """Test GET /api/v1/pv/by-date/"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            '/api/v1/pv/by-date/?start_date=2026-05-01&end_date=2026-05-31'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)