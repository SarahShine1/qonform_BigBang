import { ArrowRight, CircleCheck, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { todayTasks } from "../../data/accueilData";

export default function TodayTasksCard() {
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
        {todayTasks.map((task, index) => (
          <div
            key={task}
            className="flex items-center gap-2 border-b border-[#F1EBFB] px-0 py-1 text-[10.5px] text-slate-600 last:border-b-0"
          >
            <Square className="h-[11px] w-[11px] flex-shrink-0 text-[#8C86A1]" />
            <span className="min-w-0 flex-1 leading-4">{task}</span>
            <span className="text-[9.5px] text-slate-400">{["09:00", "11:00", "14:00", "16:00"][index]}</span>
          </div>
        ))}
      </div>

      <Link
        to="/actions"
        className="mt-1.5 inline-flex items-center gap-1.5 text-[9.5px] font-semibold text-[#58148E] transition hover:text-[#3B0A7A]"
      >
        Voir toutes les taches
        <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}
