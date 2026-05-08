-- =============================================
-- QONFORM — ISO 9001 | Supabase Schema
-- =============================================
-- Pour exécuter : Supabase Dashboard > SQL Editor > Coller et Run
-- =============================================


-- ── NORMES & EXIGENCES ──────────────────────

CREATE TABLE IF NOT EXISTS norme (
  id_norme   SERIAL PRIMARY KEY,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  version    VARCHAR(10)  NOT NULL,
  titre      VARCHAR(200) NOT NULL,
  date_publication DATE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article (
  id_article  SERIAL PRIMARY KEY,
  id_norme    INTEGER NOT NULL REFERENCES norme(id_norme) ON DELETE CASCADE,
  code_article VARCHAR(20)  NOT NULL,
  titre       VARCHAR(200) NOT NULL,
  ponderation DECIMAL(4,2) DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS exigence (
  id_exigence    SERIAL PRIMARY KEY,
  id_article     INTEGER NOT NULL REFERENCES article(id_article) ON DELETE CASCADE,
  description    TEXT    NOT NULL,
  ponderation    DECIMAL(4,2) DEFAULT 1.0,
  est_obligatoire BOOLEAN DEFAULT TRUE
);


-- ── ORGANISATION ────────────────────────────

CREATE TABLE IF NOT EXISTS departement (
  id_departement       SERIAL PRIMARY KEY,
  nom                  VARCHAR(150) NOT NULL,
  code                 VARCHAR(20)  NOT NULL UNIQUE,
  id_parent            INTEGER REFERENCES departement(id_departement),
  niveau_hierarchique  INTEGER NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);


-- ── UTILISATEURS & RÔLES ────────────────────
-- auth_id lie chaque ligne à l'utilisateur Supabase Auth (auth.users.id).
-- mot_de_passe est géré par Supabase Auth ; la colonne est conservée pour
-- compatibilité mais doit rester NULL en production.

CREATE TABLE IF NOT EXISTS utilisateur (
  id_user        SERIAL PRIMARY KEY,
  auth_id        UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nom            VARCHAR(100) NOT NULL,
  prenom         VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  est_actif      BOOLEAN DEFAULT TRUE,
  id_departement INTEGER REFERENCES departement(id_departement),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role (
  id_role     SERIAL PRIMARY KEY,
  libelle     VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_role (
  id_user          INTEGER NOT NULL REFERENCES utilisateur(id_user) ON DELETE CASCADE,
  id_role          INTEGER NOT NULL REFERENCES role(id_role)        ON DELETE CASCADE,
  date_attribution DATE    NOT NULL DEFAULT CURRENT_DATE,
  date_expiration  DATE,
  PRIMARY KEY (id_user, id_role)
);


-- ── PROCESSUS ───────────────────────────────

CREATE TABLE IF NOT EXISTS processus (
  id_processus  SERIAL PRIMARY KEY,
  code_process  VARCHAR(30)  NOT NULL UNIQUE,
  nom           VARCHAR(200) NOT NULL,
  description   TEXT,
  type_process  VARCHAR(20)  NOT NULL
    CHECK (type_process IN ('Management', 'Realisation', 'Support')),
  id_departement INTEGER NOT NULL REFERENCES departement(id_departement),
  id_pilote      INTEGER      REFERENCES utilisateur(id_user),
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);


-- ── STATUT FICHE (workflow) ──────────────────

CREATE TABLE IF NOT EXISTS statut_fiche (
  id_statut  SERIAL PRIMARY KEY,
  libelle    VARCHAR(50) NOT NULL UNIQUE,
  ordre      INTEGER     NOT NULL,
  couleur    VARCHAR(10),
  est_final  BOOLEAN DEFAULT FALSE
);

INSERT INTO statut_fiche (libelle, ordre, couleur, est_final) VALUES ('Brouillon',   1, '#9CA3AF', FALSE);
INSERT INTO statut_fiche (libelle, ordre, couleur, est_final) VALUES ('Soumis',      2, '#3B82F6', FALSE);
INSERT INTO statut_fiche (libelle, ordre, couleur, est_final) VALUES ('En_revision', 3, '#F59E0B', FALSE);
INSERT INTO statut_fiche (libelle, ordre, couleur, est_final) VALUES ('Valide',      4, '#10B981', TRUE);
INSERT INTO statut_fiche (libelle, ordre, couleur, est_final) VALUES ('Publie',      5, '#6366F1', TRUE);


-- ── VERSION FICHE ───────────────────────────

CREATE TABLE IF NOT EXISTS version_fiche (
  id_version           SERIAL PRIMARY KEY,
  id_processus         INTEGER NOT NULL REFERENCES processus(id_processus)   ON DELETE CASCADE,
  id_statut            INTEGER NOT NULL REFERENCES statut_fiche(id_statut)   DEFAULT 1,
  id_redacteur         INTEGER NOT NULL REFERENCES utilisateur(id_user),
  numero_version       VARCHAR(10) NOT NULL,
  commentaire_version  TEXT,
  date_creation        TIMESTAMPTZ DEFAULT NOW(),
  date_derniere_modif  TIMESTAMPTZ,
  date_validation      TIMESTAMPTZ
);


-- ── CHAMPS FICHE ────────────────────────────

CREATE TABLE IF NOT EXISTS champ_fiche (
  id_champ       SERIAL PRIMARY KEY,
  id_version     INTEGER NOT NULL REFERENCES version_fiche(id_version) ON DELETE CASCADE,
  libelle        VARCHAR(200) NOT NULL,
  type_champ     VARCHAR(20)  NOT NULL
    CHECK (type_champ IN ('texte', 'nombre', 'date', 'booleen', 'liste')),
  valeur         TEXT,
  est_obligatoire BOOLEAN DEFAULT FALSE,
  ordre          INTEGER NOT NULL DEFAULT 1
);


-- ── DOCUMENTS ───────────────────────────────

CREATE TABLE IF NOT EXISTS document (
  id_document     SERIAL PRIMARY KEY,
  id_version      INTEGER NOT NULL REFERENCES version_fiche(id_version) ON DELETE CASCADE,
  id_uploader     INTEGER NOT NULL REFERENCES utilisateur(id_user),
  nom_fichier     VARCHAR(255) NOT NULL,
  type_document   VARCHAR(30)  NOT NULL
    CHECK (type_document IN ('BPMN', 'PDF', 'Preuve', 'Rapport', 'Autre')),
  chemin_stockage VARCHAR(500) NOT NULL,
  taille          INTEGER,
  version_doc     VARCHAR(10),
  date_upload     TIMESTAMPTZ DEFAULT NOW()
);


-- ── CHECKLIST AUDIT ─────────────────────────

CREATE TABLE IF NOT EXISTS checklist_evaluation (
  id_evaluation  SERIAL PRIMARY KEY,
  id_version     INTEGER NOT NULL REFERENCES version_fiche(id_version)  ON DELETE CASCADE,
  id_auditeur    INTEGER NOT NULL REFERENCES utilisateur(id_user),
  id_exigence    INTEGER NOT NULL REFERENCES exigence(id_exigence),
  resultat       VARCHAR(20)
    CHECK (resultat IN ('Conforme', 'Non_conforme', 'Partiel', 'NA')),
  commentaire    TEXT,
  date_evaluation TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (id_version, id_exigence)
);


-- ── NON-CONFORMITÉS ─────────────────────────

CREATE TABLE IF NOT EXISTS nc (
  id_nc          SERIAL PRIMARY KEY,
  id_version     INTEGER NOT NULL REFERENCES version_fiche(id_version) ON DELETE CASCADE,
  id_auditeur    INTEGER NOT NULL REFERENCES utilisateur(id_user),
  id_exigence    INTEGER      REFERENCES exigence(id_exigence),
  titre          VARCHAR(200) NOT NULL,
  description    TEXT,
  gravite        VARCHAR(20)  NOT NULL
    CHECK (gravite IN ('Majeure', 'Mineure', 'Observation')),
  statut         VARCHAR(20)  NOT NULL DEFAULT 'Ouverte'
    CHECK (statut IN ('Ouverte', 'En_cours', 'Cloturee')),
  date_detection TIMESTAMPTZ DEFAULT NOW(),
  date_cloture   TIMESTAMPTZ
);


-- ── ACTIONS CORRECTIVES ─────────────────────

CREATE TABLE IF NOT EXISTS action_corrective (
  id_action          SERIAL PRIMARY KEY,
  id_nc              INTEGER NOT NULL REFERENCES nc(id_nc) ON DELETE CASCADE,
  id_responsable     INTEGER REFERENCES utilisateur(id_user),
  description        TEXT    NOT NULL,
  type_action        VARCHAR(20)
    CHECK (type_action IN ('Corrective', 'Preventive', 'Amelioration')),
  statut             VARCHAR(20) NOT NULL DEFAULT 'Planifiee'
    CHECK (statut IN ('Planifiee', 'En_cours', 'Realisee', 'Verifiee')),
  date_echeance      DATE,
  date_realisation   DATE,
  efficacite_verifiee BOOLEAN DEFAULT FALSE
);


-- ── AUDIT TERRAIN ───────────────────────────

CREATE TABLE IF NOT EXISTS audit_terrain (
  id_audit        SERIAL PRIMARY KEY,
  id_processus    INTEGER NOT NULL REFERENCES processus(id_processus),
  id_auditeur     INTEGER NOT NULL REFERENCES utilisateur(id_user),
  titre           VARCHAR(200) NOT NULL,
  statut          VARCHAR(20)  NOT NULL DEFAULT 'Planifie'
    CHECK (statut IN ('Planifie', 'En_cours', 'Cloture')),
  date_planifiee  DATE,
  date_realisation DATE,
  rapport_pdf     VARCHAR(500),
  observations    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================
-- INDEX DE PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_version_fiche_processus  ON version_fiche(id_processus);
CREATE INDEX IF NOT EXISTS idx_version_fiche_statut     ON version_fiche(id_statut);
CREATE INDEX IF NOT EXISTS idx_champ_fiche_version      ON champ_fiche(id_version);
CREATE INDEX IF NOT EXISTS idx_document_version         ON document(id_version);
CREATE INDEX IF NOT EXISTS idx_nc_version               ON nc(id_version);
CREATE INDEX IF NOT EXISTS idx_nc_statut                ON nc(statut);
CREATE INDEX IF NOT EXISTS idx_checklist_version        ON checklist_evaluation(id_version);
CREATE INDEX IF NOT EXISTS idx_processus_departement    ON processus(id_departement);
CREATE INDEX IF NOT EXISTS idx_user_departement         ON utilisateur(id_departement);
CREATE INDEX IF NOT EXISTS idx_utilisateur_auth_id      ON utilisateur(auth_id);
CREATE INDEX IF NOT EXISTS idx_exigence_article         ON exigence(id_article);
CREATE INDEX IF NOT EXISTS idx_article_norme            ON article(id_norme);


-- =============================================
-- ROW LEVEL SECURITY (Supabase RLS)
-- =============================================

ALTER TABLE utilisateur          ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_fiche        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE document             ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE processus            ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_corrective    ENABLE ROW LEVEL SECURITY;


-- Helper : retrouver l'id_user interne à partir du JWT courant
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER
LANGUAGE sql STABLE
AS $$
  SELECT id_user FROM utilisateur WHERE auth_id = auth.uid() AND est_actif = TRUE LIMIT 1;
$$;


-- ── Politiques utilisateur ───────────────────

-- Un utilisateur voit uniquement son propre profil
CREATE POLICY "utilisateur: voir son profil"
  ON utilisateur FOR SELECT
  USING (auth_id = auth.uid());

-- Lecture de sa propre ligne pour mise à jour
CREATE POLICY "utilisateur: modifier son profil"
  ON utilisateur FOR UPDATE
  USING (auth_id = auth.uid());


-- ── Politiques version_fiche ─────────────────

-- Tout utilisateur actif peut lire les fiches
CREATE POLICY "version_fiche: lecture utilisateurs actifs"
  ON version_fiche FOR SELECT
  USING (current_user_id() IS NOT NULL);

-- Seul le rédacteur peut créer/modifier une fiche en Brouillon
CREATE POLICY "version_fiche: écriture rédacteur"
  ON version_fiche FOR INSERT
  WITH CHECK (id_redacteur = current_user_id());

CREATE POLICY "version_fiche: modification rédacteur"
  ON version_fiche FOR UPDATE
  USING (
    id_redacteur = current_user_id()
    AND id_statut = (SELECT id_statut FROM statut_fiche WHERE libelle = 'Brouillon')
  );


-- ── Politiques nc ────────────────────────────

CREATE POLICY "nc: lecture utilisateurs actifs"
  ON nc FOR SELECT
  USING (current_user_id() IS NOT NULL);

CREATE POLICY "nc: création par auditeur"
  ON nc FOR INSERT
  WITH CHECK (id_auditeur = current_user_id());


-- ── Politiques document ──────────────────────

CREATE POLICY "document: lecture utilisateurs actifs"
  ON document FOR SELECT
  USING (current_user_id() IS NOT NULL);

CREATE POLICY "document: upload par uploader"
  ON document FOR INSERT
  WITH CHECK (id_uploader = current_user_id());


-- ── Politiques checklist_evaluation ─────────

CREATE POLICY "checklist: lecture utilisateurs actifs"
  ON checklist_evaluation FOR SELECT
  USING (current_user_id() IS NOT NULL);

CREATE POLICY "checklist: saisie par auditeur"
  ON checklist_evaluation FOR INSERT
  WITH CHECK (id_auditeur = current_user_id());

CREATE POLICY "checklist: modification par auditeur"
  ON checklist_evaluation FOR UPDATE
  USING (id_auditeur = current_user_id());


-- ── Politiques processus ─────────────────────

CREATE POLICY "processus: lecture utilisateurs actifs"
  ON processus FOR SELECT
  USING (current_user_id() IS NOT NULL);


-- ── Politiques action_corrective ────────────

CREATE POLICY "action_corrective: lecture utilisateurs actifs"
  ON action_corrective FOR SELECT
  USING (current_user_id() IS NOT NULL);

CREATE POLICY "action_corrective: modification par responsable"
  ON action_corrective FOR UPDATE
  USING (id_responsable = current_user_id());
