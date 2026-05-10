import { useEffect, useState } from "react";
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
  ClipboardCheck,
  TrendingUp,
  Clock,
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
      <div className="mt-0.5 text-slate-400 shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</p>
        <p className="text-[13px] text-slate-800 font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = "purple" }) {
  const colors = {
    purple: "bg-purple-50 text-purple-500",
    emerald: "bg-emerald-50 text-emerald-500",
    amber: "bg-amber-50 text-amber-500",
  };
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-[12px] px-4 py-2.5 border border-slate-100">
      <div className={`flex items-center justify-center w-8 h-8 rounded-[8px] ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[18px] font-semibold text-slate-800 leading-tight">{value}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
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

  const filtered = audits.filter((a) => {
    const matchSearch = !search ||
      a.departement_nom?.toLowerCase().includes(search.toLowerCase()) ||
      a.auditeur_nom?.toLowerCase().includes(search.toLowerCase()) ||
      a.observation?.toLowerCase().includes(search.toLowerCase());
    const matchDep = !filterDep || a.departement_nom === filterDep;
    return matchSearch && matchDep;
  });

  const hasFilters = search || filterDep;

  // Stats calculées
  const totalAvecRapport = audits.filter((a) => a.documents?.length > 0).length;
  const depsUniques = new Set(audits.map((a) => a.departement_nom)).size;
  const dernierAudit = audits
    .filter((a) => a.date_audit)
    .sort((a, b) => new Date(b.date_audit) - new Date(a.date_audit))[0];

  return (
    <AppLayout pageTitle="Audit terrain" userName={userName} userRole={userRole}>
      <div className="flex gap-4 h-full">

        {/* COLONNE PRINCIPALE */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* HEADER ENRICHI */}
          <div className="rounded-[16px] border border-[#E9E1F8] bg-white px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">

              {/* Titre + description */}
              <div className="flex items-start gap-3">
                
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="text-[20px] font-semibold text-slate-900 leading-normal">Audits terrain</h1>
                    
                  </div>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    Suivi des audits par département · rapports joints et observations consolidées
                  </p>
                  {dernierAudit && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      <p className="text-[11px] text-slate-400">
                        Dernier audit le{" "}
                        <span className="text-slate-600 font-medium">{formatDate(dernierAudit.date_audit)}</span>
                        {" · "}{dernierAudit.departement_nom}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats + bouton */}
              <div className="flex items-center gap-20 flex-wrap">
                <StatCard
                  icon={<ClipboardList className="w-4 h-4" />}
                  label="Audits total"
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
                    className="inline-flex items-center gap-2 rounded-[10px] bg-purple-700 px-3.5 py-2.5 text-[12px] font-medium text-white hover:bg-purple-800 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvel audit
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* FILTRES */}
          <div className="rounded-[14px] border bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  className="w-full text-[13px] outline-none placeholder:text-gray-300"
                  placeholder="Rechercher un audit…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-px h-5 bg-gray-200" />
              <select
                value={filterDep}
                onChange={(e) => setFilterDep(e.target.value)}
                className="text-[12px] text-slate-600 border rounded-[8px] px-2.5 py-1.5 outline-none focus:border-purple-400 bg-white"
              >
                <option value="">Tous les départements</option>
                {departements.map((d) => (
                  <option key={d.id_departement} value={d.nom}>{d.nom}</option>
                ))}
              </select>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setFilterDep(""); }}
                  className="text-[12px] text-purple-600 hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="rounded-[16px] border bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 py-12 text-red-500 text-[13px]">
                <AlertCircle className="w-4 h-4" />{error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <ClipboardList className="w-8 h-8" />
                <p className="text-[13px]">Aucun audit trouvé</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Département</th>
                    <th className="pr-4 py-3">Date</th>
                    <th className="pr-4 py-3">Auditeur</th>
                    <th className="pr-4 py-3">Rapport</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((audit) => (
                    <tr
                      key={audit.id_audit_field}
                      onClick={() => setSelectedAudit((prev) =>
                        prev?.id_audit_field === audit.id_audit_field ? null : audit
                      )}
                      className={`cursor-pointer border-t text-[13px] transition-colors ${
                        selectedAudit?.id_audit_field === audit.id_audit_field
                          ? "bg-purple-50 border-l-2 border-l-purple-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                          <p className="font-medium text-slate-800">{audit.departement_nom}</p>
                        </div>
                      </td>
                      <td className="pr-4 text-slate-500">{formatDate(audit.date_audit)}</td>
                      <td className="pr-4 text-slate-600">{audit.auditeur_nom}</td>
                      <td className="pr-4">
                        {audit.documents?.length > 0 ? (
                          <div className="flex items-center gap-1 text-purple-600">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="text-[12px]">{audit.documents[0].nom_fichier}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-[12px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="border-t px-4 py-3 text-[12px] text-slate-400">
                {filtered.length} audit{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* PANNEAU DÉTAIL */}
        {selectedAudit && (
          <div className="w-72 shrink-0">
            <div className="rounded-[16px] border border-[#E9E1F8] bg-white shadow-sm overflow-hidden">

              <div className="flex items-center justify-between px-5 py-3 border-b">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                  Détail de l'audit
                </div>
                <button onClick={() => setSelectedAudit(null)} className="rounded-lg p-1 hover:bg-gray-100 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">

                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 border border-dashed border-purple-200">
                    <Building2 className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-[13px] font-semibold text-slate-800 text-center">
                    {selectedAudit.departement_nom}
                  </p>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <InfoRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Date de l'audit"
                    value={formatDateLong(selectedAudit.date_audit)}
                  />
                  <InfoRow
                    icon={<User className="w-4 h-4" />}
                    label="Auditeur"
                    value={selectedAudit.auditeur_nom}
                  />
                  {selectedAudit.observation && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">Observation</p>
                      <p className="text-[12px] text-slate-600 bg-gray-50 rounded-lg p-2 leading-relaxed">
                        {selectedAudit.observation}
                      </p>
                    </div>
                  )}
                </div>

                {selectedAudit.documents?.length > 0 && (
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Rapport joint</p>
                    {selectedAudit.documents.map((doc) => (
                      <div key={doc.id_document} className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2">
                        <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-purple-700 truncate">{doc.nom_fichier}</p>
                          <p className="text-[10px] text-purple-400">
                            {formatSize(doc.taille)} · {formatDate(doc.date_upload)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleDownload(selectedAudit.documents[0])}
                      disabled={downloading}
                      className="flex items-center justify-center gap-2 w-full rounded-[10px] bg-purple-700 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-purple-800 disabled:opacity-60"
                    >
                      <Download className="w-4 h-4" />
                      {downloading ? "Téléchargement…" : "Télécharger le rapport"}
                    </button>
                  </div>
                )}

                {canDelete && (
                  <div className="border-t pt-3">
                    <button
                      onClick={() => handleDelete(selectedAudit.id_audit_field)}
                      className="w-full rounded-[10px] border border-red-200 px-4 py-2 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
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
