export default function ArticleTabs({ articles, activeId, getArticleScore, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {articles.map((article) => {
        const score = getArticleScore(article);
        const isActive = article.id === activeId;

        return (
          <button
            key={article.id}
            type="button"
            onClick={() => onChange(article.id)}
            className={[
              "inline-flex items-center gap-1 rounded-[10px] border px-3 py-1.5 text-[12px] font-semibold transition",
              isActive
                ? "border-[#6B21D9] bg-[#6B21D9] text-white shadow-[0_8px_16px_rgba(107,33,217,0.18)]"
                : "border-[#E5E7EB] bg-white text-slate-600 hover:border-[#D6C5F9] hover:text-[#2D0B68]",
            ].join(" ")}
          >
            <span>{article.label}</span>
            <span className={isActive ? "text-white/80" : "text-slate-400"}>{score}%</span>
          </button>
        );
      })}
    </div>
  );
}
