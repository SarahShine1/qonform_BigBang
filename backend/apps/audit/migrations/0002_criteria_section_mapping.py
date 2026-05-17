from django.db import migrations


SEED_AUDIT_CRITERIA_SQL = """
ALTER TABLE public.critere_evaluation
ADD COLUMN IF NOT EXISTS id_section_template integer;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'critere_evaluation'
          AND constraint_name = 'critere_evaluation_id_section_template_fkey'
    ) THEN
        ALTER TABLE public.critere_evaluation
        ADD CONSTRAINT critere_evaluation_id_section_template_fkey
        FOREIGN KEY (id_section_template)
        REFERENCES public.section_template(id_section_template);
    END IF;
END $$;

WITH criteria(section_key, nom) AS (
    VALUES
        ('contexte', 'Contexte cohérent avec les enjeux ESI — §4.1'),
        ('leadership', 'Responsabilités du pilote claires — §5.3'),
        ('planification', 'Risques : criticité P×I correcte + plan traitement — §6.1'),
        ('ressources', 'Compétences RH définies et mappées — §7.2'),
        ('amelioration', 'Dysfonctionnements avec action corrective — §10.2')
),
matched_sections AS (
    SELECT
        c.nom AS critere_nom,
        st.id_section_template,
        ROW_NUMBER() OVER (
            PARTITION BY c.nom
            ORDER BY
                CASE
                    WHEN c.section_key = 'contexte'
                         AND (st.nom ILIKE '%Contexte et processus%' OR st.nom ILIKE '%Contexte%')
                    THEN 1
                    WHEN c.section_key = 'leadership'
                         AND (st.nom ILIKE '%Leadership et responsabilités%' OR st.nom ILIKE '%Leadership%')
                    THEN 1
                    WHEN c.section_key = 'planification'
                         AND st.nom ILIKE '%Planification%'
                    THEN 1
                    WHEN c.section_key = 'ressources'
                         AND (
                            st.nom ILIKE '%Ressources et compétences%'
                            OR st.nom ILIKE '%Ressources%'
                            OR st.nom ILIKE '%Support%'
                         )
                    THEN 1
                    WHEN c.section_key = 'amelioration'
                         AND (
                            st.nom ILIKE '%Amélioration%'
                            OR st.nom ILIKE '%Amelioration%'
                            OR st.nom ILIKE '%Dysfonction%'
                         )
                    THEN 1
                    ELSE 99
                END,
                st.ordre,
                st.id_section_template
        ) AS rank
    FROM criteria c
    JOIN public.section_template st
      ON st.est_actif = TRUE
     AND (
        (c.section_key = 'contexte' AND st.nom ILIKE '%Contexte%')
        OR (c.section_key = 'leadership' AND st.nom ILIKE '%Leadership%')
        OR (c.section_key = 'planification' AND st.nom ILIKE '%Planification%')
        OR (
            c.section_key = 'ressources'
            AND (st.nom ILIKE '%Ressources%' OR st.nom ILIKE '%Support%')
        )
        OR (
            c.section_key = 'amelioration'
            AND (st.nom ILIKE '%Amélioration%' OR st.nom ILIKE '%Amelioration%' OR st.nom ILIKE '%Dysfonction%')
        )
     )
),
selected_sections AS (
    SELECT critere_nom, id_section_template
    FROM matched_sections
    WHERE rank = 1
),
updated AS (
    UPDATE public.critere_evaluation ce
    SET
        id_section_template = ss.id_section_template,
        est_actif = TRUE
    FROM selected_sections ss
    WHERE ce.nom = ss.critere_nom
    RETURNING ce.nom
)
INSERT INTO public.critere_evaluation (nom, est_actif, id_section_template)
SELECT ss.critere_nom, TRUE, ss.id_section_template
FROM selected_sections ss
WHERE NOT EXISTS (
    SELECT 1
    FROM public.critere_evaluation ce
    WHERE ce.nom = ss.critere_nom
);
"""


class Migration(migrations.Migration):
    dependencies = [
        ("audit", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(SEED_AUDIT_CRITERIA_SQL, reverse_sql=migrations.RunSQL.noop),
    ]
