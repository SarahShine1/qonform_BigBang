from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Role, User, UserRole, Utilisateur

from .models import OrganizationUnit
from .services import sync_unit_responsable_assignment


def make_user(email, password, role):
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
    )
    utilisateur = Utilisateur.objects.create(
        auth=user,
        nom='Benali',
        prenom='Ahmed',
        email=email,
        est_actif=True,
    )
    role_obj, _ = Role.objects.get_or_create(libelle=role)
    UserRole.objects.create(utilisateur=utilisateur, role=role_obj)
    return user, utilisateur


class OrganigrammeApiTests(APITestCase):
    def setUp(self):
        make_user('caq@esi.dz', 'pass12345', 'CAQ')
        make_user('pilote@esi.dz', 'pass12345', 'Pilote')

    def login(self, email):
        response = self.client.post(
            '/api/v1/auth/token/',
            {'email': email, 'password': 'pass12345'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )

    def test_tree_requires_authentication(self):
        response = self.client.get('/api/v1/organigramme/tree/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_caq_can_create_root(self):
        self.login('caq@esi.dz')
        response = self.client.post(
            '/api/v1/organigramme/units/',
            {
                'name': 'Direction Generale',
                'type': 'ROOT',
                'parentId': None,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'ROOT-001')
        self.assertEqual(OrganizationUnit.objects.count(), 1)

    def test_pilote_cannot_create_unit(self):
        self.login('pilote@esi.dz')
        response = self.client.post(
            '/api/v1/organigramme/units/',
            {
                'name': 'Direction Generale',
                'type': 'ROOT',
                'parentId': None,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_tree_returns_nested_units(self):
        self.login('caq@esi.dz')
        root = OrganizationUnit.objects.create(
            code='ROOT-001',
            name='Direction Generale',
            type=OrganizationUnit.UnitType.ROOT,
            level=1,
        )
        OrganizationUnit.objects.create(
            code='DIR-001',
            name='Cellule Qualite',
            type=OrganizationUnit.UnitType.DIRECTION,
            parent=root,
            level=2,
        )

        response = self.client.get('/api/v1/organigramme/tree/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['children'][0]['code'], 'DIR-001')


class ResponsableAssignmentTests(TestCase):
    def setUp(self):
        _, self.previous = make_user('previous@esi.dz', 'pass12345', 'Pilote')
        _, self.current = make_user('current@esi.dz', 'pass12345', 'Pilote')
        self.unit = OrganizationUnit.objects.create(
            code='DEPT-001',
            name='Qualite',
            type=OrganizationUnit.UnitType.DEPARTMENT,
            level=2,
            responsable_id=self.current.id_user,
        )

    def test_selected_responsable_is_assigned_to_unit_department(self):
        sync_unit_responsable_assignment(self.unit)

        self.current.refresh_from_db()
        self.assertEqual(self.current.id_departement, self.unit.id)

    def test_replacing_responsable_clears_previous_unit_assignment(self):
        self.previous.id_departement = self.unit.id
        self.previous.save(update_fields=['id_departement'])

        sync_unit_responsable_assignment(
            self.unit,
            previous_responsable_id=self.previous.id_user,
        )

        self.previous.refresh_from_db()
        self.current.refresh_from_db()
        self.assertIsNone(self.previous.id_departement)
        self.assertEqual(self.current.id_departement, self.unit.id)
