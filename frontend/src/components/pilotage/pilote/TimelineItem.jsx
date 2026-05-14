import { useNavigate } from "react-router-dom";
import StatutBadge from "./StatutBadge";
import { STATUT_STYLES } from "./constants";

export default function TimelineItem({ event }) {
  const navigate = useNavigate();
  const { bg, text } = STATUT_STYLES[event.statut] || { bg: "bg-gray-100", text: "text-gray-600" };
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <div
      className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
      onClick={() => navigate(`/gestion-processus/dossier/${event.id_processus}`)}
    >
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${bg}`}>
        <span className={`h-2 w-2 rounded-full ${text.replace("text-", "bg-")}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-gray-800">{event.processus}</p>
        <p className="text-[11px] text-slate-500">
          v{event.version} · <StatutBadge statut={event.statut} />
        </p>
        <p className="mt-0.5 text-[10.5px] text-slate-400">{dateStr}</p>
      </div>
    </div>
  );
}
