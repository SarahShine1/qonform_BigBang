function scoreColor(score) {
  if (score >= 80) return "#6B21D9";
  if (score >= 60) return "#1D9E75";
  if (score >= 33) return "#F4B740";
  return "#E24B4A";
}

export default function ArticleScoreSummary({ article, score }) {
  return (
    <div className="grid grid-cols-[78px_1fr_36px] items-center gap-2">
      <div className="text-[11px] font-semibold text-slate-700">{article.label}</div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F3ECFF]">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${score}%`, backgroundColor: scoreColor(score) }}
        />
      </div>
      <div className="text-right text-[11px] font-semibold" style={{ color: scoreColor(score) }}>
        {score}%
      </div>
    </div>
  );
}
