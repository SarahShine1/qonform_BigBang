import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ClipboardCheck, FileText, Search } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { auditApi } from "../../api/audit.api";
import { useAuth } from "../../hooks/useAuth";

const columns = [
  {
    key: "soumise",
    title: "Fiches soumises",
    accent: "border-blue-400",
    dot: "bg-blue-500",
    empty: "Aucune fiche soumise.",
  },
  {
    key: "en_revision",
    title: "En revision",
    accent: "border-amber-400",
    dot: "bg-amber-500",
    empty: "Aucune fiche en revision.",
  },
  {
    key: "publiee_audit",
    title: "Fiches auditees",
    accent: "border-emerald-400",
    dot: "bg-emerald-500",
    empty: "Aucune fiche auditee.",
  },
];

export default function AuditFiches() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [data, setData] = useState({ soumise: [], en_revision: [], publiee_audit: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(location.state?.flash || null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("Tous les services");

  useEffect(() => {
    if (!location.state?.flash) return;
    setFlash(location.state.flash);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError("");

    auditApi
      .getFiches()
      .then((payload) => {
        if (!mounted) return;
        setData({
          soumise: payload.soumise || [],
          en_revision: payload.en_revision || [],
          publiee_audit: payload.publiee_audit || [],
        });
      })
      .catch((requestError) => {
        if (!mounted) return;
        setError(extractApiError(requestError, "Impossible de charger les fiches a auditer."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const userName = useMemo(() => {
    if (!user) return "";
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
  }, [user]);

  const departments = useMemo(() => {
    const names = Object.values(data)
      .flat()
      .map((fiche) => fiche.departement?.nom)
      .filter(Boolean);
    return ["Tous les services", ...Array.from(new Set(names))];
  }, [data]);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    return Object.fromEntries(
      Object.entries(data).map(([key, fiches]) => [
        key,
        fiches.filter((fiche) => {
          const process = fiche.processus || {};
          const matchesSearch =
            !query ||
            process.code_process?.toLowerCase().includes(query) ||
            process.nom?.toLowerCase().includes(query) ||
            fiche.numero_version?.toLowerCase().includes(query);
          const matchesDepartment =
            department === "Tous les services" || fiche.departement?.nom === department;
          return matchesSearch && matchesDepartment;
        }),
      ])
    );
  }, [data, department, search]);

  const totalCount = Object.values(data).flat().length;

  const openFiche = (fiche, columnKey) => {
    if (columnKey === "publiee_audit") {
      navigate(`/auditeur/fiches-auditees/${fiche.id_version}`);
      return;
    }
    navigate(`/auditeur/execution-audit/${fiche.id_version}`);
  };

  return (
    <AppLayout
      pageTitle="Audit des fiches processus"
      userName={userName}
      userRole="Auditeur"
      contentClassName="bg-gray-50 px-4 py-4 pb-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Module audit</p>
          <h1 className="mt-1 text-xl font-bold text-gray-950">Audit des fiches processus</h1>
        </div>
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          {totalCount} fiche{totalCount > 1 ? "s" : ""}
        </span>
      </div>

      {flash && (
        <div
          className={`mb-4 rounded-md border px-3 py-2 text-sm ${
            flash.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {flash.message}
        </div>
      )}

      <section className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <label className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un processus..."
            className="h-9 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </label>
        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="h-9 rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
        >
          {departments.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </section>

      {error && (
        <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {columns.map((column) => {
          const fiches = filteredData[column.key] || [];
          return (
            <div
              key={column.key}
              className={`min-h-[460px] rounded-lg border border-gray-200 border-t-4 ${column.accent} bg-white shadow-sm`}
            >
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                  <h2 className="text-[13px] font-bold text-gray-900">{column.title}</h2>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">
                  {fiches.length}
                </span>
              </div>

              <div className="max-h-[calc(100vh-260px)] space-y-2 overflow-y-auto p-2.5">
                {loading ? (
                  <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-xs text-slate-500">
                    Chargement...
                  </div>
                ) : fiches.length === 0 ? (
                  <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-xs text-slate-500">
                    {column.empty}
                  </div>
                ) : (
                  fiches.map((fiche) => (
                    <FicheCard
                      key={fiche.id_version}
                      fiche={fiche}
                      columnKey={column.key}
                      onClick={() => openFiche(fiche, column.key)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </section>
    </AppLayout>
  );
}

function FicheCard({ fiche, columnKey, onClick }) {
  const process = fiche.processus || {};
  const redacteur = fiche.redacteur
    ? `${fiche.redacteur.prenom || ""} ${fiche.redacteur.nom || ""}`.trim()
    : "";
  const auditeur = fiche.auditeur
    ? `${fiche.auditeur.prenom || ""} ${fiche.auditeur.nom || ""}`.trim()
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-md border border-gray-100 bg-[#F7F3FB] px-2.5 py-2.5 text-left transition hover:border-purple-200 hover:bg-white hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[11px] font-bold uppercase text-purple-700">
              {process.code_process || "Sans code"}
            </p>
            {columnKey === "soumise" && (
              <RevueBadge revue={fiche.revue} />
            )}
          </div>
          <h3 className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-4 text-gray-950">
            {process.nom || "Processus non renseigne"}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">
          {fiche.numero_version}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span>{redacteur || "Redacteur non renseigne"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          <span>{fiche.departement?.nom || "Service non renseigne"}</span>
        </div>
        {columnKey === "en_revision" && (
          <div className="rounded-md border border-amber-100 bg-white/70 px-2 py-1 text-[11px] font-semibold text-amber-800">
            Auditeur : {auditeur || "Non assigne"}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <StatusPill status={fiche.statut_audit} />
        {columnKey === "publiee_audit" && (
          <span className="text-[11px] font-bold text-purple-700">
            {fiche.rapport_pdf ? "Voir rapport" : "Synthese"}
          </span>
        )}
      </div>
    </button>
  );
}

function RevueBadge({ revue }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        revue
          ? "bg-amber-100 text-amber-800"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {revue ? "A reauditer" : "Nouvelle"}
    </span>
  );
}

function StatusPill({ status }) {
  const styles = {
    Soumise: "bg-blue-50 text-blue-700",
    "En revision": "bg-amber-50 text-amber-700",
    Publiee: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-bold ${
        styles[status] || "bg-gray-50 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function extractApiError(error, fallbackMessage) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  return fallbackMessage;
}
