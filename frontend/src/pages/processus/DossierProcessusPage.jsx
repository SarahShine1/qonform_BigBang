import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, FileText, History, ClipboardCheck, Paperclip,
  Save, Loader2, Send, CheckCircle2, AlertTriangle, XCircle, X, Lock,
  Download, Eye, AlertCircle, Archive, ExternalLink, MessageSquare,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import PipelineFiche from "../../components/fiche/PipelineFiche";
import InfoItem from "../../components/fiche/InfoItem";
import SectionBlock from "../../components/fiche/SectionBlock";
import DocumentSection from "../../components/fiche/DocumentSection";
import { PURPLE, PURPLE_HOVER, BORDER } from "../../components/fiche/ficheConstants";
import { useAuth } from "../../hooks/useAuth";
import { getProcessusList } from "../../api/processus.api";
import {
  getSectionTemplates, getChampTemplates, getFiches,
  createVersionFiche, updateVersionFiche, saveChampFiches, getChampsFiche,
  openFicheReport,
} from "../../api/fiches.api";
import { getDocuments } from "../../api/documents.api";
import { auditApi } from "../../api/audit.api";

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "fiche",    label: "Fiche actuelle",  Icon: FileText       },
  { id: "versions", label: "Versions",         Icon: History        },
  { id: "audit",    label: "Audit fiche",      Icon: ClipboardCheck },
  { id: "pieces",   label: "Pièces jointes",   Icon: Paperclip      },
];

const STATUT_CONFIG = {
  Brouillon:   { bg: "#F1F5F9", text: "#64748B",  label: "Brouillon"   },
  Soumise:     { bg: "#FEF3C7", text: "#92400E",  label: "Soumise"     },
  En_revision: { bg: "#DBEAFE", text: "#1D4ED8",  label: "En révision" },
  Publiee:     { bg: "#D1FAE5", text: "#065F46",  label: "Publiée"     },
  Archivee:    { bg: "#F3F4F6", text: "#6B7280",  label: "Archivée"    },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const initials = (name) =>
  name ? name.trim().split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2) : "?";

const isFieldFilled = (val) => {
  if (val === null || val === undefined || val === "") return false;
  if (Array.isArray(val)) return val.length > 0;
  return true;
};

const calcCompletion = (sections, formValues) => {
  const allChamps = sections.flatMap((s) => s.champs);
  const total = allChamps.length;
  if (total === 0) return { pct: 0, filled: 0, total: 0 };
  const filled = allChamps.filter((c) => isFieldFilled(formValues[c.id_champ_template])).length;
  return { pct: Math.round((filled / total) * 100), filled, total };
};

