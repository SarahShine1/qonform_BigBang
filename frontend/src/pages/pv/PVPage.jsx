import { useEffect, useMemo, useState } from "react";
import {
  FileText, Plus, Search, Loader2, AlertCircle, FolderOpen,
  X, Calendar, ChevronRight, SlidersHorizontal, Paperclip,
  Download, Eye, Trash2, Users,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { pvApi } from "../../api/pv.api";
import { useAuth } from "../../hooks/useAuth";
import CreatePVModal from "../../components/pv/CreatePVModal";
import PVDetailPanel from "../../components/pv/PVDetailPanel";

/* ─── CONSTANTS ─────────────────────────────────────────── */

const PV_TYPES = {
  SUIVI: {
    label: "Suivi",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  REVUE_DG: {
    label: "Revue avec DG",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
};

/* ─── STAT CARD ─────────────────────────────────────────── */

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className="rounded-[14px] border bg-white px-5 py-4 shadow-sm flex flex-col gap-1"
      style={{ borderColor: "#E9E1F8" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="text-[28px] font-semibold leading-none" style={{ color: accent || "#6B21D9" }}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── TYPE BADGE ────────────────────────────────────────── */

function TypeBadge({ type }) {
  const cfg = PV_TYPES[type] || {};
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label || type}
    </span>
  );
}

/* ─── PV ROW ────────────────────────────────────────────── */

function PVRow({ pv, isSelected, onClick, onDelete, isCAQ }) {
  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (pv.document?.chemin_stockage) {
      window.open(`/media/${pv.document.chemin_stockage}`, "_blank");
    }
  };

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-b transition-colors ${
        isSelected ? "bg-[#F3ECFF]" : "border-slate-100 hover:bg-slate-50"
      }`}
      style={isSelected ? { borderColor: "#EEE7FA" } : {}}
    >
      {/* Code */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-[#F3ECFF] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-[#6B21D9]" />
          </div>
          <span className="text-[13px] font-semibold text-slate-800 font-mono tracking-tight">
            {pv.code}
          </span>
        </div>
      </td>

      {/* Type */}
      <td className="pr-4 py-3">
        <TypeBadge type={pv.type} />
      </td>

      {/* Date */}
      <td className="pr-4 py-3">
        <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-300" />
          {formatDate(pv.date)}
        </div>
      </td>

      {/* Participants */}
      <td className="pr-4 py-3">
        {pv.participants_data && pv.participants_data.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {pv.participants_data.slice(0, 3).map((p, i) => (
                <div
                  key={i}
                  title={p.username}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold"
                  style={{ background: "#EDE9FE", color: "#6B21D9", zIndex: 3 - i }}
                >
                  {p.username?.[0]?.toUpperCase()}
                </div>
              ))}
              {pv.participants_data.length > 3 && (
                <div
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold"
                  style={{ background: "#F1F5F9", color: "#64748B" }}
                >
                  +{pv.participants_data.length - 3}
                </div>
              )}
            </div>
            <span className="text-[12px] text-slate-500">
              {pv.participants_data.length} participant{pv.participants_data.length > 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <span className="text-[12px] text-slate-300">—</span>
        )}
      </td>

      {/* Document + pièce jointe */}
      <td className="pr-4 py-3">
        {pv.document_data ? (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
              style={{ background: "#F3ECFF" }}
            >
              <Paperclip className="w-3.5 h-3.5 text-[#6B21D9]" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[12px] font-medium text-slate-700 truncate max-w-[130px] leading-tight"
                title={pv.document_data.nom_fichier}
              >
                {pv.document_data.nom_fichier}
              </p>
              
            </div>
            <button
              onClick={handleDownload}
              title="Télécharger"
              className="ml-1 p-1.5 rounded-[7px] transition-colors hover:bg-[#EDE9FE] text-slate-300 hover:text-[#6B21D9] shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
            <Paperclip className="w-3 h-3" />
            Non joint
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="pr-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="p-1.5 rounded-[6px] text-slate-300 hover:text-[#6B21D9] hover:bg-[#F3ECFF] transition-colors"
            title="Voir le détail"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Visible uniquement pour CAQ / ADMIN */}
          {isCAQ && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(pv.id); }}
              className="p-1.5 rounded-[6px] text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── EMPTY STATE ───────────────────────────────────────── */

function EmptyState({ hasFilter }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-12 h-12 rounded-[14px] bg-[#F3ECFF] flex items-center justify-center">
        <FolderOpen className="w-6 h-6 text-[#6B21D9]" />
      </div>
      <div className="text-center">
        <p className="text-[14px] font-medium text-slate-700">
          {hasFilter ? "Aucun résultat" : "Aucun PV créé"}
        </p>
        <p className="text-[12px] text-slate-400 mt-0.5">
          {hasFilter ? "Essayez de modifier vos filtres." : "Créez votre premier procès-verbal."}
        </p>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────── */

export default function PVPage() {
  const { user } = useAuth();
  const [pvs, setPVs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedPV, setSelectedPV] = useState(null);

  /* Rôle calculé une seule fois ici, passé en prop aux lignes */
  const isCAQ = user?.roles?.some((r) => ["CAQ", "ADMIN", "Admin"].includes(r));

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    Promise.all([pvApi.getPVs(), pvApi.getPVStatistics()])
      .then(([pvsData, statsData]) => {
        if (!mounted) return;
        setPVs(pvsData.results || pvsData || []);
        setStats(statsData);
        
        
      })
      
      .catch((err) => {
        if (!mounted) return;
        setError("Impossible de charger les PVs");
        console.error(err);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refreshTrigger]);

  const userName = useMemo(() => {
    if (!user) return "";
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
  }, [user]);

  const filteredPVs = useMemo(() => pvs.filter((pv) => {
    const matchesSearch =
      pv.code.toLowerCase().includes(search.toLowerCase()) ||
      pv.type.toLowerCase().includes(search.toLowerCase()) ||
      pv.date.includes(search);
    const matchesType = filterType === "all" || pv.type === filterType;
    return matchesSearch && matchesType;
  }), [pvs, search, filterType]);

  const derivedStats = useMemo(() => ({
    total: pvs.length,
    suivi: pvs.filter((p) => p.type === "SUIVI").length,
    revueDG: pvs.filter((p) => p.type === "REVUE_DG").length,
    ...(stats || {}),
  }), [pvs, stats]);

  const handlePVCreated = () => {
    setShowCreateModal(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeletePV = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce PV ?")) {
      pvApi.deletePV(id).then(() => {
        if (selectedPV?.id === id) setSelectedPV(null);
        setRefreshTrigger((prev) => prev + 1);
      });
    }
  };

  const handleSelectPV = (pv) => {
    setSelectedPV((prev) => (prev?.id === pv.id ? null : pv));
  };

  const hasFilter = search || filterType !== "all";

  return (
    <AppLayout
      pageTitle="Suivi"
      userName={userName}
      userRole={user?.roles?.[0] || "Utilisateur"}
      contentClassName="bg-slate-50 px-4 py-4 pb-6"
    >
      <div className="flex gap-4 h-full">

        {/* ── COLONNE PRINCIPALE ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* HEADER */}
          <div className="rounded-[18px] bg-white shadow-sm px-6 py-5" style={{ border: "0.5px solid #E9E1F8" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 leading-tight">
                  Procès-Verbaux de suivi
                </h1>
                <p className="mt-1 text-[12px] text-slate-400">
                  Suivi des réunions et revues avec la direction générale
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-[11px] px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
                style={{ background: "linear-gradient(135deg, #6B21D9 0%, #8B5CF6 100%)" }}
              >
                <Plus className="w-3.5 h-3.5" />
                Nouveau PV
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total PVs" value={derivedStats.total} sub="procès-verbaux" accent="#6B21D9" />
            <StatCard label="Suivi" value={derivedStats.suivi} sub="réunions de suivi" accent="#D97706" />
            <StatCard label="Revue DG" value={derivedStats.revueDG} sub="revues direction" accent="#7C3AED" />
          </div>

          {/* FILTRES */}
          <div className="rounded-[14px] bg-white shadow-sm px-4 py-3" style={{ border: "0.5px solid #E9E1F8" }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0 bg-slate-50 rounded-[9px] px-3 py-2 border border-slate-100 focus-within:border-[#C4B5FD] transition-colors">
                <Search className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <input
                  className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-slate-300 text-slate-700"
                  placeholder="Rechercher par code, type ou date…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch("")}>
                    <X className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                  </button>
                )}
              </div>
              <div className="w-px h-5 bg-slate-200 shrink-0" />
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-[12px] text-slate-600 bg-transparent outline-none cursor-pointer"
                >
                  <option value="all">Tous les types</option>
                  <option value="SUIVI">Suivi</option>
                  <option value="REVUE_DG">Revue avec DG</option>
                </select>
              </div>
              {hasFilter && (
                <>
                  <div className="w-px h-5 bg-slate-200 shrink-0" />
                  <button
                    onClick={() => { setSearch(""); setFilterType("all"); }}
                    className="text-[11px] text-[#6B21D9] hover:underline font-medium whitespace-nowrap"
                  >
                    Réinitialiser
                  </button>
                </>
              )}
            </div>
          </div>

          {/* TABLEAU */}
          <div className="rounded-[16px] bg-white shadow-sm overflow-hidden" style={{ border: "0.5px solid #E9E1F8" }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[#6B21D9]" />
                <p className="text-[12px] text-slate-400">Chargement des PVs…</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 py-12 text-red-500 text-[13px]">
                <AlertCircle className="w-4 h-4" />{error}
              </div>
            ) : filteredPVs.length === 0 ? (
              <EmptyState hasFilter={!!hasFilter} />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b" style={{ borderColor: "#EEE7FA", background: "#FDFBFF" }}>
                    {["Code", "Type", "Date", "Participants", "Document", "Actions"].map((h) => (
                      <th
                        key={h}
                        className={`${h === "Code" ? "px-4" : "pr-4"} py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPVs.map((pv) => (
                    <PVRow
                      key={pv.id}
                      pv={pv}
                      isSelected={selectedPV?.id === pv.id}
                      onClick={() => handleSelectPV(pv)}
                      onDelete={handleDeletePV}
                      isCAQ={isCAQ}
                    />
                  ))}
                </tbody>
              </table>
            )}

            {!loading && !error && filteredPVs.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#EEE7FA" }}>
                <p className="text-[12px] text-slate-400">
                  <span className="font-semibold text-slate-600">{filteredPVs.length}</span>{" "}
                  PV{filteredPVs.length > 1 ? "s" : ""} affiché{filteredPVs.length > 1 ? "s" : ""}
                  {pvs.length !== filteredPVs.length && (
                    <span className="text-slate-300"> / {pvs.length} au total</span>
                  )}
                </p>
                {selectedPV && (
                  <p className="text-[11px] text-[#6B21D9] font-medium flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    {selectedPV.code} sélectionné
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── PANNEAU DÉTAIL ── */}
        {selectedPV && (
          <div className="w-[288px] shrink-0">
            <PVDetailPanel pv={selectedPV} onClose={() => setSelectedPV(null)} />
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePVModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handlePVCreated}
        />
      )}
    </AppLayout>
  );
}