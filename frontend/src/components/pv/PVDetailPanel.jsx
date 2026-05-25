import { X, FileText, Download, Calendar, Users, Tag, Hash,
         CheckCircle, XCircle, Clock, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { apiClient } from "../../api/auth";
import { pvApi } from "../../api/pv.api";
import { useAuth } from "../../hooks/useAuth";

function formatDate(iso) {
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

const SOUS_TYPE_CONFIG = {
  REVUE_DG:        { label: "Revue avec DG",     bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-500" },
  INTERNE_CAQ:     { label: "Interne CAQ",        bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-500" },
  REUNION_SERVICE: { label: "Réunion de service", bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-500" },
  REUNION_SUIVI:   { label: "Réunion de suivi",   bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-400"  },
  FORMATION:       { label: "Formation",           bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-400"  },
  ENQUETE:         { label: "Enquête",             bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-400"  },
  AUTRE: { label: "Autre", dot: "bg-slate-400", badge: "bg-slate-50 text-slate-600 border-slate-200" },
  AUTRE_CR: { label: "Autre", dot: "bg-slate-400", badge: "bg-slate-50 text-slate-600 border-slate-200" },
};
const STATUT_CONFIG = {
  EN_VALIDATION: { label: "En cours de validation", bg: "bg-blue-50",    text: "text-blue-600",   dot: "bg-blue-500"    },
  VALIDE:        { label: "Validé",                 bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  REJETE:        { label: "Rejeté",                 bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500"     },
};

function ValidationProgress({ validationStatus }) {
  if (!validationStatus) return null;
  const { total, approuves, rejetes, en_attente, detail } = validationStatus;
  const pct = total > 0 ? Math.round((approuves / total) * 100) : 0;

  return (
    <div className="border-t pt-4 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1.5">
        <Users className="w-3 h-3" /> Validation ({approuves}/{total})
      </p>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: rejetes > 0 ? "#EF4444" : "#10B981" }}
        />
      </div>
      <p className="text-[11px] text-slate-400">
        {approuves} approuvé{approuves > 1 ? "s" : ""} · {rejetes} rejeté{rejetes > 1 ? "s" : ""} · {en_attente} en attente
      </p>
      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
        {detail?.map((v) => {
          const p = v.participant;
          const initials = `${p.prenom?.[0] || ""}${p.nom?.[0] || ""}`.toUpperCase();
          return (
            <div key={v.id} className="flex items-center gap-2 rounded-[8px] px-2.5 py-2 bg-slate-50">
              <div className="w-7 h-7 rounded-full bg-[#EDE9FE] text-[#6B21D9] flex items-center justify-center text-[10px] font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-700 font-medium truncate">{p.prenom} {p.nom}</p>
                {v.motif && (
                  <p className="text-[10px] text-red-500 truncate" title={v.motif}>{v.motif}</p>
                )}
              </div>
              {v.decision === "APPROUVE" && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
              {v.decision === "REJETE"   && <XCircle     className="w-4 h-4 text-red-500 shrink-0" />}
              {!v.decision               && <Clock       className="w-4 h-4 text-slate-300 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PVDetailPanel({ pv, onClose, onRefresh }) {
  const { user } = useAuth();
  const [downloading, setDownloading]     = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [motif, setMotif] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sousTypeConfig = SOUS_TYPE_CONFIG[pv.sous_type] || SOUS_TYPE_CONFIG.REVUE_DG;
  const statutConfig   = STATUT_CONFIG[pv.statut]      || STATUT_CONFIG.EN_VALIDATION;
  const isPV = pv.categorie === "PV";

  const isParticipant  = pv.participants_data?.some((p) => p.id === user?.id_user);
  const isCreateur = pv.createur_data?.id === user?.id_user;
  const myValidation   = pv.validation_status?.detail?.find((v) => v.participant?.id === user?.id_user);
  const alreadyDecided = myValidation?.decision != null;

  const runAction = async (fn) => {
    setActionLoading(true);
    setActionError("");
    try { await fn(); onRefresh?.(); }
    catch (err) { setActionError(err.response?.data?.error || "Une erreur est survenue."); }
    finally { setActionLoading(false); }
  };

  const handleApprouver = () => runAction(() => pvApi.enregistrerDecision(pv.id, "APPROUVE"));
  const handleRejeter   = () => {
    if (!motif.trim()) return setActionError("Le motif est obligatoire.");
    runAction(() => pvApi.enregistrerDecision(pv.id, "REJETE", motif))
      .then(() => { setShowRejectForm(false); setMotif(""); });
  };

  const handleSupprimer = async () => {
  setActionLoading(true);
  setActionError("");
  try {
    await pvApi.supprimerPV(pv.id);
    onClose();    // ← fermer le panel D'ABORD
    onRefresh?.(); // ← puis rafraîchir la liste
  } catch (err) {
    setActionError(err.response?.data?.error || "Une erreur est survenue.");
    setActionLoading(false);
  }
};

  const handleDownload = async () => {
    if (!pv.document_data) return;
    setDownloading(true);
    try {
      const { data } = await apiClient.get(`/documents/${pv.document_data.id}/download/`);
      const a = document.createElement("a"); a.href = data.url; a.download = data.nom_fichier; a.click();
    } catch { alert("Impossible de télécharger le fichier."); }
    finally { setDownloading(false); }
  };

  return (
    <div className="w-96 shrink-0">   {/* ← largeur augmentée */}
      <div className="rounded-[16px] border border-[#E9E1F8] bg-white shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
            <span className={`w-1.5 h-1.5 rounded-full ${sousTypeConfig.dot}`} />
            {isPV ? "Procès-Verbal" : "Compte Rendu"}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">

          {/* Code + badges */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 border border-dashed border-purple-200">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-[16px] font-bold text-slate-800">{pv.code}</p>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${sousTypeConfig.bg} ${sousTypeConfig.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sousTypeConfig.dot}`} />
              {sousTypeConfig.label}
            </span>
            {isPV && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${statutConfig.bg} ${statutConfig.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statutConfig.dot}`} />
                {statutConfig.label}
              </span>
            )}
          </div>

          {/* Erreur */}
          {actionError && (
            <div className="rounded-[8px] bg-red-50 border border-red-100 px-3 py-2 text-[11px] text-red-700">
              {actionError}
            </div>
          )}

          {/* Infos */}
          <div className="space-y-3 border-t pt-4">
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date"  value={formatDate(pv.date)} />
            <InfoRow icon={<Hash     className="w-4 h-4" />} label="Code"  value={pv.code} />
            <InfoRow icon={<Tag      className="w-4 h-4" />} label="Type"  value={sousTypeConfig.label} />
          </div>

          {/* Participants */}
          {pv.participants_data?.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Participants ({pv.participants_data.length})
                </p>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {pv.participants_data.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold shrink-0">
                      {`${p.prenom?.[0] || ""}${p.nom?.[0] || ""}`.toUpperCase()}
                    </div>
                    <p className="text-[12px] text-slate-600 truncate">{p.prenom} {p.nom}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progression validation */}
          {isPV && <ValidationProgress validationStatus={pv.validation_status} />}

          {/* ── ACTIONS ── */}
          {isPV && (
            <div className="border-t pt-4 space-y-2">

              {/* EN_VALIDATION + participant non décidé */}
              {pv.statut === "EN_VALIDATION" && isParticipant && !alreadyDecided && (
                <>
                  <button
                    onClick={handleApprouver}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 w-full rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approuver
                  </button>

                  {!showRejectForm ? (
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 w-full rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4" /> Rejeter
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        placeholder="Motif du rejet (obligatoire)…"
                        rows={3}
                        className="w-full rounded-[10px] px-3 py-2 text-[12px] text-slate-700 outline-none resize-none border border-red-200 bg-red-50"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowRejectForm(false); setMotif(""); }}
                          className="flex-1 rounded-[8px] py-2 text-[12px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleRejeter}
                          disabled={actionLoading || !motif.trim()}
                          className="flex-1 rounded-[8px] py-2 text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Confirmer le rejet"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* REJETE → bouton supprimer (créateur seulement) */}
              {pv.statut === "REJETE" && isCreateur && (
                !confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center justify-center gap-2 w-full rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer ce PV
                  </button>
                ) : (
                  <div className="rounded-[10px] bg-red-50 border border-red-200 p-3 space-y-2">
                    <p className="text-[12px] text-red-700 font-medium text-center">
                      Confirmer la suppression ?
                    </p>
                    <p className="text-[11px] text-red-500 text-center">Cette action est irréversible.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 rounded-[8px] py-2 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSupprimer}
                        disabled={actionLoading}
                        className="flex-1 rounded-[8px] py-2 text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Supprimer"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Document */}
          {pv.document_data && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Fichier joint</p>
              <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2.5">
                <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-purple-700 truncate">{pv.document_data.nom_fichier}</p>
                  <p className="text-[10px] text-purple-400">{formatSize(pv.document_data.taille)} · {formatDate(pv.document_data.date_upload)}</p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 w-full rounded-[10px] bg-purple-700 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-purple-800 disabled:opacity-60 transition-colors"
              >
                <Download className="w-4 h-4" />
                {downloading ? "Téléchargement…" : "Télécharger le PDF"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}