const verifColors = (pct) => {
  if (pct >= 75) return { bg: "#ECFDF5", border: "#6EE7B7", text: "#065F46", bar: "#10B981", barBg: "#D1FAE5" };
  if (pct >= 50) return { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", bar: "#F59E0B", barBg: "#FEF3C7" };
  return { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", bar: "#EF4444", barBg: "#FEE2E2" };
};

const incrementVersion = (vStr) => {
  const major = parseInt((vStr ?? "1.0").split(".")[0], 10);
  return `${major + 1}.0`;
};

// ── Multi-process selector ────────────────────────────────────────────────────
function MultiProcessSelect({ value, onChange, options, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id) => {
    const num = Number(id);
    onChange(value.includes(num) ? value.filter((v) => v !== num) : [...value, num]);
  };

  const selected = options.filter((p) => value.includes(p.id_processus));

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        className="min-h-[36px] flex flex-wrap gap-1.5 items-center rounded-lg px-2.5 py-1.5 cursor-pointer"
        style={{ border: `1px solid ${BORDER}`, backgroundColor: disabled ? "#F9FAFB" : "#fff" }}
      >
        {selected.length === 0 && <span className="text-[12.5px] text-slate-400">— Aucun —</span>}
        {selected.map((p) => (
          <span key={p.id_processus}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{
              backgroundColor: "#F0EBFF",
              border: `1.5px dashed ${PURPLE}`,
              color: PURPLE,
            }}>
            {p.code_process}
            {!disabled && (
              <button type="button" onClick={(e) => { e.stopPropagation(); toggle(p.id_processus); }}
                className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
            )}
          </span>
        ))}
        {!disabled && <span className="ml-auto text-slate-400 text-[11px]">{open ? "▲" : "▼"}</span>}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-white shadow-lg"
          style={{ borderColor: BORDER, maxHeight: 220, overflowY: "auto" }}>
          {options.map((p) => (
            <label key={p.id_processus}
              className="flex items-center gap-3 px-3 py-2 text-[12.5px] cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={value.includes(p.id_processus)} onChange={() => toggle(p.id_processus)}
                className="accent-purple-700" />
              <span className="font-semibold" style={{ color: PURPLE }}>{p.code_process}</span>
              <span className="text-slate-500 truncate">{p.nom}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notification banner ───────────────────────────────────────────────────────
function NotifBanner({ notif, onClose, overlayStyle }) {
  if (!notif) return null;
  const cfg = {
    success: { bg: "#ECFDF5", border: "#6EE7B7", text: "#065F46", Icon: CheckCircle2 },
    warning: { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", Icon: AlertTriangle },
    error:   { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", Icon: XCircle      },
  }[notif.type] ?? { bg: "#EDE9FE", border: "#C4B5FD", text: "#4C1D95", Icon: CheckCircle2 };
  const { Icon } = cfg;
  return (
    <div className="fixed flex items-center justify-between gap-4 rounded-xl px-5 py-3 shadow-lg"
      style={{ ...overlayStyle, top: "1rem", zIndex: 9999, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: cfg.text }}>
        <Icon size={15} /> {notif.message}
      </div>
      <button type="button" onClick={onClose}
        className="shrink-0 rounded p-1 opacity-60 transition hover:opacity-100" style={{ color: cfg.text }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ── Verification panel ────────────────────────────────────────────────────────
function VerifPanel({ data, onClose, overlayStyle }) {
  if (!data) return null;
  const { pct, filled, total } = data;
  const c = verifColors(pct);
  const msg =
    pct >= 75 ? "La fiche est bien remplie, vous pouvez la soumettre." :
    pct >= 50 ? "La fiche est partiellement complète. Continuez à remplir avant de soumettre." :
                "La fiche nécessite encore beaucoup de travail avant soumission.";
  return (
    <div className="fixed rounded-xl px-5 py-4 shadow-lg"
      style={{ ...overlayStyle, top: "1rem", zIndex: 9999, backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[13px] font-bold" style={{ color: c.text }}>
            Vous avez rempli <span className="text-[15px]">{pct}%</span> de la fiche
            <span className="ml-2 text-[11px] font-normal opacity-70">({filled} / {total} champs)</span>
          </p>
          <p className="mt-0.5 text-[11.5px]" style={{ color: c.text, opacity: 0.8 }}>{msg}</p>
          <div className="mt-2.5 h-2 w-full rounded-full" style={{ backgroundColor: c.barBg }}>
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: c.bar }} />
          </div>
        </div>
        <button type="button" onClick={onClose}
          className="mt-0.5 shrink-0 rounded p-1 opacity-60 transition hover:opacity-100" style={{ color: c.text }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Archive confirmation modal ─────────────────────────────────────────────────
function ArchiveModal({ versionNumero, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-[420px] rounded-2xl bg-white p-6 shadow-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <Archive size={18} className="text-amber-600" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-800">Archiver cette version</h3>
        </div>
        <p className="text-[13px] text-slate-500 mb-6">
          Voulez-vous archiver la <strong>version {versionNumero}</strong> de cette fiche ?
          Elle sera conservée en lecture seule et une nouvelle version sera créée.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="rounded-xl px-5 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
            style={{ border: `1px solid ${BORDER}` }}>
            Annuler
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition"
            style={{ backgroundColor: "#D97706" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#B45309"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#D97706"}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
            Archiver
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Audit Feedback Panel ─────────────────────────────────────────────────────
function FeedbackPanel({ feedback, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin" style={{ color: "#F59E0B" }} />
      </div>
    );
  }
  if (!feedback) {
    return (
      <p className="px-4 py-8 text-center text-[12px] italic text-slate-400">
        Aucun feedback disponible.
      </p>
    );
  }
  const { complianceRate, nonConformities, audit } = feedback;
  return (
    <div className="space-y-4 p-4">
      {/* Taux de conformité */}
      <div className="rounded-xl border border-amber-200 bg-white px-4 py-3">
        <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-amber-700">
          Taux de conformité
        </p>
        <p className="text-[26px] font-bold text-amber-600">{complianceRate ?? 0}%</p>
        <div className="mt-1.5 h-2 w-full rounded-full bg-amber-100">
          <div
            className="h-2 rounded-full bg-amber-400 transition-all duration-500"
            style={{ width: `${Math.min(complianceRate ?? 0, 100)}%` }}
          />
        </div>
      </div>

      {/* Observations */}
      {audit?.observations && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Observations
          </p>
          <p className="text-[12px] leading-relaxed text-slate-600">{audit.observations}</p>
        </div>
      )}

      {/* Non-conformités */}
      <div className="overflow-hidden rounded-xl border border-red-200">
        <div className="border-b border-red-200 bg-red-50 px-4 py-2.5">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-red-700">
            Non-conformités ({nonConformities?.length ?? 0})
          </p>
        </div>
        {!nonConformities?.length ? (
          <div className="bg-green-50 px-4 py-3 text-center">
            <p className="text-[12px] font-semibold text-green-700">Aucune non-conformité</p>
          </div>
        ) : (
          <div className="divide-y divide-red-100 bg-white">
            {nonConformities.map(nc => (
              <div key={nc.id} className="px-4 py-3">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold text-slate-700">{nc.title}</p>
                  {nc.severity && (
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                      {nc.severity}
                    </span>
                  )}
                </div>
                {nc.description && (
                  <p className="text-[11px] leading-relaxed text-slate-500">{nc.description}</p>
                )}
                {nc.sectionTitle && nc.sectionTitle !== "Section non liée" && (
                  <p className="mt-0.5 text-[10px] italic text-slate-400">
                    Section : {nc.sectionTitle}
                  </p>
                )}
                {nc.actions?.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {nc.actions.map(action => (
                      <div key={action.id} className="rounded-lg bg-blue-50 px-3 py-2">
                        <p className="mb-0.5 text-[10.5px] font-semibold text-blue-700">
                          Action corrective
                        </p>
                        <p className="text-[11px] text-slate-600">{action.description}</p>
                        {(action.responsible || action.dueDate) && (
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {action.responsible && `Resp. : ${action.responsible}`}
                            {action.responsible && action.dueDate && " · "}
                            {action.dueDate && `Échéance : ${action.dueDate}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fiche Tab ──────────────────────────────────────────────────────────────────
function FicheTab({ processusId, processus, user, onVersionCreated }) {
  const [sections,         setSections]         = useState([]);
  const [processusList,    setProcessusList]    = useState([]);
  const [formValues,       setFormValues]       = useState({});
  const [amontIds,         setAmontIds]         = useState([]);
  const [avalIds,          setAvalIds]          = useState([]);
  const [currentStatut,    setCurrentStatut]    = useState("Brouillon");
  const [versionNumero,    setVersionNumero]    = useState(null);
  const [existingVersionId, setExistingVersionId] = useState(null);
  const [revue,            setRevue]            = useState(false);
  const [auditDoc,         setAuditDoc]         = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [archiving,        setArchiving]        = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [error,            setError]            = useState(null);
  const [notif,            setNotif]            = useState(null);
  const [verifData,        setVerifData]        = useState(null);
  const [showFeedback,    setShowFeedback]    = useState(false);
  const [auditFeedback,   setAuditFeedback]   = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const notifTimer  = useRef(null);
  const containerRef = useRef(null);
  const [overlayStyle, setOverlayStyle] = useState({});

  const isPilote = user?.roles?.some(r => ["Pilote", "pilote", "PILOTE"].includes(r));
  const canEdit  = isPilote && currentStatut === "Brouillon";
  const canArchive = isPilote && currentStatut === "Publiee";

  useLayoutEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const { left, width } = containerRef.current.getBoundingClientRect();
      setOverlayStyle({ left, width });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const showNotif = useCallback((type, message) => {
    clearTimeout(notifTimer.current);
    setNotif({ type, message });
    notifTimer.current = setTimeout(() => setNotif(null), 5000);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [rawSections, pl, fiches] = await Promise.all([
          getSectionTemplates(),
          getProcessusList(),
          getFiches({ id_processus: processusId }),
        ]);
        const sectionsWithChamps = await Promise.all(
          rawSections
            .filter(s => s.est_actif !== false)
            .sort((a, b) => a.ordre - b.ordre)
            .map(async (s) => {
              const champs = await getChampTemplates(s.id_section_template);
              return { ...s, champs: champs.filter(c => c.est_actif !== false).sort((a, b) => a.ordre - b.ordre) };
            })
        );
        setSections(sectionsWithChamps);
        setProcessusList(pl);

        if (fiches && fiches.length > 0) {
          const fiche = fiches.reduce((a, b) => (a.id_version > b.id_version ? a : b));
          setExistingVersionId(fiche.id_version);
          setCurrentStatut(fiche.statut ?? "Brouillon");
          setVersionNumero(fiche.numero_version);
          setAmontIds(fiche.liaisons_amont ?? []);
          setAvalIds(fiche.liaisons_aval ?? []);
          setRevue(fiche.revue ?? false);

          const champsExistants = await getChampsFiche(fiche.id_version);
          const vals = {};
          champsExistants.forEach(c => {
            vals[c.id_champ_template] = c.valeur_json !== null ? c.valeur_json : c.valeur;
          });
          setFormValues(vals);

          if (fiche.revue) {
            const docs = await getDocuments(fiche.id_version);
            setAuditDoc(docs.find(d => d.type_document === "Rapport_audit_fiche") ?? null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [processusId]);

  const handleChange = useCallback((champId, value) => {
    setFormValues(prev => ({ ...prev, [champId]: value }));
  }, []);

  const validateRequired = () =>
    sections.flatMap(s => s.champs).filter(c =>
      c.est_obligatoire && !isFieldFilled(formValues[c.id_champ_template])
    );

  const handleSave = async (targetStatut) => {
    const missing = validateRequired();
    if (missing.length > 0) {
      setError(`Veuillez remplir ${missing.length} champ(s) obligatoire(s) avant d'enregistrer.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let versionId;
      if (!existingVersionId) {
        const fiche = await createVersionFiche({
          id_processus:   Number(processusId),
          id_redacteur:   user?.id_user,
          numero_version: versionNumero ?? "1.0",
          statut:         targetStatut,
          amont_ids:      amontIds,
          aval_ids:       avalIds,
        });
        versionId = fiche.id_version;
        setExistingVersionId(fiche.id_version);
        setVersionNumero(fiche.numero_version);
        onVersionCreated?.();
      } else {
        await updateVersionFiche(existingVersionId, { statut: targetStatut, amont_ids: amontIds, aval_ids: avalIds });
        versionId = existingVersionId;
      }
      setCurrentStatut(targetStatut);

      const payload = sections.flatMap(s =>
        s.champs.map(c => {
          const val = formValues[c.id_champ_template];
          const isJson = Array.isArray(val) || (typeof val === "object" && val !== null);
          return {
            id_champ_template: c.id_champ_template,
            libelle:           c.libelle,
            type_champ:        c.type_champ,
            est_obligatoire:   c.est_obligatoire,
            ordre:             c.ordre,
            valeur:            isJson ? null : val != null ? String(val) : null,
            valeur_json:       isJson ? val : null,
          };
        })
      );
      await saveChampFiches(versionId, payload);

      showNotif("success", targetStatut === "Soumise" ? "Fiche soumise avec succès !" : "Brouillon enregistré avec succès !");
      onVersionCreated?.();
    } catch (err) {
      setError("Une erreur est survenue lors de l'enregistrement.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await updateVersionFiche(existingVersionId, { statut: "Archivee" });
      const newVersion = incrementVersion(versionNumero);
      setExistingVersionId(null);
      setCurrentStatut("Brouillon");
      setVersionNumero(newVersion);
      setRevue(false);
      setAuditDoc(null);
      setShowArchiveModal(false);
      showNotif("success", `Version ${versionNumero} archivée. Créez la version ${newVersion}.`);
      onVersionCreated?.();
    } catch (err) {
      setError("Erreur lors de l'archivage.");
      console.error(err);
    } finally {
      setArchiving(false);
    }
  };

  const toggleFeedback = async () => {
    if (showFeedback) { setShowFeedback(false); return; }
    setShowFeedback(true);
    if (!auditFeedback && existingVersionId) {
      setLoadingFeedback(true);
      try {
        const data = await auditApi.getExecution(existingVersionId);
        setAuditFeedback(data);
      } catch { /* fail silently */ } finally {
        setLoadingFeedback(false);
      }
    }
  };

  const statusMsg = {
    Soumise:     { bg: "#FFFBEB", text: "#92400E", msg: "En attente du feedback de l'auditeur sur la fiche." },
    En_revision: { bg: "#DBEAFE", text: "#1D4ED8", msg: "Feedback en cours par l'auditeur." },
    Publiee:     { bg: "#ECFDF5", text: "#065F46", msg: `Version ${versionNumero} finale publiée de la fiche ${processus?.nom ?? ""}.` },
    Archivee:    { bg: "#F3F4F6", text: "#6B7280", msg: "Cette version est archivée." },
  }[currentStatut];

  return (
    <div ref={containerRef}>
      {showArchiveModal && (
        <ArchiveModal
          versionNumero={versionNumero}
          onConfirm={handleArchive}
          onCancel={() => setShowArchiveModal(false)}
          loading={archiving}
        />
      )}
      <NotifBanner notif={notif} onClose={() => setNotif(null)} overlayStyle={overlayStyle} />
      <VerifPanel data={verifData} onClose={() => setVerifData(null)} overlayStyle={overlayStyle} />

      <div className={showFeedback ? "flex items-start gap-4" : undefined}>
        {/* ── Left column (or full width) ── */}
        <div className={showFeedback ? "flex-1 min-w-0" : undefined}>
          {/* Pipeline statut */}
          <div className="rounded-xl bg-white px-8 py-5" style={{ border: `1px solid ${BORDER}` }}>
            <PipelineFiche statut={currentStatut} />
            {statusMsg && (
              <p className="mt-3 rounded-lg px-4 py-2 text-center text-[11.5px] font-medium"
                style={{ backgroundColor: statusMsg.bg, color: statusMsg.text }}>
                {statusMsg.msg}
              </p>
            )}
          </div>

          {/* ── Boutons entre pipeline et fiche ── */}
          <div className="my-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Yellow toggle: only shown to open (closing is done via X inside the panel) */}
              {isPilote && revue && !showFeedback && (
                <button type="button" onClick={toggleFeedback}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition"
                  style={{
                    backgroundColor: "#FEF3C7",
                    color: "#92400E",
                    border: "1.5px solid #FCD34D",
                  }}>
                  <MessageSquare size={13} />
                  Voir les remarques de l'auditeur
                </button>
              )}
              {/* Link to audit report doc (when panel is closed or non-pilote) */}
              {revue && auditDoc?.url && !showFeedback && (
                <a href={auditDoc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition"
                  style={{ backgroundColor: "#0284C7" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#0369A1"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "#0284C7"}>
                  <ExternalLink size={13} /> Voir rapport audit
                </a>
              )}
              {/* Badge lecture seule */}
              {!canEdit && !canArchive && !revue && (
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-semibold text-slate-500">
                  <Lock size={10} /> Lecture seule
                </span>
              )}
              {/* Erreur */}
              {error && (
                <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {canArchive && (
                <button type="button" onClick={() => setShowArchiveModal(true)}
                  className="flex items-center gap-2 rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition"
                  style={{ backgroundColor: "#D97706" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#B45309"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "#D97706"}>
                  <Archive size={14} /> Archiver cette version
                </button>
              )}
              {canEdit && (
                <button type="button" disabled={saving || loading}
                  onClick={() => handleSave("Brouillon")}
                  className="flex items-center gap-2 rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: PURPLE, boxShadow: "0 4px 14px rgba(88,20,142,0.3)" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = PURPLE_HOVER}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = PURPLE}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Enregistrer
                </button>
              )}
            </div>
          </div>

          {/* Fiche form card */}
          <div className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-center px-6 py-3"
              style={{ backgroundColor: PURPLE, borderBottom: `1px solid ${BORDER}` }}>
              <span className="text-[12px] font-semibold text-white">Fiche Processus</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                <Loader2 size={26} className="animate-spin" style={{ color: PURPLE }} />
                <span className="text-[12px]">Chargement du formulaire…</span>
              </div>
            ) : (
              <div>
                {/* Section 0 — Liens processus */}
                <div style={{ borderTop: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-3 px-6 py-3"
                    style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
                    <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
                      style={{ backgroundColor: PURPLE }}>0</span>
                    <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500">
                      Liens processus
                    </span>
                  </div>
                  <div className="bg-white px-6">
                    <div className="py-4 grid items-start gap-5" style={{ gridTemplateColumns: "200px 1fr" }}>
                      <span className="text-[12px] font-semibold pt-0.5" style={{ color: PURPLE }}>Processus en amont</span>
                      <MultiProcessSelect
                        value={amontIds} onChange={setAmontIds}
                        options={processusList.filter(p => p.id_processus !== Number(processusId))}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="py-4 grid items-start gap-5" style={{ gridTemplateColumns: "200px 1fr", borderTop: `1px solid ${BORDER}` }}>
                      <span className="text-[12px] font-semibold pt-0.5" style={{ color: PURPLE }}>Processus en aval</span>
                      <MultiProcessSelect
                        value={avalIds} onChange={setAvalIds}
                        options={processusList.filter(p => p.id_processus !== Number(processusId))}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </div>

                {/* Sections dynamiques */}
                {sections.map((section, idx) => (
                  <SectionBlock
                    key={section.id_section_template}
                    section={section}
                    index={idx + 1}
                    formValues={formValues}
                    onChange={handleChange}
                    readOnly={!canEdit}
                  />
                ))}

                {/* Section BPMN */}
                <DocumentSection
                  versionId={existingVersionId}
                  readOnly={!canEdit}
                  sectionIndex={sections.length + 1}
                  showBpmn={true}
                  showPreuves={false}
                  label="BPMN"
                  bpmnDescription="Déposez ici le diagramme BPMN décrivant le workflow complet du processus."
                />
              </div>
            )}
          </div>

          {/* Boutons bas */}
          {canEdit && (
            <div className="mt-4 flex items-center justify-end gap-3">
              <button type="button" disabled={saving || loading}
                onClick={() => setVerifData(calcCompletion(sections, formValues))}
                className="rounded-xl px-6 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "#fff", border: `1.5px solid ${PURPLE}`, color: PURPLE }}>
                Vérifier avant soumettre
              </button>
              <button type="button" disabled={saving || loading} onClick={() => handleSave("Soumise")}
                className="flex items-center gap-2 rounded-xl px-6 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: PURPLE }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = PURPLE_HOVER}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = PURPLE}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Soumettre la fiche
              </button>
            </div>
          )}
        </div>

        {/* ── Right column: sticky audit feedback panel ── */}
        {showFeedback && (
          <div
            className="w-[360px] shrink-0 sticky top-4 overflow-hidden rounded-xl"
            style={{
              height: "calc(100vh - 5rem)",
              overflowY: "auto",
              border: "1.5px solid #FDE68A",
            }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Feedback auditeur
              </span>
              <button type="button" onClick={() => setShowFeedback(false)}
                className="rounded p-1 opacity-60 transition hover:opacity-100"
                style={{ color: "#92400E" }}>
                <X size={14} />
              </button>
            </div>
            <FeedbackPanel feedback={auditFeedback} loading={loadingFeedback} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Versions Tab ──────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const c = STATUT_CONFIG[statut] ?? { bg: "#F3F4F6", text: "#374151", label: statut };
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}>
      {c.label ?? statut ?? "—"}
    </span>
  );
}

function VersionsTab({ versions, loading, processus, onConsulterCurrent }) {
  const navigate = useNavigate();
  const handleOpenReport = (versionId) => openFicheReport(versionId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[12px] text-slate-400">
        <Loader2 size={18} className="animate-spin mr-2" style={{ color: PURPLE }} /> Chargement…
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-xl bg-white px-6 py-10 text-center text-[13px] text-slate-400"
        style={{ border: `1px solid ${BORDER}` }}>
        Aucune version publiée pour ce processus.
      </div>
    );
  }

  return (
    <div className="relative pl-14">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-slate-200" />

      {versions.map((version, idx) => {
        const isCurrent = idx === 0;
        return (
          <div key={version.id_version} className="relative flex items-start gap-4 pb-6">
            {/* Circle */}
            <div className="absolute -left-[50px] top-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: isCurrent ? PURPLE : "#fff",
                border: isCurrent ? "none" : "2px solid #CBD5E1",
                color: isCurrent ? "#fff" : "#94A3B8",
                fontWeight: "bold",
                fontSize: 11,
                zIndex: 2,
              }}>
              {isCurrent ? "✓" : `V${version.numero_version}`}
            </div>

            {/* Card */}
            <div className="flex-1 rounded-xl bg-white px-5 py-4"
              style={{
                border: `1px solid ${BORDER}`,
                borderLeft: isCurrent ? `4px solid ${PURPLE}` : `1px solid ${BORDER}`,
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-slate-800">Version {version.numero_version}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{fmtDate(version.date_creation ?? version.created_at)}</p>
                  {processus?.pilote_nom && (
                    <p className="text-[11px] text-slate-500 mt-0.5">Pilote : {processus.pilote_nom}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatutBadge statut={version.statut} />
                  <button type="button"
                    onClick={() => handleOpenReport(version.id_version)}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold text-slate-500 transition hover:bg-slate-50"
                    style={{ borderColor: BORDER }}>
                    <Download size={12} /> Voir PDF
                  </button>
                  <button type="button"
                    onClick={() => isCurrent ? onConsulterCurrent() : navigate(`/gestion-processus/fiches/${version.id_version}/modifier`)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-white transition"
                    style={{ backgroundColor: PURPLE }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = PURPLE_HOVER}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = PURPLE}>
                    <Eye size={12} /> Consulter
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Audit Fiche Tab ───────────────────────────────────────────────────────────
function AuditDocCard({ doc, versionId }) {
  const [opening, setOpening] = useState(false);

  const handleOpen = async () => {
    setOpening(true);
    try {
      // Use the authenticated backend endpoint — handles auth & serves clean HTML
      await auditApi.openReport(versionId);
    } catch {
      // Fallback: fetch the stored URL and force text/html blob
      try {
        const resp = await fetch(doc.url);
        const html = await resp.text();
        const blob = new Blob([html], { type: "text/html" });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      } catch {
        if (doc.url) window.open(doc.url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3"
      style={{ borderColor: "#C4B5FD" }}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: "#EDE9FE" }}>
        <FileText size={18} style={{ color: PURPLE }} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-slate-700">{doc.nom_fichier}</p>
        {doc.taille && <p className="text-[10.5px] text-slate-400">{(doc.taille / 1024).toFixed(0)} Ko</p>}
      </div>
      <button type="button" onClick={handleOpen} disabled={opening}
        className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition hover:bg-slate-100 disabled:opacity-50"
        style={{ color: PURPLE }}>
        {opening
          ? <><Loader2 size={12} className="animate-spin" /> Ouverture…</>
          : <><ExternalLink size={12} /> Voir</>}
      </button>
    </div>
  );
}

function AuditFicheTab({ versions, currentVersion }) {
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!versions.length) { setLoading(false); return; }
      setLoading(true);
      try {
        const results = await Promise.all(
          versions.map(v =>
            getDocuments(v.id_version)
              .then(d => [v.id_version, d.filter(doc => doc.type_document === "Rapport_audit_fiche")])
              .catch(() => [v.id_version, []])
          )
        );
        const map = {};
        results.forEach(([id, d]) => { map[id] = d; });
        setDocs(map);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [versions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[12px] text-slate-400">
        <Loader2 size={18} className="animate-spin mr-2" style={{ color: PURPLE }} /> Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rapport version actuelle */}
      <div className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3 px-5 py-3"
          style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Rapport d'audit — Version actuelle
          </span>
        </div>
        <div className="px-5 py-4">
          {!currentVersion ? (
            <p className="text-[12px] italic text-slate-400">Aucune version disponible.</p>
          ) : (docs[currentVersion.id_version] ?? []).length === 0 ? (
            <p className="text-[12px] italic text-slate-400">Aucun rapport d'audit pour la version actuelle.</p>
          ) : (
            <div className="space-y-2">
              {(docs[currentVersion.id_version] ?? []).map(doc => (
                <AuditDocCard key={doc.id_document} doc={doc} versionId={currentVersion.id_version} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rapports versions précédentes */}
      {versions.length > 1 && (
        <div className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 px-5 py-3"
            style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Rapports d'audit — Versions précédentes
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {versions.slice(1).map(v => (
              <div key={v.id_version} className="px-5 py-4">
                <p className="mb-2 text-[12px] font-bold text-slate-700">Version {v.numero_version}</p>
                {(docs[v.id_version] ?? []).length === 0 ? (
                  <p className="text-[11.5px] italic text-slate-400">Aucun rapport d'audit.</p>
                ) : (
                  <div className="space-y-2">
                    {(docs[v.id_version] ?? []).map(doc => (
                      <AuditDocCard key={doc.id_document} doc={doc} versionId={v.id_version} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pieces Jointes Tab ────────────────────────────────────────────────────────
function PiecesTab({ versions, currentVersion, isPilote }) {
  const [versionDocs, setVersionDocs] = useState({});
  const [loading, setLoading] = useState(true);

  const canEditDocs = isPilote && currentVersion?.statut === "Brouillon";

  useEffect(() => {
    async function load() {
      if (!versions.length) { setLoading(false); return; }
      setLoading(true);
      try {
        const results = await Promise.all(
          versions.map(v =>
            getDocuments(v.id_version).then(docs => [v.id_version, docs]).catch(() => [v.id_version, []])
          )
        );
        const map = {};
        results.forEach(([id, docs]) => { map[id] = docs; });
        setVersionDocs(map);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [versions]);

  return (
    <div className="space-y-4">
      {/* ── BPMN — version actuelle ── */}
      <div className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-5 py-3"
          style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            BPMN — Version actuelle
          </span>
          {!canEditDocs && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              Lecture seule
            </span>
          )}
        </div>
        {currentVersion ? (
          <DocumentSection
            versionId={currentVersion.id_version}
            readOnly={!canEditDocs}
            sectionIndex="▸"
            showBpmn={true}
            showPreuves={false}
            label="BPMN"
          />
        ) : (
          <div className="px-6 py-8 text-center text-[12px] text-slate-400">
            Aucune version disponible.
          </div>
        )}
      </div>

      {/* ── Preuves — version actuelle ── */}
      <div className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-5 py-3"
          style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Preuves — Version actuelle
          </span>
          {!canEditDocs && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              Lecture seule
            </span>
          )}
        </div>
        {currentVersion ? (
          <DocumentSection
            versionId={currentVersion.id_version}
            readOnly={!canEditDocs}
            sectionIndex="▸"
            showBpmn={false}
            showPreuves={true}
            label="Preuves"
          />
        ) : (
          <div className="px-6 py-8 text-center text-[12px] text-slate-400">
            Aucune version disponible.
          </div>
        )}
      </div>

      {/* ── Documents par version ── */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-[12px] text-slate-400">
          <Loader2 size={16} className="animate-spin mr-2" style={{ color: PURPLE }} /> Chargement…
        </div>
      ) : versions.length > 1 && (
        <div className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 px-5 py-3"
            style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              BPMN &amp; Preuves — Versions précédentes
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {versions.slice(1).map(v => {
              const docs = versionDocs[v.id_version] ?? [];
              const bpmn = docs.find(d => d.type_document === "BPMN");
              const preuves = docs.filter(d => d.type_document === "Preuve");
              return (
                <div key={v.id_version} className="px-5 py-4">
                  <p className="mb-2 text-[12px] font-bold text-slate-700">Version {v.numero_version}</p>
                  {docs.length === 0 ? (
                    <p className="text-[11.5px] italic text-slate-400">Aucun document.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {bpmn && (
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">BPMN</span>
                          <a href={bpmn.url} target="_blank" rel="noopener noreferrer"
                            className="truncate font-medium text-slate-600 hover:underline">{bpmn.nom_fichier}</a>
                        </div>
                      )}
                      {preuves.map(p => (
                        <div key={p.id_document} className="flex items-center gap-2 text-[12px]">
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">Preuve</span>
                          <a href={p.url} target="_blank" rel="noopener noreferrer"
                            className="truncate font-medium text-slate-600 hover:underline">{p.nom_fichier}</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DossierProcessusPage() {
  const { id: processusId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab,       setActiveTab]       = useState("fiche");
  const [processus,       setProcessus]       = useState(null);
  const [versions,        setVersions]        = useState([]);
  const [loadingProcessus, setLoadingProcessus] = useState(true);

  const userName  = `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() || user?.email || "Utilisateur";
  const userRole  = user?.roles?.[0] ?? "";
  const isPilote  = user?.roles?.some(r => ["Pilote", "pilote", "PILOTE"].includes(r));

  const refreshVersions = useCallback(() => {
    getFiches({ id_processus: processusId }).then(f => {
      setVersions((f ?? []).sort((a, b) => b.id_version - a.id_version));
    });
  }, [processusId]);

  useEffect(() => {
    async function load() {
      setLoadingProcessus(true);
      try {
        const [processusList, fiches] = await Promise.all([
          getProcessusList(),
          getFiches({ id_processus: processusId }),
        ]);
        setProcessus(processusList.find(p => String(p.id_processus) === String(processusId)) ?? null);
        setVersions((fiches ?? []).sort((a, b) => b.id_version - a.id_version));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProcessus(false);
      }
    }
    load();
  }, [processusId]);

  const currentVersion = versions[0] ?? null;
  const currentStatutCfg = STATUT_CONFIG[currentVersion?.statut] ?? null;

  return (
    <AppLayout pageTitle={processus?.nom ?? "Dossier processus"} userName={userName} userRole={userRole}>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="pb-12">
        {/* Back */}
        <div className="mb-4 flex items-center gap-1.5 text-[12px] text-slate-500">
          <button type="button" onClick={() => navigate(-1)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition hover:bg-slate-100 hover:text-slate-700">
            <ChevronLeft size={14} /> Retour
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-700">{processus?.nom ?? "Dossier processus"}</span>
        </div>

        {/* Info bar */}
        <div className="mb-3 rounded-xl bg-white px-6 py-4" style={{ border: `1px solid ${BORDER}` }}>
          {loadingProcessus ? (
            <div className="flex items-center gap-2 text-[12px] text-slate-400">
              <Loader2 size={14} className="animate-spin" style={{ color: PURPLE }} /> Chargement…
            </div>
          ) : (
            <div className="flex items-stretch" style={{ gap: 0 }}>
              <InfoItem label="Code processus">
                <span className="font-bold" style={{ color: PURPLE }}>{processus?.code_process ?? "—"}</span>
              </InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Intitulé">{processus?.nom ?? "—"}</InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Pilote affecté">
                {processus?.pilote_nom ? (
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: PURPLE }}>
                      {initials(processus.pilote_nom)}
                    </span>
                    {processus.pilote_nom}
                  </div>
                ) : "—"}
              </InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Département">{processus?.departement_nom ?? "—"}</InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Date création">{fmtDate(processus?.created_at)}</InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Version actuelle">
                <div className="flex items-center gap-2">
                  {currentVersion?.numero_version ? (
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white"
                      style={{ backgroundColor: PURPLE }}>
                      V{currentVersion.numero_version}
                    </span>
                  ) : (
                    <span className="text-[11px] italic text-slate-400">Pas encore publiée</span>
                  )}
                  {currentStatutCfg && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: currentStatutCfg.bg, color: currentStatutCfg.text }}>
                      {currentStatutCfg.label}
                    </span>
                  )}
                </div>
              </InfoItem>
            </div>
          )}
        </div>

        {/* Tab navbar */}
        <div style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-end gap-6 px-1">
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} type="button" onClick={() => setActiveTab(id)}
                  className="flex items-center gap-2 pb-3 pt-2 text-[13px] font-semibold transition"
                  style={{
                    color: active ? PURPLE : "#94A3B8",
                    borderBottom: active ? `3px solid ${PURPLE}` : "3px solid transparent",
                  }}>
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {activeTab === "fiche" && (
            <FicheTab
              processusId={processusId}
              processus={processus}
              user={user}
              onVersionCreated={refreshVersions}
            />
          )}
          {activeTab === "versions" && (
            <VersionsTab
              versions={versions}
              loading={loadingProcessus}
              processus={processus}
              onConsulterCurrent={() => setActiveTab("fiche")}
            />
          )}
          {activeTab === "audit" && (
            <AuditFicheTab versions={versions} currentVersion={currentVersion} />
          )}
          {activeTab === "pieces" && (
            <PiecesTab
              versions={versions}
              currentVersion={currentVersion}
              isPilote={isPilote}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
