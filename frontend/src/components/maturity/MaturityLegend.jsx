import { maturityScoreOptions } from "../../data/maturityData";

export default function MaturityLegend() {
  return (
    <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Legende
      </p>
      <div className="mt-3 space-y-2">
        {maturityScoreOptions.map((option) => (
          <div key={option.value} className="flex items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
              <span className="text-slate-700">{option.label}</span>
            </div>
            <span className="font-semibold text-slate-400">{option.value}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
