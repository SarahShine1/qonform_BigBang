import ScoreSelector from "./ScoreSelector";

function scoreTone(score) {
  if (score >= 100) return "bg-[#F3ECFF] text-[#6B21D9]";
  if (score >= 66) return "bg-[#E7F7F1] text-[#1D9E75]";
  if (score >= 33) return "bg-[#FFF5DE] text-[#C48310]";
  return "bg-[#FCEAEA] text-[#E24B4A]";
}

export default function ArticleRequirementCard({
  requirement,
  onScoreChange,
  onEvidenceChange,
  disabled = false,
}) {
  return (
    <article className="rounded-[14px] border border-[#E5E7EB] bg-white px-3 py-3 shadow-[0_6px_18px_rgba(45,11,104,0.04)]">
      <div className="mb-2 flex items-start gap-3">
        <span className="rounded-full bg-[#F3ECFF] px-2 py-0.5 text-[10px] font-semibold text-[#6B21D9]">
          {requirement.ref}
        </span>
        <p className="min-w-0 flex-1 text-[12px] leading-5 text-slate-800">{requirement.text}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${scoreTone(requirement.score)}`}>
          {requirement.score}%
        </span>
      </div>

      <ScoreSelector value={requirement.score} onChange={onScoreChange} disabled={disabled} />

      <label className="mt-2.5 block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Preuve / observation
        </span>
        <textarea
          value={requirement.preuve}
          onChange={(event) => onEvidenceChange(event.target.value)}
          disabled={disabled}
          readOnly={disabled}
          rows={2}
          placeholder="Ex: PV, fiche, procedure, capture, lien documentaire..."
          className="w-full resize-none rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#C8B7F5] focus:ring-2 focus:ring-[#F3ECFF] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        />
      </label>
    </article>
  );
}
