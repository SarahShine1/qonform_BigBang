import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Network } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";
import { getProcessusList } from "../../api/processus.api";

const TYPE_COLORS = {
  Management:  { bg: "#EDE9FE", text: "#58148E" },
  Realisation: { bg: "#D1FAE5", text: "#065F46" },
  Support:     { bg: "#FEF3C7", text: "#92400E" },
};

function TypeBadge({ type }) {
  const style = TYPE_COLORS[type] ?? { bg: "#F3F4F6", text: "#374151" };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {type}
    </span>
  );
}

function ProcessusCard({ processus, onFiche }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDE9FE]">
          <Network size={18} className="text-[#58148E]" strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-800">{processus.nom}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">{processus.code_process}</span>
            <TypeBadge type={processus.type_process} />
            {processus.pilote_nom && (
              <span className="text-[11px] text-slate-400">
                Pilote&nbsp;: {processus.pilote_nom}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onFiche(processus.id_processus)}
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition"
        style={{ backgroundColor: "#58148E" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#45107A")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#58148E")}
      >
        <FileText size={13} strokeWidth={2} />
        Fiches de processus
      </button>
    </div>
  );
}

export default function ProcessusPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [processus, setProcessus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const userName = `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] ?? "";

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = user.departement != null ? { departement: user.departement } : {};
    getProcessusList(params)
      .then(setProcessus)
      .catch(() => setError("Impossible de charger les processus."))
      .finally(() => setLoading(false));
  }, [user]);

  const handleFiche = (id) => {
    navigate(`/gestion-processus/fiches/nouveau?processus=${id}`);
  };

  return (
    <AppLayout pageTitle="Processus" userName={userName} userRole={userRole}>
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="flex items-center justify-between pb-1">
          {!loading && !error && (
            <span className="text-[11px] text-slate-400">{processus.length} processus</span>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-[13px] text-slate-400">
            Chargement…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && processus.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[13px] text-slate-400">
            Aucun processus trouvé pour votre département.
          </div>
        )}

        {!loading && !error && processus.map((p) => (
          <ProcessusCard key={p.id_processus} processus={p} onFiche={handleFiche} />
        ))}
      </div>
    </AppLayout>
  );
}
