"""
Custom Django test runner that creates tables for unmanaged models.

Unmanaged models (managed=False) are used in production to map to pre-existing
database tables (e.g. Supabase tables).  In the test database those tables do
not exist, so we temporarily flip managed=True before the test schema is
created, then restore the original value afterwards.

Usage in settings:
    TEST_RUNNER = 'config.test_runner.UnmanagedModelsTestRunner'
    UNMANAGED_MODELS_TO_CREATE = ['accounts.Utilisateur', 'accounts.Role', ...]
"""
from django.test.runner import DiscoverRunner
from django.conf import settings


class UnmanagedModelsTestRunner(DiscoverRunner):
    """
    A test runner that temporarily makes specified unmanaged models managed
    so that their tables are created in the test database.
    """

    def setup_databases(self, **kwargs):
        """
        Before creating the test database, flip managed=True on all models
        listed in settings.UNMANAGED_MODELS_TO_CREATE.
        """
        self._patched_models = []
        self._patch_models(managed=True)
        old_config = super().setup_databases(**kwargs)
        self._create_unmanaged_tables()
        return old_config

    def teardown_databases(self, old_config, **kwargs):
        """
        After the test run, restore managed=False on all patched models.
        """
        super().teardown_databases(old_config, **kwargs)
        self._patch_models(managed=False)

    def _patch_models(self, managed):
        """Set managed=<managed> on all models in UNMANAGED_MODELS_TO_CREATE."""
        from django.apps import apps

        model_labels = getattr(settings, 'UNMANAGED_MODELS_TO_CREATE', [])
        for label in model_labels:
            try:
                model = apps.get_model(label)
                model._meta.managed = managed
            except LookupError:
                pass

    def _create_unmanaged_tables(self):
        """Create unmanaged app tables that migrations intentionally skip."""
        from django.apps import apps
        from django.db import connection

        model_labels = getattr(settings, 'UNMANAGED_MODELS_TO_CREATE', [])
        with connection.schema_editor() as schema_editor:
            existing_tables = set(connection.introspection.table_names())
            for label in model_labels:
                try:
                    model = apps.get_model(label)
                except LookupError:
                    continue
                if model._meta.db_table in existing_tables:
                    continue
                schema_editor.create_model(model)
                existing_tables.add(model._meta.db_table)
