import { useEffect, useMemo, useState } from "react";
import { Download, Save } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import ArticleRequirementCard from "../../components/maturity/ArticleRequirementCard";
import MaturityRadarCard from "../../components/maturity/MaturityRadarCard";
import ArticleScoreSummary from "../../components/maturity/ArticleScoreSummary";
import ArticleTabs from "../../components/maturity/ArticleTabs";
import GlobalMaturityScore from "../../components/maturity/GlobalMaturityScore";
import MaturityLegend from "../../components/maturity/MaturityLegend";
import { getMyMaturityAssessment, saveMyMaturityAssessment } from "../../api/maturity.api";
import { useAuth } from "../../hooks/useAuth";

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

function formatSavedAt(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function apiErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) return "Impossible de charger le diagnostic.";
  if (typeof data.detail === "string") return data.detail;
  if (typeof data === "string") return data;

  return Object.values(data)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .join(" ");
}

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function MaturityPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const userName = `${user?.prenom || ""} ${user?.nom || ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] || "CAQ";
  const isExternalAuditor = (user?.roles || []).map(normalizeRole).includes("AUDITEUR EXTERNE");

  useEffect(() => {
    let active = true;

    async function loadAssessment() {
      setLoading(true);
      setError("");

      try {
        const payload = await getMyMaturityAssessment();
        if (!active) return;

        setArticles(payload.articles || []);
        setActiveId((payload.articles || [])[0]?.id || "");
        setSavedAt(formatSavedAt(payload.saved_at));
      } catch (loadError) {
        if (!active) return;
        setError(apiErrorMessage(loadError));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAssessment();
    return () => {
      active = false;
    };
  }, []);

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
  const radarData = useMemo(
    () =>
      articles.map((article) => ({
        article: article.label,
        score: articleScores[article.id] || 0,
        full: article.full,
      })),
    [articleScores, articles],
  );

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

  const saveDraft = async () => {
    if (isExternalAuditor) return;
    setSaving(true);
    setError("");

    try {
      const responses = articles.flatMap((article) =>
        article.exigences.map((requirement) => ({
          requirement_id: requirement.id,
          score: requirement.score,
          preuve: requirement.preuve,
        })),
      );

      const payload = await saveMyMaturityAssessment({ responses });
      setArticles(payload.articles || []);
      setSavedAt(formatSavedAt(payload.saved_at));
    } catch (saveError) {
      setError(apiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
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

        {error ? (
          <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-600">
            {error}
          </div>
        ) : null}

        {isExternalAuditor ? (
          <div className="rounded-[14px] border border-[#E9E1F8] bg-[#F8F5FF] px-4 py-3 text-[12px] text-slate-600">
            Mode consultation : le niveau de maturite est visible pour l'audit de certification, sans modification des scores ni des preuves.
          </div>
        ) : null}

        {loading ? (
          <section className="rounded-[16px] border border-[#E9E1F8] bg-white px-4 py-10 text-center text-[13px] text-slate-500 shadow-sm">
            Chargement du diagnostic de maturite...
          </section>
        ) : (
        <div className="maturity-main grid grid-cols-[minmax(0,1fr)_312px] gap-4">
          <section className="rounded-[16px] border border-[#E9E1F8] bg-white shadow-sm">
            <div className="shrink-0 border-b border-[#EEE7FA] px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <ArticleTabs
                    articles={articles}
                    activeId={activeArticle?.id || ""}
                    getArticleScore={(article) => articleScores[article.id]}
                    onChange={setActiveId}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={saving || isExternalAuditor}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-[#E9E1F8] bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isExternalAuditor ? "Lecture seule" : saving ? "Enregistrement..." : "Enregistrer le brouillon"}
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
                  <h2 className="text-[15px] font-semibold text-slate-900">{activeArticle?.full}</h2>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {activeArticle?.exigences?.length || 0} exigences - poids {activeArticle?.poids || 0}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-[24px] font-semibold leading-none ${scoreTone(articleScores[activeArticle?.id] || 0)}`}>
                    {articleScores[activeArticle?.id] || 0}%
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">Score article</p>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3ECFF]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#6B21D9_0%,#8B5CF6_100%)] transition-[width]"
                  style={{ width: `${articleScores[activeArticle?.id] || 0}%` }}
                />
              </div>

              {savedAt ? (
                <p className="mt-2 text-[11px] text-slate-400">Brouillon mis a jour a {savedAt}</p>
              ) : null}
            </div>

            <div className="requirements-panel px-4 py-3">
              <div className="space-y-3">
                {(activeArticle?.exigences || []).map((requirement) => (
                  <ArticleRequirementCard
                    key={requirement.ref}
                    requirement={requirement}
                    disabled={isExternalAuditor}
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

            <MaturityRadarCard data={radarData} />

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
        )}
      </div>
    </AppLayout>
  );
}
