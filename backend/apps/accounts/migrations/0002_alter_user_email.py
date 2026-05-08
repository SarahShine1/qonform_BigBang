"""
Migration: make User.email unique and required.

When USERNAME_FIELD = 'email', Django's authentication backend uses email
as the login identifier.  The field must therefore be unique (no two users
share the same email) and non-blank.

The Utilisateur, Role, and UserRole models are unmanaged (managed = False)
so no migration operations are generated for them — their tables already
exist on Supabase.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(
                max_length=254,
                unique=True,
                verbose_name='email address',
            ),
        ),
    ]
