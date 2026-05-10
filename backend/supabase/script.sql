-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accounts_user (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  password character varying NOT NULL,
  last_login timestamp with time zone,
  is_superuser boolean NOT NULL,
  username character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  is_staff boolean NOT NULL,
  is_active boolean NOT NULL,
  date_joined timestamp with time zone NOT NULL,
  CONSTRAINT accounts_user_pkey PRIMARY KEY (id)
);
CREATE TABLE public.accounts_user_groups (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id bigint NOT NULL,
  group_id integer NOT NULL,
  CONSTRAINT accounts_user_groups_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_user_groups_user_id_52b62117_fk_accounts_user_id FOREIGN KEY (user_id) REFERENCES public.accounts_user(id),
  CONSTRAINT accounts_user_groups_group_id_bd11a704_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id)
);
CREATE TABLE public.accounts_user_user_permissions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id bigint NOT NULL,
  permission_id integer NOT NULL,
  CONSTRAINT accounts_user_user_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_user_user_p_user_id_e4f0a161_fk_accounts_ FOREIGN KEY (user_id) REFERENCES public.accounts_user(id),
  CONSTRAINT accounts_user_user_p_permission_id_113bb443_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id)
);
CREATE TABLE public.action_corrective (
  id_action integer NOT NULL DEFAULT nextval('action_corrective_id_action_seq'::regclass),
  id_nc integer,
  id_responsable integer,
  description text NOT NULL,
  statut character varying NOT NULL DEFAULT 'Planifiee'::character varying CHECK (statut::text = ANY (ARRAY['Planifiee'::character varying, 'En_cours'::character varying, 'Realisee'::character varying, 'Verifiee'::character varying]::text[])),
  date_echeance date,
  CONSTRAINT action_corrective_pkey PRIMARY KEY (id_action),
  CONSTRAINT action_corrective_id_responsable_fkey FOREIGN KEY (id_responsable) REFERENCES public.utilisateur(id_user),
  CONSTRAINT action_corrective_id_nc_fkey FOREIGN KEY (id_nc) REFERENCES public.nc(id_nc)
);
CREATE TABLE public.article (
  id_article integer NOT NULL DEFAULT nextval('article_id_article_seq'::regclass),
  id_norme integer NOT NULL,
  code_article character varying NOT NULL,
  titre character varying NOT NULL,
  ponderation numeric DEFAULT 1.0,
  CONSTRAINT article_pkey PRIMARY KEY (id_article),
  CONSTRAINT article_id_norme_fkey FOREIGN KEY (id_norme) REFERENCES public.norme(id_norme)
);
CREATE TABLE public.audit_terrain (
  id_audit integer NOT NULL DEFAULT nextval('audit_terrain_id_audit_seq'::regclass),
  id_processus integer NOT NULL,
  id_auditeur integer NOT NULL,
  titre character varying NOT NULL,
  statut character varying NOT NULL DEFAULT 'Planifie'::character varying CHECK (statut::text = ANY (ARRAY['Planifie'::character varying, 'En_cours'::character varying, 'Cloture'::character varying]::text[])),
  date_planifiee date,
  date_realisation date,
  rapport_pdf character varying,
  observations text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_terrain_pkey PRIMARY KEY (id_audit),
  CONSTRAINT audit_terrain_id_processus_fkey FOREIGN KEY (id_processus) REFERENCES public.processus(id_processus),
  CONSTRAINT audit_terrain_id_auditeur_fkey FOREIGN KEY (id_auditeur) REFERENCES public.utilisateur(id_user)
);
CREATE TABLE public.auth_group (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL UNIQUE,
  CONSTRAINT auth_group_pkey PRIMARY KEY (id)
);
CREATE TABLE public.auth_group_permissions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  group_id integer NOT NULL,
  permission_id integer NOT NULL,
  CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id),
  CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id)
);
CREATE TABLE public.auth_permission (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  content_type_id integer NOT NULL,
  codename character varying NOT NULL,
  CONSTRAINT auth_permission_pkey PRIMARY KEY (id),
  CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id)
);
CREATE TABLE public.champ_fiche (
  id_champ integer NOT NULL DEFAULT nextval('champ_fiche_id_champ_seq'::regclass),
  id_version integer NOT NULL,
  libelle character varying NOT NULL,
  type_champ character varying NOT NULL CHECK (type_champ::text = ANY (ARRAY['texte'::character varying, 'nombre'::character varying, 'date'::character varying, 'booleen'::character varying, 'liste'::character varying]::text[])),
  valeur text,
  est_obligatoire boolean DEFAULT false,
  ordre integer NOT NULL DEFAULT 1,
  id_champ_template integer,
  valeur_json jsonb,
  CONSTRAINT champ_fiche_pkey PRIMARY KEY (id_champ),
  CONSTRAINT champ_fiche_id_champ_template_fkey FOREIGN KEY (id_champ_template) REFERENCES public.champ_template(id_champ_template),
  CONSTRAINT champ_fiche_id_version_fkey FOREIGN KEY (id_version) REFERENCES public.version_fiche(id_version)
);
CREATE TABLE public.champ_template (
  id_champ_template integer NOT NULL DEFAULT nextval('champ_template_id_champ_template_seq'::regclass),
  id_section_template integer NOT NULL,
  libelle character varying NOT NULL,
  type_champ character varying NOT NULL CHECK (type_champ::text = ANY (ARRAY['text'::character varying, 'nombre'::character varying, 'date'::character varying, 'booleen'::character varying, 'checklist'::character varying, 'liste'::character varying, 'tableau'::character varying]::text[])),
  configuration jsonb DEFAULT '{}'::jsonb,
  est_obligatoire boolean DEFAULT false,
  placeholder character varying,
  aide text,
  ordre integer NOT NULL DEFAULT 1,
  est_actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT champ_template_pkey PRIMARY KEY (id_champ_template),
  CONSTRAINT champ_template_id_section_template_fkey FOREIGN KEY (id_section_template) REFERENCES public.section_template(id_section_template)
);
CREATE TABLE public.checklist_evaluation (
  id_evaluation integer NOT NULL DEFAULT nextval('checklist_evaluation_id_evaluation_seq'::regclass),
  id_version integer NOT NULL,
  id_auditeur integer NOT NULL,
  id_exigence integer NOT NULL,
  resultat character varying CHECK (resultat::text = ANY (ARRAY['Conforme'::character varying, 'Non_conforme'::character varying, 'Partiel'::character varying, 'NA'::character varying]::text[])),
  commentaire text,
  date_evaluation timestamp with time zone DEFAULT now(),
  CONSTRAINT checklist_evaluation_pkey PRIMARY KEY (id_evaluation),
  CONSTRAINT checklist_evaluation_id_version_fkey FOREIGN KEY (id_version) REFERENCES public.version_fiche(id_version),
  CONSTRAINT checklist_evaluation_id_auditeur_fkey FOREIGN KEY (id_auditeur) REFERENCES public.utilisateur(id_user),
  CONSTRAINT checklist_evaluation_id_exigence_fkey FOREIGN KEY (id_exigence) REFERENCES public.exigence(id_exigence)
);
CREATE TABLE public.colonne_template (
  id integer NOT NULL DEFAULT nextval('colonne_template_id_seq'::regclass),
  id_champ integer NOT NULL,
  cle character varying NOT NULL,
  libelle character varying NOT NULL,
  placeholder character varying,
  ordre integer NOT NULL DEFAULT 1,
  CONSTRAINT colonne_template_pkey PRIMARY KEY (id),
  CONSTRAINT colonne_template_id_champ_fkey FOREIGN KEY (id_champ) REFERENCES public.champ_template(id_champ_template)
);
CREATE TABLE public.departement (
  id_departement integer NOT NULL DEFAULT nextval('departement_id_departement_seq'::regclass),
  nom character varying NOT NULL,
  code character varying NOT NULL UNIQUE,
  id_parent integer,
  niveau_hierarchique integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT departement_pkey PRIMARY KEY (id_departement),
  CONSTRAINT departement_id_parent_fkey FOREIGN KEY (id_parent) REFERENCES public.departement(id_departement)
);
CREATE TABLE public.django_admin_log (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  action_time timestamp with time zone NOT NULL,
  object_id text,
  object_repr character varying NOT NULL,
  action_flag smallint NOT NULL CHECK (action_flag >= 0),
  change_message text NOT NULL,
  content_type_id integer,
  user_id bigint NOT NULL,
  CONSTRAINT django_admin_log_pkey PRIMARY KEY (id),
  CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id),
  CONSTRAINT django_admin_log_user_id_c564eba6_fk_accounts_user_id FOREIGN KEY (user_id) REFERENCES public.accounts_user(id)
);
CREATE TABLE public.django_content_type (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  app_label character varying NOT NULL,
  model character varying NOT NULL,
  CONSTRAINT django_content_type_pkey PRIMARY KEY (id)
);
CREATE TABLE public.django_migrations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  app character varying NOT NULL,
  name character varying NOT NULL,
  applied timestamp with time zone NOT NULL,
  CONSTRAINT django_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.django_session (
  session_key character varying NOT NULL,
  session_data text NOT NULL,
  expire_date timestamp with time zone NOT NULL,
  CONSTRAINT django_session_pkey PRIMARY KEY (session_key)
);
CREATE TABLE public.document (
  id_document integer NOT NULL DEFAULT nextval('document_id_document_seq'::regclass),
  id_version integer NOT NULL,
  id_uploader integer NOT NULL,
  nom_fichier character varying NOT NULL,
  type_document character varying NOT NULL CHECK (type_document::text = ANY (ARRAY['BPMN'::character varying, 'PDF'::character varying, 'Preuve'::character varying, 'Rapport'::character varying, 'Autre'::character varying]::text[])),
  chemin_stockage character varying NOT NULL,
  taille integer,
  version_doc character varying,
  date_upload timestamp with time zone DEFAULT now(),
  CONSTRAINT document_pkey PRIMARY KEY (id_document),
  CONSTRAINT document_id_version_fkey FOREIGN KEY (id_version) REFERENCES public.version_fiche(id_version),
  CONSTRAINT document_id_uploader_fkey FOREIGN KEY (id_uploader) REFERENCES public.utilisateur(id_user)
);
CREATE TABLE public.documents_document (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  titre character varying NOT NULL,
  fichier character varying NOT NULL,
  date_publication timestamp with time zone NOT NULL,
  publie_par_id bigint,
  CONSTRAINT documents_document_pkey PRIMARY KEY (id),
  CONSTRAINT documents_document_publie_par_id_dbbb9f91_fk_accounts_user_id FOREIGN KEY (publie_par_id) REFERENCES public.accounts_user(id)
);
CREATE TABLE public.exigence (
  id_exigence integer NOT NULL DEFAULT nextval('exigence_id_exigence_seq'::regclass),
  id_article integer NOT NULL,
  description text NOT NULL,
  ponderation numeric DEFAULT 1.0,
  est_obligatoire boolean DEFAULT true,
  CONSTRAINT exigence_pkey PRIMARY KEY (id_exigence),
  CONSTRAINT exigence_id_article_fkey FOREIGN KEY (id_article) REFERENCES public.article(id_article)
);
CREATE TABLE public.nc (
  id_nc integer NOT NULL DEFAULT nextval('nc_id_nc_seq'::regclass),
  id_version integer NOT NULL,
  id_auditeur integer NOT NULL,
  id_exigence integer,
  titre character varying NOT NULL,
  description text,
  date_detection timestamp with time zone DEFAULT now(),
  date_cloture timestamp with time zone,
  CONSTRAINT nc_pkey PRIMARY KEY (id_nc),
  CONSTRAINT nc_id_version_fkey FOREIGN KEY (id_version) REFERENCES public.version_fiche(id_version),
  CONSTRAINT nc_id_auditeur_fkey FOREIGN KEY (id_auditeur) REFERENCES public.utilisateur(id_user),
  CONSTRAINT nc_id_exigence_fkey FOREIGN KEY (id_exigence) REFERENCES public.exigence(id_exigence)
);
CREATE TABLE public.norme (
  id_norme integer NOT NULL DEFAULT nextval('norme_id_norme_seq'::regclass),
  code character varying NOT NULL UNIQUE,
  version character varying NOT NULL,
  titre character varying NOT NULL,
  date_publication date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT norme_pkey PRIMARY KEY (id_norme)
);
CREATE TABLE public.option_champ (
  id integer NOT NULL DEFAULT nextval('option_champ_id_seq'::regclass),
  id_champ integer NOT NULL,
  valeur character varying NOT NULL,
  libelle character varying NOT NULL,
  ordre integer NOT NULL DEFAULT 1,
  CONSTRAINT option_champ_pkey PRIMARY KEY (id),
  CONSTRAINT option_champ_id_champ_fkey FOREIGN KEY (id_champ) REFERENCES public.champ_template(id_champ_template)
);
CREATE TABLE public.organization_unit (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  type character varying NOT NULL,
  level smallint NOT NULL CHECK (level >= 0),
  description text NOT NULL,
  responsable_id integer,
  created_by_id integer,
  is_active boolean NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  parent_id bigint,
  CONSTRAINT organization_unit_pkey PRIMARY KEY (id),
  CONSTRAINT organization_unit_parent_id_ce577442_fk_organization_unit_id FOREIGN KEY (parent_id) REFERENCES public.organization_unit(id)
);
CREATE TABLE public.processus (
  id_processus integer NOT NULL DEFAULT nextval('processus_id_processus_seq'::regclass),
  code_process character varying NOT NULL UNIQUE,
  nom character varying NOT NULL,
  description text,
  type_process character varying NOT NULL CHECK (type_process::text = ANY (ARRAY['Management'::character varying, 'Realisation'::character varying, 'Support'::character varying]::text[])),
  id_departement integer NOT NULL,
  id_pilote integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT processus_pkey PRIMARY KEY (id_processus),
  CONSTRAINT processus_id_departement_fkey FOREIGN KEY (id_departement) REFERENCES public.departement(id_departement),
  CONSTRAINT processus_id_pilote_fkey FOREIGN KEY (id_pilote) REFERENCES public.utilisateur(id_user)
);
CREATE TABLE public.role (
  id_role integer NOT NULL DEFAULT nextval('role_id_role_seq'::regclass),
  libelle character varying NOT NULL UNIQUE,
  description text,
  CONSTRAINT role_pkey PRIMARY KEY (id_role)
);
CREATE TABLE public.section_template (
  id_section_template integer NOT NULL DEFAULT nextval('section_template_id_section_template_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  ordre integer NOT NULL DEFAULT 1,
  est_actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT section_template_pkey PRIMARY KEY (id_section_template)
);
CREATE TABLE public.statut_fiche (
  id_statut integer NOT NULL DEFAULT nextval('statut_fiche_id_statut_seq'::regclass),
  libelle character varying NOT NULL UNIQUE,
  ordre integer NOT NULL,
  couleur character varying,
  est_final boolean DEFAULT false,
  CONSTRAINT statut_fiche_pkey PRIMARY KEY (id_statut)
);
CREATE TABLE public.tache_planifiee (
  id_tache integer NOT NULL DEFAULT nextval('tache_planifiee_id_tache_seq'::regclass),
  intitule character varying NOT NULL,
  description text,
  type_tache character varying NOT NULL,
  id_responsable integer NOT NULL,
  id_createur integer NOT NULL,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  priorite character varying NOT NULL DEFAULT 'Moyenne'::character varying CHECK (priorite::text = ANY (ARRAY['Haute'::character varying, 'Moyenne'::character varying, 'Basse'::character varying]::text[])),
  statut character varying NOT NULL DEFAULT 'Planifiée'::character varying CHECK (statut::text = ANY (ARRAY['Planifiée'::character varying, 'En cours'::character varying, 'Terminée'::character varying, 'Annulée'::character varying]::text[])),
  observations text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tache_planifiee_pkey PRIMARY KEY (id_tache),
  CONSTRAINT tache_planifiee_id_responsable_fkey FOREIGN KEY (id_responsable) REFERENCES public.utilisateur(id_user),
  CONSTRAINT tache_planifiee_id_createur_fkey FOREIGN KEY (id_createur) REFERENCES public.utilisateur(id_user)
);
CREATE TABLE public.user_role (
  id_user integer NOT NULL,
  id_role integer NOT NULL,
  date_attribution date NOT NULL DEFAULT CURRENT_DATE,
  date_expiration date,
  id bigint NOT NULL DEFAULT nextval('user_role_id_seq'::regclass),
  CONSTRAINT user_role_pkey PRIMARY KEY (id_user, id_role),
  CONSTRAINT user_role_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.utilisateur(id_user),
  CONSTRAINT user_role_id_role_fkey FOREIGN KEY (id_role) REFERENCES public.role(id_role)
);
CREATE TABLE public.utilisateur (
  id_user integer NOT NULL DEFAULT nextval('utilisateur_id_user_seq'::regclass),
  auth_id bigint UNIQUE,
  nom character varying NOT NULL,
  prenom character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  est_actif boolean DEFAULT true,
  id_departement integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT utilisateur_pkey PRIMARY KEY (id_user),
  CONSTRAINT utilisateur_id_departement_fkey FOREIGN KEY (id_departement) REFERENCES public.departement(id_departement),
  CONSTRAINT utilisateur_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES public.accounts_user(id)
);
CREATE TABLE public.version_fiche (
  id_version integer NOT NULL DEFAULT nextval('version_fiche_id_version_seq'::regclass),
  id_processus integer NOT NULL,
  id_redacteur integer NOT NULL,
  numero_version character varying NOT NULL,
  commentaire_version text,
  date_creation timestamp with time zone DEFAULT now(),
  date_derniere_modif timestamp with time zone,
  date_validation timestamp with time zone,
  id_processus_amont integer,
  id_processus_aval integer,
  statut character varying NOT NULL DEFAULT 'Brouillon'::character varying CHECK (statut::text = ANY (ARRAY['Brouillon'::character varying, 'Soumise'::character varying, 'En_revision'::character varying, 'Publiee'::character varying, 'Archivee'::character varying]::text[])),
  CONSTRAINT version_fiche_pkey PRIMARY KEY (id_version),
  CONSTRAINT version_fiche_id_processus_aval_fkey FOREIGN KEY (id_processus_aval) REFERENCES public.processus(id_processus),
  CONSTRAINT version_fiche_id_processus_fkey FOREIGN KEY (id_processus) REFERENCES public.processus(id_processus),
  CONSTRAINT version_fiche_id_redacteur_fkey FOREIGN KEY (id_redacteur) REFERENCES public.utilisateur(id_user),
  CONSTRAINT version_fiche_id_processus_amont_fkey FOREIGN KEY (id_processus_amont) REFERENCES public.processus(id_processus)
);