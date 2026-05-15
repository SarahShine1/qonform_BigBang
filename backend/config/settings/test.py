"""
Test settings — uses SQLite in-memory so tests never touch the Supabase DB.
Unmanaged models (Utilisateur, Role, UserRole) are temporarily made managed
so Django's test runner creates their tables in the test DB.
"""
from .base import *  # noqa: F401, F403

# Override the secret key and debug for tests
SECRET_KEY = 'test-secret-key-not-for-production'
DEBUG = True

# Use fast in-memory SQLite for tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Remove debug toolbar from test runs (it requires extra setup)
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'debug_toolbar']  # noqa: F405
MIDDLEWARE = [m for m in MIDDLEWARE if 'debug_toolbar' not in m]  # noqa: F405

# Faster password hashing in tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Use a custom test runner that creates tables for unmanaged models
TEST_RUNNER = 'config.test_runner.UnmanagedModelsTestRunner'

# List of model labels whose tables should be created in the test DB
# even though managed=False in production.
UNMANAGED_MODELS_TO_CREATE = [
    'accounts.Departement',
    'accounts.Utilisateur',
    'accounts.Role',
    'accounts.UserRole',
]
