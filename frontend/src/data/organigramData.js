// ─────────────────────────────────────────────────────────────────────────────
// Static data — swap for API calls when Django backend is ready:
//
//   const { data } = await axios.get('/api/organigram/tree/');
//   setOrgTree(data.tree);
//
//   const { data } = await axios.get('/api/organigram/employees/');
//   setEmployees(data.results);
// ─────────────────────────────────────────────────────────────────────────────

export const ORG_TREE = {
  id: 1,
  name: "Direction Générale",
  person: "M. Larbi KACI",
  badge: "DG",
  badgeColor: "purple",
  isRoot: true,
  children: [
    {
      id: 2,
      name: "Ressources Humaines",
      person: "Mme. Fatima AMARA",
      badge: "RH",
      badgeColor: "green",
      children: [],
    },
    {
      id: 3,
      name: "Cellule Qualité",
      person: "Ahmed BENALI",
      badge: "CQ",
      badgeColor: "yellow",
      isActive: true,   // yellow border — logged-in user's department
      children: [],
    },
    {
      id: 4,
      name: "Informatique",
      person: "M. Youcef SAIDI",
      badge: "IT",
      badgeColor: "blue",
      children: [],
    },
    {
      id: 5,
      name: "Finance",
      person: "Mme. Nadia BELKAD",
      badge: "FI",
      badgeColor: "pink",
      children: [],
    },
  ],
};

export const EMPLOYEES = [
  {
    id: 1,
    name: "Larbi KACI",
    email: "l.kaci@qonforme.dz",
    matricule: "EMP-001",
    poste: "Directeur Général",
    departement: "Direction Générale",
    departementColor: "purple",
    statut: "Actif",
  },
  {
    id: 2,
    name: "Fatima AMARA",
    email: "f.amara@qonforme.dz",
    matricule: "EMP-002",
    poste: "Responsable RH",
    departement: "Ressources Humaines",
    departementColor: "green",
    statut: "Actif",
  },
  {
    id: 3,
    name: "Ahmed BENALI",
    email: "a.benali@qonforme.dz",
    matricule: "EMP-003",
    poste: "Chef Cellule Qualité",
    departement: "Cellule Qualité",
    departementColor: "yellow",
    statut: "Actif",
  },
  {
    id: 4,
    name: "Youcef SAIDI",
    email: "y.saidi@qonforme.dz",
    matricule: "EMP-004",
    poste: "Responsable IT",
    departement: "Informatique",
    departementColor: "blue",
    statut: "Actif",
  },
  {
    id: 5,
    name: "Nadia BELKAD",
    email: "n.belkad@qonforme.dz",
    matricule: "EMP-005",
    poste: "Directrice Financière",
    departement: "Finance",
    departementColor: "pink",
    statut: "Inactif",
  },
];