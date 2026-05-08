import { ArrowRight, BookOpen, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { auditResources } from "../../data/accueilData";

export default function AuditResourcesCard() {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border border-[#E9E1F8] bg-white p-2.5 shadow-[0_10px_20px_rgba(48,16,103,0.07)]">
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F3ECFF] text-[#6B21D9]">
          <BookOpen className="h-3.5 w-3.5" />
        </div>
        <div>
          <h3 className="text-[12px] font-semibold text-slate-900">Ressources audit</h3>
          <span className="mt-0.5 block h-[2px] w-7 bg-[#F4B740]" />
        </div>
      </div>

      <div className="mt-1.5 flex-1 space-y-0 overflow-y-auto pr-1">
        {auditResources.map((resource) => (
          <div
            key={resource}
            className="flex items-center justify-between gap-3 border-b border-[#F1EBFB] px-0 py-1 text-[10.5px] text-slate-600 last:border-b-0"
          >
            <span className="min-w-0 flex-1 truncate leading-4">{resource}</span>
            <ChevronRight className="h-[11px] w-[11px] text-[#7C61C0]" />
          </div>
        ))}
      </div>

      <Link
        to="/documents"
        className="mt-1.5 inline-flex items-center gap-1.5 text-[9.5px] font-semibold text-[#58148E] transition hover:text-[#3B0A7A]"
      >
        Voir toutes les ressources
        <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}
