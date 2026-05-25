import { AlertCircle, ArrowRight, CircleCheck, Loader2, Square } from "lucide-react";
import { Link } from "react-router-dom";

function formatTaskWindow(task) {
  if (!task?.dateDebut && !task?.dateFin) return "";

  const start = task.dateDebut
    ? new Date(task.dateDebut).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      })
    : "";
  const end = task.dateFin
    ? new Date(task.dateFin).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      })
    : "";

  if (start && end && start !== end) {
    return `${start} - ${end}`;
  }

  return end || start;
}

export default function TodayTasksCard({ tasks = [], loading = false, error = "" }) {
  return (
    <section className="flex h-full flex-col rounded-[12px] border border-[#E9E1F8] bg-white p-2.5 shadow-[0_10px_20px_rgba(48,16,103,0.07)]">
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F3ECFF] text-[#6B21D9]">
          <CircleCheck className="h-3.5 w-3.5" />
        </div>
        <div>
          <h3 className="text-[12px] font-semibold text-slate-900">A faire aujourd'hui</h3>
          <span className="mt-0.5 block h-[2px] w-7 bg-[#F4B740]" />
        </div>
      </div>

      <div className="mt-1.5 space-y-0">
        {loading ? (
          <div className="flex items-center gap-2 rounded-[10px] border border-dashed border-[#E9E1F8] px-2.5 py-3 text-[11px] text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Chargement des taches...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-2.5 py-3 text-[11px] text-rose-700">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[#E9E1F8] px-2.5 py-3 text-[11px] text-slate-500">
            Aucune tache planifiee a afficher.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id || task.intitule}
              className="flex items-center gap-2 border-b border-[#F1EBFB] px-0 py-1 text-[10.5px] text-slate-600 last:border-b-0"
            >
              <Square className="h-[11px] w-[11px] flex-shrink-0 text-[#8C86A1]" />
              <div className="min-w-0 flex-1">
                <p className="truncate leading-4 text-slate-700">{task.intitule}</p>
                <p className="truncate text-[9.5px] text-slate-400">
                  {task.responsableNom || task.priorite || "Planification"}
                </p>
              </div>
              <span className="text-[9.5px] text-slate-400">
                {formatTaskWindow(task)}
              </span>
            </div>
          ))
        )}
      </div>

      <Link
        to="/planification"
        className="mt-1.5 inline-flex items-center gap-1.5 text-[9.5px] font-semibold text-[#58148E] transition hover:text-[#3B0A7A]"
      >
        Voir toutes les taches
        <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}
