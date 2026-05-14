import { STATUT_STYLES, STATUT_LABELS } from "./constants";

export default function StatutBadge({ statut }) {
  const s = STATUT_STYLES[statut] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {STATUT_LABELS[statut] || statut}
    </span>
  );
}
