import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Loader2,
  AlertCircle,
  ClipboardList,
  FileText,
  Search,
  Building2,
  X,
  Download,
  Calendar,
  User,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";
import AuditTerrainModal from "../../components/audit/AuditTerrainModal";
import { apiClient } from "../../api/auth";
import {
  fetchAuditsTerrain,
  fetchDepartements,
  createAuditTerrain,
  deleteAuditTerrain,
} from "../../api/auditTerrain";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateLong(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 text-purple-300 shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">{label}</p>
        <p className="text-[13px] text-slate-700 font-medium leading-snug">{value || "—"}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = "purple" }) {
  const palette = {
    purple: {
      wrap: "bg-white border border-[#E9E1F8]",
      icon: "bg-purple-50 text-purple-500",
      dot: "bg-purple-400",
    },
    emerald: {
      wrap: "bg-white border border-emerald-100",
      icon: "bg-emerald-50 text-emerald-500",
      dot: "bg-emerald-400",
    },
    amber: {
      wrap: "bg-white border border-amber-100",
      icon: "bg-amber-50 text-amber-500",
      dot: "bg-amber-400",
    },
  };
  const c = palette[color];
  return (
    <div className={`flex items-center gap-3 rounded-[14px] px-4 py-3 shadow-sm ${c.wrap}`}>
      <div className={`flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0 ${c.icon}`}>
        {icon}
      </div>
      <div>
        <p className="text-[20px] font-bold text-slate-800 leading-none tracking-tight">{value}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

function DocumentBadge({ doc, onDownload, downloading }) {
  return (
    <div className="group flex items-center gap-2.5 rounded-[10px] border border-purple-100 bg-purple-50/60 px-3 py-2.5 hover:border-purple-300 hover:bg-purple-50 transition-all">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-purple-100 shadow-sm shrink-0">
        <FileText className="w-4 h-4 text-purple-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-purple-800 truncate">{doc.nom_fichier}</p>
        <p className="text-[10px] text-purple-400 mt-0.5">
          {formatSize(doc.taille)} · {formatDate(doc.date_upload)}
        </p>
      </div>
    </div>
  );
}

export default function AuditTerrainPage() {
  const { user } = useAuth();
  const isAuditeur = user?.roles?.some((r) => ["Auditeur", "auditeur", "AUDITEUR"].includes(r));
  const isCAQ = user?.roles?.some((r) => ["CAQ", "ADMIN", "Admin"].includes(r));
  const canDelete = isCAQ;

  const userName = `${user?.prenom || ""} ${user?.nom || ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] || "Utilisateur";

  const [audits, setAudits] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDep, setFilterDep] = useState("");
  const [searchParams] = useSearchParams();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [auditsData, depsData] = await Promise.all([fetchAuditsTerrain(), fetchDepartements()]);
      setAudits(auditsData);
      setDepartements(depsData);
    } catch {
      setError("Erreur lors du chargement des audits terrain.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (formData) => {
    await createAuditTerrain(formData);
    await load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet audit terrain ?")) return;
    await deleteAuditTerrain(id);
    if (selectedAudit?.id_audit_field === id) setSelectedAudit(null);
    await load();
  };

  const handleDownload = async (doc) => {
    setDownloading(true);
    try {
      const { data } = await apiClient.get(`/documents/${doc.id_document}/download/`);
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.nom_fichier;
      a.click();
    } catch {
      alert("Impossible de télécharger le fichier.");
    } finally {
      setDownloading(false);
    }
  };

  const auditStatutFilter = (searchParams.get("statut") || "").toLowerCase();
  const filtered = audits.filter((a) => {
    const matchSearch = !search ||
      a.departement_nom?.toLowerCase().includes(search.toLowerCase()) ||
      a.auditeur_nom?.toLowerCase().includes(search.toLowerCase()) ||
      a.observation?.toLowerCase().includes(search.toLowerCase());
    const matchDep = !filterDep || a.departement_nom === filterDep;
    const matchStatut = !auditStatutFilter ||
      (auditStatutFilter === "cloture" && a.documents?.length > 0) ||
      String(a.statut || a.status || "").toLowerCase() === auditStatutFilter;
    return matchSearch && matchDep && matchStatut;
  });

  const hasFilters = search || filterDep || !!auditStatutFilter;

  const totalAvecRapport = audits.filter((a) => a.documents?.length > 0).length;
  const depsUniques = new Set(audits.map((a) => a.departement_nom)).size;
  const dernierAudit = audits
    .filter((a) => a.date_audit)
    .sort((a, b) => new Date(b.date_audit) - new Date(a.date_audit))[0];

  return (
    <AppLayout pageTitle="Audits terrain" userName={userName} userRole={userRole}>
      <div className="flex gap-5 h-full">

        {/* COLONNE PRINCIPALE */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* HEADER */}
          <div className="rounded-[18px] border border-[#EDE7FB] bg-white px-6 py-2 shadow-sm">
            <div className="flex items-start justify-between gap-6 flex-wrap">

              {/* Titre */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-none">
                    Audits terrain
                  </h1>
                  <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-600 uppercase tracking-widest">
                    {audits.length}
                  </span>
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  Suivi par département · rapports joints et observations consolidées
                </p>
                {dernierAudit && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <p className="text-[11px] text-slate-400">
                      Dernier audit ·{" "}
                      <span className="text-slate-600 font-semibold">{formatDate(dernierAudit.date_audit)}</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span className="text-slate-500">{dernierAudit.departement_nom}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Stats + CTA */}
              <div className="flex items-center gap-3 flex-wrap">
                <StatCard
                  icon={<ClipboardList className="w-4 h-4" />}
                  label="Total audits"
                  value={audits.length}
                  color="purple"
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Avec rapport"
                  value={totalAvecRapport}
                  color="emerald"
                />
                <StatCard
                  icon={<Building2 className="w-4 h-4" />}
                  label="Départements"
                  value={depsUniques}
                  color="amber"
                />
                {isAuditeur && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 rounded-[12px] bg-purple-700 px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-purple-800 active:bg-purple-900 transition-colors shadow-sm shadow-purple-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nouvel audit
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* FILTRES */}
          <div className="rounded-[14px] border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-slate-50 rounded-[9px] px-3 py-2 border border-slate-100 focus-within:border-purple-300 focus-within:bg-white transition-colors">
                <Search className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <input
                  className="w-full text-[13px] bg-transparent outline-none text-slate-700 placeholder:text-slate-300"
                  placeholder="Département, auditeur, observation…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="w-px h-4 bg-slate-100" />
              <select
                value={filterDep}
                onChange={(e) => setFilterDep(e.target.value)}
                className="text-[12px] text-slate-600 border border-slate-100 rounded-[9px] px-3 py-2 outline-none focus:border-purple-300 bg-slate-50 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="">Tous les départements</option>
                {departements.map((d) => (
                  <option key={d.id_departement} value={d.nom}>{d.nom}</option>
                ))}
              </select>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setFilterDep(""); }}
                  className="text-[11px] text-purple-500 hover:text-purple-700 font-medium transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="rounded-[18px] border border-slate-100 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 py-16 text-red-400 text-[13px]">
                <AlertCircle className="w-4 h-4" />{error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100">
                  <ClipboardList className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[13px] text-slate-400">Aucun audit trouvé</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                      Département
                    </th>
                    <th className="pr-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                      Date
                    </th>
                    <th className="pr-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                      Auditeur
                    </th>
                    <th className="pr-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                      Rapport
                    </th>
                    <th className="pr-5 py-3 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((audit) => {
                    const isSelected = selectedAudit?.id_audit_field === audit.id_audit_field;
                    return (
                      <tr
                        key={audit.id_audit_field}
                        onClick={() => setSelectedAudit(isSelected ? null : audit)}
                        className={`cursor-pointer text-[13px] transition-all group ${
                          isSelected
                            ? "bg-purple-50/70"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          {isSelected && (
                            <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r bg-purple-500 my-1" style={{ position: "relative", display: "inline-block", marginRight: "0" }} />
                          )}
                          <div className="flex items-center gap-2.5">
                            <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
                              isSelected ? "bg-purple-100" : "bg-slate-100 group-hover:bg-purple-50"
                            }`}>
                              <Building2 className={`w-3.5 h-3.5 ${isSelected ? "text-purple-500" : "text-slate-400"}`} />
                            </div>
                            <span className={`font-semibold ${isSelected ? "text-purple-800" : "text-slate-700"}`}>
                              {audit.departement_nom}
                            </span>
                          </div>
                        </td>
                        <td className="pr-5 py-3.5">
                          <span className="text-slate-500 tabular-nums">{formatDate(audit.date_audit)}</span>
                        </td>
                        <td className="pr-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <User className="w-3 h-3 text-slate-400" />
                            </div>
                            <span className="text-slate-600">{audit.auditeur_nom}</span>
                          </div>
                        </td>
                        <td className="pr-5 py-3.5">
                          {audit.documents?.length > 0 ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-100 px-2.5 py-1 text-[11px] font-medium text-purple-600">
                              <FileText className="w-3 h-3" />
                              {audit.documents[0].nom_fichier.length > 20
                                ? audit.documents[0].nom_fichier.slice(0, 20) + "…"
                                : audit.documents[0].nom_fichier}
                            </div>
                          ) : (
                            <span className="text-slate-200 text-[12px]">—</span>
                          )}
                        </td>
                        <td className="pr-4 py-3.5">
                          <ChevronRight className={`w-3.5 h-3.5 transition-all ${
                            isSelected ? "text-purple-400 translate-x-0.5" : "text-slate-200 group-hover:text-slate-300"
                          }`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="border-t border-slate-50 px-5 py-3 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600">{filtered.length}</span>{" "}
                  audit{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
                  {hasFilters && (
                    <span className="text-slate-400"> sur {audits.length} total</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PANNEAU DÉTAIL */}
        {selectedAudit && (
          <div className="w-72 shrink-0">
            <div className="rounded-[18px] border border-[#EDE7FB] bg-white shadow-sm overflow-hidden">

              {/* Header panneau */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                    Détail
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAudit(null)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-5">

                {/* Identité département */}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <div className="relative">
                    <div className="flex items-center justify-center w-[60px] h-[60px] rounded-2xl bg-purple-50 border border-purple-100 shadow-inner">
                      <Building2 className="w-7 h-7 text-purple-400" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold text-slate-800 leading-tight">
                      {selectedAudit.departement_nom}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Audit terrain</p>
                  </div>
                </div>

                {/* Infos */}
                <div className="space-y-3 bg-slate-50 rounded-[12px] p-3.5 border border-slate-100">
                  <InfoRow
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    label="Date de l'audit"
                    value={formatDateLong(selectedAudit.date_audit)}
                  />
                  <div className="border-t border-slate-100" />
                  <InfoRow
                    icon={<User className="w-3.5 h-3.5" />}
                    label="Auditeur"
                    value={selectedAudit.auditeur_nom}
                  />
                </div>

                {/* Observation */}
                {selectedAudit.observation && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
                      Observation
                    </p>
                    <p className="text-[12px] text-slate-600 bg-slate-50 rounded-[10px] p-3 leading-relaxed border border-slate-100">
                      {selectedAudit.observation}
                    </p>
                  </div>
                )}

                {/* Document */}
                {selectedAudit.documents?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
                      Rapport joint
                    </p>
                    <div className="space-y-2">
                      {selectedAudit.documents.map((doc) => (
                        <DocumentBadge
                          key={doc.id_document}
                          doc={doc}
                          onDownload={handleDownload}
                          downloading={downloading}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleDownload(selectedAudit.documents[0])}
                      disabled={downloading}
                      className="mt-2.5 flex items-center justify-center gap-2 w-full rounded-[11px] bg-purple-700 px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-purple-800 active:bg-purple-900 disabled:opacity-60 transition-colors shadow-sm shadow-purple-200"
                    >
                      {downloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      {downloading ? "Téléchargement…" : "Télécharger le rapport"}
                    </button>
                  </div>
                )}

                {/* Suppression */}
                {canDelete && (
                  <div className="pt-1">
                    <button
                      onClick={() => handleDelete(selectedAudit.id_audit_field)}
                      className="w-full rounded-[11px] border border-red-100 px-4 py-2.5 text-[12px] font-semibold text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
                    >
                      Supprimer cet audit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <AuditTerrainModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
          departements={departements}
        />
      )}
    </AppLayout>
  );
}
