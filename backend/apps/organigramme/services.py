from django.db import connection, transaction


@transaction.atomic
def sync_departements_from_organigramme():
    """
    Sync the departement table from organization_unit.

    organization_unit is the real source of truth.
    departement is used by Utilisateur.id_departement FK.

    This function:
    1. Inserts/updates all active organization units into departement.
    2. Keeps parent links only if the parent also exists and is active.
    3. Sets utilisateur.id_departement to NULL if the department no longer exists.
    4. Deletes obsolete departement rows that no longer exist in organization_unit.
    """

    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO departement (
                id_departement,
                nom,
                code,
                id_parent,
                niveau_hierarchique,
                created_at
            )
            SELECT
                ou.id::integer AS id_departement,
                ou.name AS nom,
                ou.code AS code,
                CASE
                    WHEN parent.id IS NULL THEN NULL
                    ELSE ou.parent_id::integer
                END AS id_parent,
                ou.level::integer AS niveau_hierarchique,
                COALESCE(ou.created_at, NOW()) AS created_at
            FROM organization_unit ou
            LEFT JOIN organization_unit parent
                ON parent.id = ou.parent_id
                AND parent.is_active = TRUE
            WHERE ou.is_active = TRUE
            ON CONFLICT (id_departement)
            DO UPDATE SET
                nom = EXCLUDED.nom,
                code = EXCLUDED.code,
                id_parent = EXCLUDED.id_parent,
                niveau_hierarchique = EXCLUDED.niveau_hierarchique;
            """
        )

        cursor.execute(
            """
            UPDATE utilisateur
            SET id_departement = NULL
            WHERE id_departement IS NOT NULL
            AND NOT EXISTS (
                SELECT 1
                FROM organization_unit ou
                WHERE ou.is_active = TRUE
                AND ou.id::integer = utilisateur.id_departement
            );
            """
        )

        cursor.execute(
            """
            DELETE FROM departement d
            WHERE NOT EXISTS (
                SELECT 1
                FROM organization_unit ou
                WHERE ou.is_active = TRUE
                AND ou.id::integer = d.id_departement
            );
            """
        )