export const auditExecutionMock = {
  audit: {
    id: "AUD-2026-001",
    code: "AUD-2026-001",
    processCode: "SUP-IT-003",
    processName: "Support IT",
    auditor: "Ahmed Benali",
    date: "2026-05-13",
    status: "En cours",
  },
  sections: [
    {
      id: "general",
      title: "Informations générales",
      shortTitle: "Général",
      processFields: [
        { label: "Pilote du processus", value: "Responsable IT Infrastructure" },
        { label: "Désignation du processus", value: "Support informatique et assistance utilisateurs" },
        { label: "Objectif du processus", value: "Garantir la disponibilité du SI et la résolution rapide des incidents." },
        { label: "Structures concernées", value: "Direction SI, départements pédagogiques, scolarité" },
        { label: "Type de processus", value: "Support" },
      ],
      requirements: [
        {
          id: "REQ-GEN-01",
          label: "Le processus est identifié, nommé et rattaché à un pilote.",
          clause: "§4.4.1",
          type: "auto",
          autoStatus: "conforme",
        },
        {
          id: "REQ-GEN-02",
          label: "Les responsabilités du pilote sont claires et cohérentes.",
          clause: "§5.3",
          type: "manual",
        },
      ],
    },
    {
      id: "key-elements",
      title: "Éléments clés du processus",
      shortTitle: "Éléments clés",
      processFields: [
        { label: "Début global", value: "Demande ou incident reçu." },
        { label: "Cycle suivi", value: "Analyse, qualification, traitement, clôture." },
        { label: "Entrées", value: "Demandes utilisateurs, besoins de maintenance, incidents déclarés." },
        { label: "Sorties", value: "Tickets clôturés, rapport de performance mensuel, incidents résolus." },
        { label: "Clients", value: "Étudiants, enseignants, personnel administratif." },
        { label: "KPI", value: "Disponibilité système, délai moyen de résolution, taux de tickets réouverts." },
      ],
      requirements: [
        {
          id: "REQ-KEY-01",
          label: "Les entrées et sorties du processus sont définies et traçables.",
          clause: "§4.4.1",
          type: "auto",
          autoStatus: "conforme",
        },
        {
          id: "REQ-KEY-02",
          label: "Les KPI disposent d'une cible et d'une fréquence de mesure.",
          clause: "§9.1.1",
          type: "auto",
          autoStatus: "partiel",
        },
      ],
    },
    {
      id: "context",
      title: "Contexte et environnement",
      shortTitle: "Contexte",
      processFields: [
        { label: "Processus voisins", value: "Gestion documentaire, pilotage qualité, maintenance." },
        { label: "Enjeux", value: "Continuité de service, disponibilité des outils numériques." },
        { label: "Moyens alloués", value: "Outils ticketing, serveurs, ressources réseau." },
        { label: "Contraintes", value: "Disponibilité des ressources, urgence des incidents critiques." },
        { label: "Risques", value: "Indisponibilité SI, perte de données, retard de traitement." },
      ],
      requirements: [
        {
          id: "REQ-CTX-01",
          label: "Le contexte est cohérent avec les enjeux internes et externes de l'ESI.",
          clause: "§4.1",
          type: "manual",
        },
        {
          id: "REQ-CTX-02",
          label: "Les risques sont identifiés avec une logique de traitement.",
          clause: "§6.1",
          type: "manual",
        },
      ],
    },
    {
      id: "documents",
      title: "Informations documentées",
      shortTitle: "Documents",
      processFields: [
        { label: "Document de référence", value: "Procédure de gestion des incidents IT." },
        { label: "Identification et description", value: "SUP-IT-PROC-01, version 4.2." },
        { label: "Format et support", value: "PDF validé, stockage documentaire interne." },
        { label: "Revue et approbation", value: "Validé par la Cellule Assurance Qualité." },
        { label: "Enregistrement", value: "Historique des tickets et rapports mensuels." },
      ],
      requirements: [
        {
          id: "REQ-DOC-01",
          label: "Les informations documentées nécessaires sont disponibles et maîtrisées.",
          clause: "§7.5.1",
          type: "auto",
          autoStatus: "conforme",
        },
        {
          id: "REQ-DOC-02",
          label: "Les documents utilisés sont à jour et approuvés.",
          clause: "§7.5.3",
          type: "manual",
        },
      ],
    },
    {
      id: "issues",
      title: "Dysfonctionnements majeurs connus",
      shortTitle: "Dysfonctionnements",
      processFields: [
        { label: "Description", value: "Ruptures de traçabilité sur certains tickets escaladés." },
        { label: "Conséquences", value: "Perte d'historique, difficulté de justification lors des revues." },
        { label: "Causes", value: "Saisie incomplète lors du changement de niveau de support." },
        { label: "Améliorations", value: "Rappel de procédure et contrôle mensuel des tickets critiques." },
      ],
      requirements: [
        {
          id: "REQ-ISS-01",
          label: "Les dysfonctionnements sont analysés et reliés à des actions correctives.",
          clause: "§10.2",
          type: "manual",
        },
      ],
    },
    {
      id: "flow",
      title: "Déroulement et modélisation",
      shortTitle: "Déroulement",
      processFields: [
        { label: "Étape 1", value: "Détection et enregistrement du ticket." },
        { label: "Étape 2", value: "Qualification et priorisation selon la matrice d'impact." },
        { label: "Étape 3", value: "Traitement, validation utilisateur et clôture." },
        { label: "Cartographie BPMN", value: "Diagramme BPMN joint à la fiche publiée." },
      ],
      requirements: [
        {
          id: "REQ-FLOW-01",
          label: "Le déroulement est modélisé et compréhensible par les acteurs concernés.",
          clause: "§4.4.1",
          type: "auto",
          autoStatus: "conforme",
        },
        {
          id: "REQ-FLOW-02",
          label: "La méthode de priorisation est appliquée de façon homogène.",
          clause: "§8.5.1",
          type: "manual",
        },
      ],
    },
    {
      id: "attachments",
      title: "Autres documents",
      shortTitle: "Autres docs",
      processFields: [
        { label: "Pièces jointes", value: "Rapport de performance mensuel, export tickets, diagramme BPMN." },
        { label: "Preuves disponibles", value: "Exemples de tickets clôturés et suivi d'incidents critiques." },
      ],
      requirements: [
        {
          id: "REQ-ATT-01",
          label: "Les preuves associées au processus sont disponibles pour l'audit.",
          clause: "§7.5.3",
          type: "manual",
        },
      ],
    },
    {
      id: "summary",
      title: "Synthèse / clôture",
      shortTitle: "Synthèse",
      processFields: [
        { label: "Objectif", value: "Consolider les constats, recommandations et actions correctives." },
        { label: "Sortie attendue", value: "Audit terminé, statut publié et rapport prêt à générer." },
      ],
      requirements: [],
    },
  ],
  initialEvaluations: {},
};

export const complianceStatuses = [
  { value: "conforme", label: "Conforme", score: 1 },
  { value: "partiel", label: "Partiellement conforme", score: 0.5 },
  { value: "non_conforme", label: "Non conforme", score: 0 },
  { value: "non_applicable", label: "Non applicable", score: null },
];

