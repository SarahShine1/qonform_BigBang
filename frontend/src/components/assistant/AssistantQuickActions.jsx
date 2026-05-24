const QUICK_ACTIONS = [
  {
    label: "Trouver un responsable",
    value: "Qui est le responsable du departement ",
    mode: "prefill",
  },
  {
    label: "Expliquer un champ de fiche",
    value: "Comment remplir le champ ",
    mode: "prefill",
  },
  {
    label: "Chercher un terme qualite",
    value: "C'est quoi ",
    mode: "prefill",
  },
  {
    label: "Article ISO d'un champ",
    value: "Quel article ISO correspond au champ ",
    mode: "prefill",
  },
  {
    label: "Aide pour remplir une fiche",
    value: "Comment remplir les entrees d'une fiche ?",
    mode: "send",
  },
];

export default function AssistantQuickActions({ onAction }) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => onAction?.(action)}
          className="inline-flex items-center rounded-full border border-[#E9E1F8] bg-white px-3 py-1.5 text-[11px] font-medium text-[#58148E] transition hover:border-[#D8C0FA] hover:bg-[#F8F2FF]"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

