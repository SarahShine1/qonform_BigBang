import { useMemo, useState } from "react";
import { Download, Save } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import ArticleRequirementCard from "../../components/maturity/ArticleRequirementCard";
import ArticleScoreSummary from "../../components/maturity/ArticleScoreSummary";
import ArticleTabs from "../../components/maturity/ArticleTabs";
import GlobalMaturityScore from "../../components/maturity/GlobalMaturityScore";
import MaturityLegend from "../../components/maturity/MaturityLegend";
import { maturityArticles } from "../../data/maturityData";
import { useAuth } from "../../hooks/useAuth";

function cloneArticles() {
  return maturityArticles.map((article) => ({
    ...article,
    exigences: article.exigences.map((requirement) => ({ ...requirement })),
  }));
}

function articleScore(article) {
  if (!article.exigences.length) return 0;
  const total = article.exigences.reduce((sum, requirement) => sum + requirement.score, 0);
  return Math.round(total / article.exigences.length);
}

function globalWeightedScore(articles) {
  const totalWeight = articles.reduce((sum, article) => sum + article.poids, 0);
  const weighted = articles.reduce((sum, article) => sum + articleScore(article) * article.poids, 0);
  return totalWeight ? Math.round(weighted / totalWeight) : 0;
}

function interpretationLabel(score) {
  if (score >= 80) return "Optimise";
  if (score >= 60) return "Maitrise";
  if (score >= 33) return "En progression";
  return "Initial";
}

function scoreTone(score) {
  if (score >= 80) return "text-[#6B21D9]";
  if (score >= 60) return "text-[#1D9E75]";
  if (score >= 33) return "text-[#C48310]";
  return "text-[#E24B4A]";
}

export default function MaturityPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState(() => cloneArticles());
  const [activeId, setActiveId] = useState(articles[0]?.id || "a4");
  const [savedAt, setSavedAt] = useState("");

  const userName = `${user?.prenom || ""} ${user?.nom || ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] || "CAQ";

  const activeArticle = useMemo(
    () => articles.find((article) => article.id === activeId) || articles[0],
    [articles, activeId],
  );

  const articleScores = useMemo(() => {
    const entries = {};
    articles.forEach((article) => {
      entries[article.id] = articleScore(article);
    });
    return entries;
  }, [articles]);

  const globalScore = useMemo(() => globalWeightedScore(articles), [articles]);
  const interpretation = interpretationLabel(globalScore);

  const updateRequirement = (articleId, ref, patch) => {
    setArticles((current) =>
      current.map((article) =>
        article.id !== articleId
          ? article
          : {
              ...article,
              exigences: article.exigences.map((requirement) =>
                requirement.ref === ref ? { ...requirement, ...patch } : requirement,
              ),
            },
      ),
    );
  };

  const saveDraft = () => {
    const timestamp = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date());
    setSavedAt(timestamp);
  };

  return (
    <AppLayout pageTitle="Niveau de maturite" userName={userName} userRole={userRole}>
      <div className="maturity-page space-y-3">
        <header className="rounded-[16px] border border-[#E9E1F8] bg-white px-4 py-3 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex rounded-full border border-[#E9E1F8] bg-[#F3ECFF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B21D9]">
                Diagnostic ISO 9001
              </div>
              <h1 className="m-0 text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                Niveau de maturite
              </h1>
              <p className="mt-1 max-w-3xl text-[13px] text-slate-500">
                Evaluez la maturite ISO 9001:2015 par article et suivez le score global.
              </p>
            </div>

            <div className="min-w-[180px] rounded-[14px] border border-[#E9E1F8] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF9FF_100%)] px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Score global
              </p>
              <div className={`mt-1 text-[28px] font-semibold leading-none ${scoreTone(globalScore)}`}>
                {globalScore}%
              </div>
              <p className="mt-1 text-[12px] text-slate-500">{interpretation}</p>
            </div>
          </div>
        </header>

        <div className="maturity-main grid grid-cols-[minmax(0,1fr)_312px] gap-4">
          <section className="rounded-[16px] border border-[#E9E1F8] bg-white shadow-sm">
            <div className="shrink-0 border-b border-[#EEE7FA] px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <ArticleTabs
                    articles={articles}
                    activeId={activeArticle.id}
                    getArticleScore={(article) => articleScores[article.id]}
                    onChange={setActiveId}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-[#E9E1F8] bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Enregistrer le brouillon
                  </button>
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-[#E5E7EB] bg-slate-100 px-3 text-[11px] font-semibold text-slate-400"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exporter
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">{activeArticle.full}</h2>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {activeArticle.exigences.length} exigences - poids {activeArticle.poids}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-[24px] font-semibold leading-none ${scoreTone(articleScores[activeArticle.id])}`}>
                    {articleScores[activeArticle.id]}%
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">Score article</p>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3ECFF]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#6B21D9_0%,#8B5CF6_100%)] transition-[width]"
                  style={{ width: `${articleScores[activeArticle.id]}%` }}
                />
              </div>

              {savedAt ? (
                <p className="mt-2 text-[11px] text-slate-400">Brouillon mis a jour a {savedAt}</p>
              ) : null}
            </div>

            <div className="requirements-panel px-4 py-3">
              <div className="space-y-3">
                {activeArticle.exigences.map((requirement) => (
                  <ArticleRequirementCard
                    key={requirement.ref}
                    requirement={requirement}
                    onScoreChange={(score) =>
                      updateRequirement(activeArticle.id, requirement.ref, { score })
                    }
                    onEvidenceChange={(preuve) =>
                      updateRequirement(activeArticle.id, requirement.ref, { preuve })
                    }
                  />
                ))}
              </div>
            </div>
          </section>

          <aside className="summary-panel space-y-3">
            <GlobalMaturityScore score={globalScore} interpretation={interpretation} />

            <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Scores par article
              </p>
              <div className="mt-3 space-y-2.5">
                {articles.map((article) => (
                  <ArticleScoreSummary
                    key={article.id}
                    article={article}
                    score={articleScores[article.id]}
                  />
                ))}
              </div>
            </section>

            <MaturityLegend />

            <section className="rounded-[14px] border border-[#E5E7EB] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Interpretation
              </p>
              <div className="mt-3 space-y-2 text-[12px] text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">0-32%</span> : Initial
                </p>
                <p>
                  <span className="font-semibold text-slate-800">33-59%</span> : En progression
                </p>
                <p>
                  <span className="font-semibold text-slate-800">60-79%</span> : Maitrise
                </p>
                <p>
                  <span className="font-semibold text-slate-800">80-100%</span> : Optimise
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
