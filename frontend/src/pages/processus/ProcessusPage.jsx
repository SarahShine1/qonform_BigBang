import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronRight, Download, Search } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";
import { getProcessusList } from "../../api/processus.api";
import { getStoredAccessToken } from "../../utils/authStorage";

// ── Couleurs type ─────────────────────────────────────────────────────────────
const TYPE_TEXT = {
  Management:  "#58148E",
  Realisation: "#065F46",
  Support:     "#92400E",
};

// ── Badge statut contour seulement ────────────────────────────────────────────
const STATUT_OUTLINE = {
  Brouillon:   { color: "#64748B", label: "Brouillon"   },
  Soumise:     { color: "#1E40AF", label: "Soumise"     },
  En_revision: { color: "#B45309", label: "En révision" },
  Publiee:     { color: "#166534", label: "Publiée"     },
  Archivee:    { color: "#6B7280", label: "Archivée"    },
  _none:       { color: "#CBD5E1", label: "Pas encore"  },
};

function StatutOutline({ statut }) {
  const cfg = statut ? (STATUT_OUTLINE[statut] ?? STATUT_OUTLINE._none) : STATUT_OUTLINE._none;
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ border: `1.5px solid ${cfg.color}`, color: cfg.color, backgroundColor: "transparent" }}
    >
      {cfg.label}
    </span>
  );
}

// ── Carte processus ───────────────────────────────────────────────────────────
function ProcessusCard({ processus, onNavigate, onPdf }) {
  const typeColor = TYPE_TEXT[processus.type_process] ?? "#374151";

  return (
    <div
      onClick={() => onNavigate(processus.id_processus)}
      className="group relative flex cursor-pointer flex-col rounded-xl border border-violet-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-violet-500 hover:shadow-md"
    >
      {/* badge statut : coin supérieur droit */}
      <div className="absolute right-3 top-3">
        <StatutOutline statut={processus.derniere_fiche_statut} />
      </div>

      {/* ligne 1 : code + type (laisser de la place pour le badge) */}
      <div className="mb-1 flex items-center gap-2 pr-24">
        <span className="font-mono text-[10.5px] font-semibold text-slate-400">
          {processus.code_process}
        </span>
        <span className="text-[10.5px] font-medium" style={{ color: typeColor }}>
          {processus.type_process}
        </span>
      </div>

      {/* ligne 2 : nom */}
      <p className="truncate pr-2 text-[12.5px] font-semibold leading-snug text-slate-800">
        {processus.nom}
      </p>

      {/* ligne 3 : bouton PDF + chevron */}
      <div className="mt-2 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {processus.derniere_version_id && (
          <button
            type="button"
            title="Télécharger PDF"
            onClick={(e) => onPdf(e, processus)}
            className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-400 transition hover:border-violet-300 hover:text-violet-600"
          >
            <Download size={10} /> PDF
          </button>
        )}
        <ChevronRight size={13} className="text-slate-300 transition group-hover:text-violet-400" />
      </div>
    </div>
  );
}

