"""
Root conftest.py for the backend test suite.

The Utilisateur, Role, and UserRole models have managed=False because they
map to pre-existing Supabase tables.  In the test database (SQLite in-memory)
those tables do not exist.

pytest-django has its own database setup mechanism that bypasses Django's
TEST_RUNNER, so we override the django_db_setup fixture to create the
unmanaged tables manually using connection.schema_editor().
"""
import pytest


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    """
    Extend the default django_db_setup fixture to create tables for unmanaged
    models (Utilisateur, Role, UserRole) in the test database.

    This runs once per test session, after the standard Django test DB is
    created and migrations are applied.
    """
    from django.db import connection
    from apps.accounts.models import Departement, Utilisateur, Role, UserRole

    with django_db_blocker.unblock():
        with connection.schema_editor() as schema_editor:
            # Create tables for unmanaged models
            for model in (Departement, Role, Utilisateur, UserRole):
                try:
                    schema_editor.create_model(model)
                except Exception:
                    # Table might already exist (e.g. from a previous run)
                    pass
