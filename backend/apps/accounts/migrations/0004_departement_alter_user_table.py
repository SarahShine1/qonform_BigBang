

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_role_userrole_utilisateur_alter_user_options'),
    ]

    operations = [
        migrations.CreateModel(
            name='Departement',
            fields=[
                ('id_departement', models.AutoField(primary_key=True, serialize=False)),
                ('nom', models.CharField(max_length=150)),
            ],
            options={
                'db_table': 'departement',
                'managed': False,
            },
        ),
        migrations.AlterModelTable(
            name='user',
            table='accounts_user',
        ),
    ]
