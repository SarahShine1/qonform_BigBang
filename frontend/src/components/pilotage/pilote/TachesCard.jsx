import { CalendarClock, MoreVertical } from "lucide-react";

const PRIORITE_STYLES = {
  Haute:   { bg: "bg-red-50",    text: "text-red-600"    },
  Moyenne: { bg: "bg-amber-50",  text: "text-amber-600"  },
  Basse:   { bg: "bg-slate-100", text: "text-slate-500"  },
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff;
}

function DueBadge({ dateStr }) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  const label =
    days === 0 ? "Aujourd'hui" :
    days === 1 ? "Demain" :
    days < 0   ? `${Math.abs(days)}j de retard` :
                 `dans ${days}j`;
  const cls =
    days < 0  ? "text-red-500 font-bold" :
    days <= 3 ? "text-amber-500 font-semibold" :
                "text-slate-400";
  return <span className={`text-[10px] ${cls}`}>{label}</span>;
}

export default function TachesCard({ taches = [] }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-violet-700" />
          <h2 className="text-sm font-bold text-gray-950">Tâches à venir</h2>
        </div>
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </div>

      {taches.length === 0 ? (
        <div className="flex min-h-[100px] items-center justify-center text-xs text-slate-400">
          Aucune tâche planifiée
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {taches.map((t, i) => {
            const p = PRIORITE_STYLES[t.priorite] || PRIORITE_STYLES.Moyenne;
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold ${p.bg} ${p.text}`}>
                  {t.priorite}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-gray-800">{t.intitule}</p>
                  <DueBadge dateStr={t.date_fin} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
