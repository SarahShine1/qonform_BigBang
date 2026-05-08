function scoreColor(score) {
  if (score >= 80) return "#6B21D9";
  if (score >= 60) return "#1D9E75";
  if (score >= 33) return "#F4B740";
  return "#E24B4A";
}

export default function GlobalMaturityScore({ score, interpretation }) {
  return (
    <section className="rounded-[14px] border border-[#E9E1F8] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF9FF_100%)] p-4 shadow-[0_10px_22px_rgba(45,11,104,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Score global pondere
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <div className="text-[30px] font-semibold leading-none" style={{ color: scoreColor(score) }}>
            {score}%
          </div>
          <p className="mt-1 text-[12px] text-slate-500">{interpretation}</p>
        </div>
        <div className="h-14 w-14 rounded-full border-[6px] border-[#F3ECFF] bg-white" />
      </div>
    </section>
  );
}
