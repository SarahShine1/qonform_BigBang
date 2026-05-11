import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ChevronLeft, Save, Loader2, AlertCircle, Send,
  CheckCircle2, AlertTriangle, XCircle, X, Lock,
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
  createVersionFiche, updateVersionFiche, saveChampFiches,
  getVersionFiche, getChampsFiche,
} from "../../api/fiches.api";

// ── Multi-process selector ───────────────────────────────────────────────────
function MultiProcessSelect({ label, value, onChange, options, disabled }) {
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
        {selected.length === 0 && (
          <span className="text-[12.5px] text-slate-400">— Aucun —</span>
        )}
        {selected.map((p) => (
          <span key={p.id_processus}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: PURPLE }}>
            {p.code_process}
            {!disabled && (
              <button type="button" onClick={(e) => { e.stopPropagation(); toggle(p.id_processus); }}
                className="ml-0.5 opacity-70 hover:opacity-100">✕</button>
            )}
          </span>
        ))}
        {!disabled && (
          <span className="ml-auto text-slate-400 text-[11px]">{open ? "▲" : "▼"}</span>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-white shadow-lg"
          style={{ borderColor: BORDER, maxHeight: 220, overflowY: "auto" }}>
          {options.map((p) => {
            const checked = value.includes(p.id_processus);
            return (
              <label key={p.id_processus}
                className="flex items-center gap-3 px-3 py-2 text-[12.5px] cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={checked} onChange={() => toggle(p.id_processus)}
                  className="accent-purple-700" />
                <span className="font-semibold" style={{ color: PURPLE }}>{p.code_process}</span>
                <span className="text-slate-500 truncate">{p.nom}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const initials = (name) =>
  name ? name.trim().split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2) : "?";

const isFieldFilled = (val) => {
  if (val === null || val === undefined || val === "") return false;
  if (Array.isArray(val)) return val.length > 0;
  return true;
};

// ── calcul du pourcentage de complétion ──────────────────────────────────────
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
  return       { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", bar: "#EF4444", barBg: "#FEE2E2" };
};

// ── composant bannière de notif ──────────────────────────────────────────────
function NotifBanner({ notif, onClose, overlayStyle }) {
  if (!notif) return null;
  const cfg = {
    success: { bg: "#ECFDF5", border: "#6EE7B7", text: "#065F46", Icon: CheckCircle2 },
    warning: { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", Icon: AlertTriangle },
    error:   { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", Icon: XCircle      },
  }[notif.type] ?? { bg: "#EDE9FE", border: "#C4B5FD", text: "#4C1D95", Icon: CheckCircle2 };
  const { Icon } = cfg;
  return (
    <div
      className="fixed flex items-center justify-between gap-4 rounded-xl px-5 py-3 shadow-lg"
      style={{
        ...overlayStyle,
        top: "1rem",
        zIndex: 9999,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
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

// ── composant panneau de vérification ───────────────────────────────────────
function VerifPanel({ data, onClose, overlayStyle }) {
  if (!data) return null;
  const { pct, filled, total } = data;
  const c = verifColors(pct);
  const msg =
    pct >= 75 ? "La fiche est bien remplie, vous pouvez la soumettre." :
    pct >= 50 ? "La fiche est partiellement complète. Continuez à remplir avant de soumettre." :
                "La fiche nécessite encore beaucoup de travail avant soumission.";
  return (
    <div
      className="fixed rounded-xl px-5 py-4 shadow-lg"
      style={{
        ...overlayStyle,
        top: "1rem",
        zIndex: 9999,
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[13px] font-bold" style={{ color: c.text }}>
            Vous avez rempli <span className="text-[15px]">{pct}%</span> de la fiche
            <span className="ml-2 text-[11px] font-normal opacity-70">({filled} / {total} champs)</span>
          </p>
          <p className="mt-0.5 text-[11.5px]" style={{ color: c.text, opacity: 0.8 }}>{msg}</p>
          <div className="mt-2.5 h-2 w-full rounded-full" style={{ backgroundColor: c.barBg }}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: c.bar }} />
          </div>
        </div>
        <button type="button" onClick={onClose}
          className="mt-0.5 shrink-0 rounded p-1 opacity-60 transition hover:opacity-100"
          style={{ color: c.text }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function FicheProcessusForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const processusFromQuery = searchParams.get("processus") ?? "";

  const [sections,             setSections]           = useState([]);
  const [processusList,        setProcessusList]      = useState([]);
  const [selectedProcessusId,  setSelectedProcessusId] = useState("");
  const [formValues,           setFormValues]         = useState({});
  const [amontIds,             setAmontIds]           = useState([]);
  const [avalIds,              setAvalIds]            = useState([]);
  const [currentStatut,        setCurrentStatut]      = useState("Brouillon");
  const [versionNumero,        setVersionNumero]      = useState(null);
  const [existingVersionId,    setExistingVersionId]  = useState(null);
  const [readOnly,             setReadOnly]           = useState(false);
  const [loading,              setLoading]            = useState(true);
  const [checkingFiche,        setCheckingFiche]      = useState(false);
  const [saving,               setSaving]             = useState(false);
  const [error,                setError]              = useState(null);
  const [notif,                setNotif]              = useState(null);
  const [verifData,            setVerifData]          = useState(null);
  const notifTimer   = useRef(null);
  const containerRef = useRef(null);
  const [overlayStyle, setOverlayStyle] = useState({});

  const isUrlEdit = Boolean(id);
  const isEdit    = isUrlEdit || Boolean(existingVersionId);
  const userName  = `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() || user?.email || "Utilisateur";
  const userRole  = user?.roles?.[0] ?? "";
  const selectedProcessus = processusList.find((p) => p.id_processus === Number(selectedProcessusId)) ?? null;

  // suit la position/largeur du conteneur pour les popups fixes
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

  // ── Chargement initial (sections + processus + URL edit mode) ─────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [rawSections, processus] = await Promise.all([
          getSectionTemplates(),
          getProcessusList(),
        ]);
        const sectionsWithChamps = await Promise.all(
          rawSections
            .filter((s) => s.est_actif !== false)
            .sort((a, b) => a.ordre - b.ordre)
            .map(async (s) => {
              const champs = await getChampTemplates(s.id_section_template);
              return {
                ...s,
                champs: champs.filter((c) => c.est_actif !== false).sort((a, b) => a.ordre - b.ordre),
              };
            })
        );
        setSections(sectionsWithChamps);
        setProcessusList(processus);

        if (!isUrlEdit && processusFromQuery) {
          setSelectedProcessusId(processusFromQuery);
        }

        if (isUrlEdit) {
          const [fiche, champsExistants] = await Promise.all([
            getVersionFiche(id),
            getChampsFiche(id),
          ]);
          setSelectedProcessusId(String(fiche.id_processus));
          setCurrentStatut(fiche.statut ?? "Brouillon");
          setVersionNumero(fiche.numero_version);
          setAmontIds(fiche.liaisons_amont ?? []);
          setAvalIds(fiche.liaisons_aval   ?? []);
          setReadOnly(fiche.statut !== "Brouillon");
          const vals = {};
          champsExistants.forEach((c) => {
            vals[c.id_champ_template] = c.valeur_json !== null ? c.valeur_json : c.valeur;
          });
          setFormValues(vals);
        }
      } catch (err) {
        setError("Impossible de charger le formulaire.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isUrlEdit, processusFromQuery]);

  // ── Auto-détection fiche existante au changement de processus ─────────────
  useEffect(() => {
    if (isUrlEdit) return; // URL edit mode gère ça lui-même

    if (!selectedProcessusId) {
      setExistingVersionId(null);
      setReadOnly(false);
      setFormValues({});
      setAmontIds([]);
      setAvalIds([]);
      setCurrentStatut("Brouillon");
      setVersionNumero(null);
      setVerifData(null);
      return;
    }

    let cancelled = false;
    async function checkExisting() {
      setCheckingFiche(true);
      try {
        const fiches = await getFiches({ id_processus: selectedProcessusId });
        if (cancelled) return;

        if (!fiches || fiches.length === 0) {
          setExistingVersionId(null);
          setReadOnly(false);
          setFormValues({});
          setAmontIds([]);
          setAvalIds([]);
          setCurrentStatut("Brouillon");
          setVersionNumero(null);
          return;
        }

        // prend la fiche la plus récente
        const fiche = fiches.reduce((a, b) => (a.id_version > b.id_version ? a : b));
        setExistingVersionId(fiche.id_version);
        setCurrentStatut(fiche.statut ?? "Brouillon");
        setVersionNumero(fiche.numero_version);
        setAmontIds(fiche.liaisons_amont ?? []);
        setAvalIds(fiche.liaisons_aval   ?? []);

        const champsExistants = await getChampsFiche(fiche.id_version);
        if (cancelled) return;

        const vals = {};
        champsExistants.forEach((c) => {
          vals[c.id_champ_template] = c.valeur_json !== null ? c.valeur_json : c.valeur;
        });
        setFormValues(vals);
        setReadOnly(fiche.statut !== "Brouillon");
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setCheckingFiche(false);
      }
    }

    checkExisting();
    return () => { cancelled = true; };
  }, [selectedProcessusId, isUrlEdit]);

  const handleChange = useCallback((champId, value) => {
    setFormValues((prev) => ({ ...prev, [champId]: value }));
  }, []);

  const resetForm = () => {
    if (!isUrlEdit) {
      if (!processusFromQuery) setSelectedProcessusId("");
      setExistingVersionId(null);
      setReadOnly(false);
    }
    setFormValues({});
    setAmontIds([]);
    setAvalIds([]);
    setCurrentStatut("Brouillon");
    setVersionNumero(null);
    setVerifData(null);
  };

  // ── Sauvegarde ─────────────────────────────────────────────────────────────
  const handleSave = async (targetStatut) => {
    if (!selectedProcessusId) { setError("Veuillez sélectionner un processus."); return; }
    setSaving(true);
    setError(null);
    try {
      const versionIdToUpdate = id ?? existingVersionId;
      let versionId;

      if (!versionIdToUpdate) {
        const fiche = await createVersionFiche({
          id_processus:   Number(selectedProcessusId),
          id_redacteur:   user?.id_user,
          numero_version: "1.0",
          statut:         targetStatut,
          amont_ids:      amontIds,
          aval_ids:       avalIds,
        });
        versionId = fiche.id_version;
        if (!isUrlEdit) setExistingVersionId(fiche.id_version);
      } else {
        await updateVersionFiche(versionIdToUpdate, {
          statut:    targetStatut,
          amont_ids: amontIds,
          aval_ids:  avalIds,
        });
        versionId = versionIdToUpdate;
      }
      setCurrentStatut(targetStatut);

      const payload = sections.flatMap((s) =>
        s.champs.map((c) => {
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

      showNotif(
        "success",
        targetStatut === "Soumise"
          ? "Fiche soumise avec succès !"
          : "Brouillon enregistré avec succès !"
      );
      resetForm();
    } catch (err) {
      setError("Une erreur est survenue lors de l'enregistrement.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); handleSave("Brouillon"); };

  const handleVerifier = () => {
    setVerifData(calcCompletion(sections, formValues));
  };

  const selectCls = "w-full rounded-lg bg-white px-3 py-2 text-[12.5px] text-slate-700 outline-none transition";
  const inputCls  = "w-full rounded-lg bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:ring-1 focus:ring-[#58148E]/20";

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <AppLayout pageTitle="Gestion des processus" userName={userName} userRole={userRole}>
      <div ref={containerRef} style={{ fontFamily: "'DM Sans', sans-serif" }} className="pb-12">
        {/* Popups fixes — positionnées par rapport au conteneur */}
        <NotifBanner notif={notif} onClose={() => setNotif(null)} overlayStyle={overlayStyle} />
        <VerifPanel data={verifData} onClose={() => setVerifData(null)} overlayStyle={overlayStyle} />

        <form onSubmit={handleSubmit}>

          {/* ── Barre d'action ── */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <button type="button" onClick={() => navigate(-1)}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition hover:bg-slate-100 hover:text-slate-700">
                <ChevronLeft size={14} /> Retour
              </button>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-700">
                {isUrlEdit ? "Modifier la fiche" : "Nouvelle fiche"}
              </span>
              {readOnly && (
                <span className="ml-2 flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-semibold text-slate-500">
                  <Lock size={10} /> Lecture seule
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {error && (
                <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              {!readOnly && (
                <button type="submit" disabled={saving || loading || checkingFiche}
                  className="flex items-center gap-2 rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: PURPLE, boxShadow: "0 4px 14px rgba(88,20,142,0.3)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PURPLE_HOVER)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PURPLE)}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Enregistrer
                </button>
              )}
            </div>
          </div>

          {/* ── Sélecteur de processus — caché si pré-sélectionné depuis l'URL ── */}
          {!processusFromQuery && !isUrlEdit && (
            <div className="mb-3 flex items-center gap-4 rounded-xl bg-white px-5 py-3"
              style={{ border: `1px solid ${BORDER}` }}>
              <label className="shrink-0 text-[12px] font-semibold" style={{ color: PURPLE }}>
                Processus concerné
              </label>
              <select value={selectedProcessusId} onChange={(e) => setSelectedProcessusId(e.target.value)}
                disabled={loading}
                className={selectCls} style={{ border: `1px solid ${BORDER}` }}>
                <option value="">-- Sélectionner un processus --</option>
                {processusList.map((p) => (
                  <option key={p.id_processus} value={p.id_processus}>
                    {p.code_process} — {p.nom}
                  </option>
                ))}
              </select>
              {checkingFiche && (
                <Loader2 size={14} className="animate-spin shrink-0" style={{ color: PURPLE }} />
              )}
            </div>
          )}

          {/* ── Bandeau d'infos processus ── */}
          <div className="mb-3 rounded-xl bg-white px-6 py-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-stretch" style={{ gap: 0 }}>
              <InfoItem label="Code processus">
                <span className="font-bold" style={{ color: PURPLE }}>
                  {selectedProcessus?.code_process ?? "—"}
                </span>
              </InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Intitulé">{selectedProcessus?.nom ?? "—"}</InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Pilote affecté">
                {selectedProcessus?.pilote_nom ? (
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: PURPLE }}>
                      {initials(selectedProcessus.pilote_nom)}
                    </span>
                    {selectedProcessus.pilote_nom}
                  </div>
                ) : "—"}
              </InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Département">{selectedProcessus?.departement_nom ?? "—"}</InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Date création">{fmtDate(selectedProcessus?.created_at)}</InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Version actuelle">
                {isEdit && versionNumero
                  ? <span className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white"
                      style={{ backgroundColor: PURPLE }}>V{versionNumero}</span>
                  : <span className="text-[11px] italic text-slate-400">Pas encore publiée</span>}
              </InfoItem>
            </div>
          </div>

          {/* ── Pipeline statut ── */}
          <div className="mb-4 rounded-xl bg-white px-8 py-5" style={{ border: `1px solid ${BORDER}` }}>
            <PipelineFiche statut={currentStatut} />
          </div>

          {/* ── Fiche card ── */}
          <div className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-center px-6 py-3"
              style={{ backgroundColor: PURPLE, borderBottom: `1px solid ${BORDER}` }}>
              <span className="text-[12px] font-semibold text-white">Fiche Processus</span>
            </div>

            {(loading || checkingFiche) && (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                <Loader2 size={26} className="animate-spin" style={{ color: PURPLE }} />
                <span className="text-[12px]">
                  {checkingFiche ? "Vérification de la fiche existante…" : "Chargement du formulaire…"}
                </span>
              </div>
            )}

            {!loading && !checkingFiche && (
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
                    <div className="py-4 grid items-start gap-5"
                      style={{ gridTemplateColumns: "200px 1fr" }}>
                      <div className="flex items-start gap-1 pt-0.5">
                        <span className="text-[12px] font-semibold" style={{ color: PURPLE }}>
                          Processus en amont
                        </span>
                      </div>
                      <MultiProcessSelect
                        value={amontIds}
                        onChange={setAmontIds}
                        options={processusList.filter((p) => p.id_processus !== Number(selectedProcessusId))}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="py-4 grid items-start gap-5"
                      style={{ gridTemplateColumns: "200px 1fr", borderTop: `1px solid ${BORDER}` }}>
                      <div className="flex items-start gap-1 pt-0.5">
                        <span className="text-[12px] font-semibold" style={{ color: PURPLE }}>
                          Processus en aval
                        </span>
                      </div>
                      <MultiProcessSelect
                        value={avalIds}
                        onChange={setAvalIds}
                        options={processusList.filter((p) => p.id_processus !== Number(selectedProcessusId))}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                </div>

                {/* Sections 1..N */}
                {sections.length === 0
                  ? <div className="py-16 text-center text-[13px] text-slate-400">Aucune section trouvée.</div>
                  : sections.map((section, idx) => (
                      <SectionBlock
                        key={section.id_section_template}
                        section={section}
                        index={idx + 1}
                        formValues={formValues}
                        onChange={handleChange}
                        readOnly={readOnly}
                      />
                    ))
                }

                {/* Section Documents & Fichiers — toujours présente */}
                <DocumentSection
                  versionId={id ? Number(id) : existingVersionId}
                  readOnly={readOnly}
                  sectionIndex={sections.length + 1}
                />
              </div>
            )}
          </div>

          {/* ── Boutons d'action bas ── */}
          {!readOnly && (
            <div className="mt-4 flex items-center justify-end gap-3">
              <button type="button" disabled={saving || loading}
                onClick={handleVerifier}
                className="rounded-xl px-6 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "#fff", border: `1.5px solid ${PURPLE}`, color: PURPLE }}>
                Vérifier avant soumettre
              </button>
              <button type="button" disabled={saving || loading} onClick={() => handleSave("Soumise")}
                className="flex items-center gap-2 rounded-xl px-6 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: PURPLE }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PURPLE_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PURPLE)}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Soumettre la fiche
              </button>
            </div>
          )}

        </form>
      </div>
    </AppLayout>
  );
}