// ── Groupe département (accordion) ────────────────────────────────────────────
function DeptGroup({ dept, processus, openDept, onToggle, onNavigate, onPdf }) {
  const isOpen = openDept === dept;
  return (
    <div className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(dept)}
        className="flex w-full items-center justify-between bg-violet-50 px-5 py-3.5 text-left transition hover:bg-violet-100"
      >
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-violet-800">{dept}</span>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-500">
            {processus.length}
          </span>
        </div>
        {isOpen
          ? <ChevronDown size={15} className="text-violet-400" />
          : <ChevronRight size={15} className="text-violet-400" />
        }
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {processus.map((p) => (
              <ProcessusCard
                key={p.id_processus}
                processus={p}
                onNavigate={onNavigate}
                onPdf={onPdf}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const ALL = "";

export default function ProcessusPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [processus, setProcessus] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter]   = useState(ALL);
  const [statutFilter, setStatutFilter] = useState(searchParams.get("statut") || ALL);
  const [openDept, setOpenDept]   = useState(null); // nom du dept ouvert

  const isPilote = user?.roles?.some((r) => ["Pilote", "pilote", "PILOTE"].includes(r));
  const pageTitle = isPilote ? "Mes processus" : "Tous les processus";
  const userName  = `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() || user?.email || "Utilisateur";
  const userRole  = user?.roles?.[0] ?? "";

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = isPilote && user.departement != null ? { departement: user.departement } : {};
    getProcessusList(params)
      .then((list) => {
        setProcessus(list);
        // Ouvrir le premier département par défaut
        const depts = [...new Set(list.map((p) => p.departement_nom ?? "Autre"))];
        if (depts.length > 0) setOpenDept(depts[0]);
      })
      .catch(() => setError("Impossible de charger les processus."))
      .finally(() => setLoading(false));
  }, [user, isPilote]);

  const handleToggle = (dept) => setOpenDept((prev) => (prev === dept ? null : dept));
  const handleNavigate = (id) => navigate(`/gestion-processus/dossier/${id}`);
  const handlePdf = (e, p) => {
    e.stopPropagation();
    const token = getStoredAccessToken();
    window.open(
      `${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/v1/fiches/${p.derniere_version_id}/report/?token=${token}`,
      "_blank"
    );
  };

  // Filtrage
  const filtered = useMemo(() => processus.filter((p) => {
    const matchSearch = !search ||
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.code_process.toLowerCase().includes(search.toLowerCase());
    const matchType   = !typeFilter   || p.type_process === typeFilter;
    const matchStatut = !statutFilter || (statutFilter === "_none"
      ? !p.derniere_fiche_statut
      : p.derniere_fiche_statut === statutFilter);
    return matchSearch && matchType && matchStatut;
  }), [processus, search, typeFilter, statutFilter]);

  // Groupement par département
  const grouped = useMemo(() => {
    const map = {};
    for (const p of filtered) {
      const key = p.departement_nom ?? "Autre";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const types = useMemo(() =>
    [...new Set(processus.map((p) => p.type_process).filter(Boolean))].sort(),
    [processus]
  );

  return (
    <AppLayout pageTitle={pageTitle} userName={userName} userRole={userRole}>
      <div className="mx-auto max-w-5xl space-y-4">

        {/* ── Barre filtres ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Recherche */}
          <div className="relative min-w-[180px] flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-[12px] outline-none transition focus:border-violet-300 focus:ring-1 focus:ring-violet-100"
            />
          </div>

          {/* Filtre type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 outline-none transition focus:border-violet-300"
          >
            <option value={ALL}>Tous les types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Filtre statut fiche */}
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 outline-none transition focus:border-violet-300"
          >
            <option value={ALL}>Tous les états</option>
            <option value="Brouillon">Brouillon</option>
            <option value="Soumise">Soumise</option>
            <option value="En_revision">En révision</option>
            <option value="Publiee">Publiée</option>
            <option value="Archivee">Archivée</option>
            <option value="_none">Pas encore</option>
          </select>

          {!loading && !error && (
            <span className="shrink-0 text-[11px] text-slate-400">{filtered.length} processus</span>
          )}
        </div>

        {/* ── États ── */}
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
        {!loading && !error && grouped.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[13px] text-slate-400">
            {search || typeFilter || statutFilter
              ? "Aucun résultat pour ces filtres."
              : "Aucun processus trouvé."}
          </div>
        )}

        {/* ── Groupes accordion ── */}
        {!loading && !error && grouped.map(([dept, items]) => (
          <DeptGroup
            key={dept}
            dept={dept}
            processus={items}
            openDept={openDept}
            onToggle={handleToggle}
            onNavigate={handleNavigate}
            onPdf={handlePdf}
          />
        ))}
      </div>
    </AppLayout>
  );
}
