import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  FileText,
  History,
  ClipboardCheck,
  Paperclip,
  Save,
  Loader2,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Lock,
  Download,
  Eye,
  AlertCircle,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import PipelineFiche from "../../components/fiche/PipelineFiche";
import InfoItem from "../../components/fiche/InfoItem";
import SectionBlock from "../../components/fiche/SectionBlock";
import DocumentSection from "../../components/fiche/DocumentSection";
import {
  PURPLE,
  PURPLE_HOVER,
  BORDER,
} from "../../components/fiche/ficheConstants";
import { useAuth } from "../../hooks/useAuth";
import { getProcessusList } from "../../api/processus.api";
import {
  getSectionTemplates,
  getChampTemplates,
  getFiches,
  createVersionFiche,
  updateVersionFiche,
  saveChampFiches,
  getChampsFiche,
} from "../../api/fiches.api";
import { getDocuments } from "../../api/documents.api";

const TABS = [
  { id: "fiche", label: "Fiche actuelle", Icon: FileText },
  { id: "versions", label: "Versions", Icon: History },
  { id: "audit", label: "Audit terrain", Icon: ClipboardCheck },
  { id: "pieces", label: "Pièces jointes", Icon: Paperclip },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const initials = (name) =>
  name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

const isFieldFilled = (val) => {
  if (val === null || val === undefined || val === "") return false;
  if (Array.isArray(val)) return val.length > 0;
  return true;
};

const calcCompletion = (sections, formValues) => {
  const allChamps = sections.flatMap((s) => s.champs);
  const total = allChamps.length;
  if (total === 0) return { pct: 0, filled: 0, total: 0 };
  const filled = allChamps.filter((c) =>
    isFieldFilled(formValues[c.id_champ_template]),
  ).length;
  return { pct: Math.round((filled / total) * 100), filled, total };
};

const verifColors = (pct) => {
  if (pct >= 75)
    return {
      bg: "#ECFDF5",
      border: "#6EE7B7",
      text: "#065F46",
      bar: "#10B981",
      barBg: "#D1FAE5",
    };
  if (pct >= 50)
    return {
      bg: "#FFFBEB",
      border: "#FCD34D",
      text: "#92400E",
      bar: "#F59E0B",
      barBg: "#FEF3C7",
    };
  return {
    bg: "#FEF2F2",
    border: "#FCA5A5",
    text: "#991B1B",
    bar: "#EF4444",
    barBg: "#FEE2E2",
  };
};

// ── Multi-process selector ───────────────────────────────────────────────────
function MultiProcessSelect({ label, value, onChange, options, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id) => {
    const num = Number(id);
    onChange(
      value.includes(num) ? value.filter((v) => v !== num) : [...value, num],
    );
  };

  const selected = options.filter((p) => value.includes(p.id_processus));

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
        className="min-h-[36px] flex flex-wrap gap-1.5 items-center rounded-lg px-2.5 py-1.5 cursor-pointer"
        style={{
          border: `1px solid ${BORDER}`,
          backgroundColor: disabled ? "#F9FAFB" : "#fff",
        }}
      >
        {selected.length === 0 && (
          <span className="text-[12.5px] text-slate-400">— Aucun —</span>
        )}
        {selected.map((p) => (
          <span
            key={p.id_processus}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: PURPLE }}
          >
            {p.code_process}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(p.id_processus);
                }}
                className="ml-0.5 opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <span className="ml-auto text-slate-400 text-[11px]">
            {open ? "▲" : "▼"}
          </span>
        )}
      </div>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl border bg-white shadow-lg"
          style={{ borderColor: BORDER, maxHeight: 220, overflowY: "auto" }}
        >
          {options.map((p) => {
            const checked = value.includes(p.id_processus);
            return (
              <label
                key={p.id_processus}
                className="flex items-center gap-3 px-3 py-2 text-[12.5px] cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p.id_processus)}
                  className="accent-purple-700"
                />
                <span className="font-semibold" style={{ color: PURPLE }}>
                  {p.code_process}
                </span>
                <span className="text-slate-500 truncate">{p.nom}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Notification banner ──────────────────────────────────────────────────────
function NotifBanner({ notif, onClose, overlayStyle }) {
  if (!notif) return null;
  const cfg = {
    success: {
      bg: "#ECFDF5",
      border: "#6EE7B7",
      text: "#065F46",
      Icon: CheckCircle2,
    },
    warning: {
      bg: "#FFFBEB",
      border: "#FCD34D",
      text: "#92400E",
      Icon: AlertTriangle,
    },
    error: { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", Icon: XCircle },
  }[notif.type] ?? {
    bg: "#EDE9FE",
    border: "#C4B5FD",
    text: "#4C1D95",
    Icon: CheckCircle2,
  };
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
      <div
        className="flex items-center gap-2 text-[13px] font-semibold"
        style={{ color: cfg.text }}
      >
        <Icon size={15} /> {notif.message}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded p-1 opacity-60 transition hover:opacity-100"
        style={{ color: cfg.text }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Verification panel ───────────────────────────────────────────────────────
function VerifPanel({ data, onClose, overlayStyle }) {
  if (!data) return null;
  const { pct, filled, total } = data;
  const c = verifColors(pct);
  const msg =
    pct >= 75
      ? "La fiche est bien remplie, vous pouvez la soumettre."
      : pct >= 50
        ? "La fiche est partiellement complète. Continuez à remplir avant de soumettre."
        : "La fiche nécessite encore beaucoup de travail avant soumission.";
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
            Vous avez rempli <span className="text-[15px]">{pct}%</span> de la
            fiche
            <span className="ml-2 text-[11px] font-normal opacity-70">
              ({filled} / {total} champs)
            </span>
          </p>
          <p
            className="mt-0.5 text-[11.5px]"
            style={{ color: c.text, opacity: 0.8 }}
          >
            {msg}
          </p>
          <div
            className="mt-2.5 h-2 w-full rounded-full"
            style={{ backgroundColor: c.barBg }}
          >
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: c.bar }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 shrink-0 rounded p-1 opacity-60 transition hover:opacity-100"
          style={{ color: c.text }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Fiche Tab ────────────────────────────────────────────────────────────────
function FicheTab({ processusId, processus, user, onVersionCreated }) {
  const [sections, setSections] = useState([]);
  const [processusList, setProcessusList] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [amontIds, setAmontIds] = useState([]);
  const [avalIds, setAvalIds] = useState([]);
  const [currentStatut, setCurrentStatut] = useState("Brouillon");
  const [versionNumero, setVersionNumero] = useState(null);
  const [existingVersionId, setExistingVersionId] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notif, setNotif] = useState(null);
  const [verifData, setVerifData] = useState(null);
  const notifTimer = useRef(null);
  const containerRef = useRef(null);
  const [overlayStyle, setOverlayStyle] = useState({});

  const isEdit = Boolean(existingVersionId);

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
            .filter((s) => s.est_actif !== false)
            .sort((a, b) => a.ordre - b.ordre)
            .map(async (s) => {
              const champs = await getChampTemplates(s.id_section_template);
              return {
                ...s,
                champs: champs
                  .filter((c) => c.est_actif !== false)
                  .sort((a, b) => a.ordre - b.ordre),
              };
            }),
        );
        setSections(sectionsWithChamps);
        setProcessusList(pl);

        if (fiches && fiches.length > 0) {
          const fiche = fiches.reduce((a, b) =>
            a.id_version > b.id_version ? a : b,
          );
          setExistingVersionId(fiche.id_version);
          setCurrentStatut(fiche.statut ?? "Brouillon");
          setVersionNumero(fiche.numero_version);
          setAmontIds(fiche.liaisons_amont ?? []);
          setAvalIds(fiche.liaisons_aval ?? []);
          setReadOnly(fiche.statut !== "Brouillon");

          const champsExistants = await getChampsFiche(fiche.id_version);
          const vals = {};
          champsExistants.forEach((c) => {
            vals[c.id_champ_template] =
              c.valeur_json !== null ? c.valeur_json : c.valeur;
          });
          setFormValues(vals);
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
    setFormValues((prev) => ({ ...prev, [champId]: value }));
  }, []);

  const handleSave = async (targetStatut) => {
    setSaving(true);
    setError(null);
    try {
      let versionId;
      if (!existingVersionId) {
        const fiche = await createVersionFiche({
          id_processus: Number(processusId),
          id_redacteur: user?.id_user,
          numero_version: "1.0",
          statut: targetStatut,
          amont_ids: amontIds,
          aval_ids: avalIds,
        });
        versionId = fiche.id_version;
        setExistingVersionId(fiche.id_version);
        onVersionCreated?.();
      } else {
        await updateVersionFiche(existingVersionId, {
          statut: targetStatut,
          amont_ids: amontIds,
          aval_ids: avalIds,
        });
        versionId = existingVersionId;
      }
      setCurrentStatut(targetStatut);

      const payload = sections.flatMap((s) =>
        s.champs.map((c) => {
          const val = formValues[c.id_champ_template];
          const isJson =
            Array.isArray(val) || (typeof val === "object" && val !== null);
          return {
            id_champ_template: c.id_champ_template,
            libelle: c.libelle,
            type_champ: c.type_champ,
            est_obligatoire: c.est_obligatoire,
            ordre: c.ordre,
            valeur: isJson ? null : val != null ? String(val) : null,
            valeur_json: isJson ? val : null,
          };
        }),
      );
      await saveChampFiches(versionId, payload);

      showNotif(
        "success",
        targetStatut === "Soumise"
          ? "Fiche soumise avec succès !"
          : "Brouillon enregistré avec succès !",
      );
    } catch (err) {
      setError("Une erreur est survenue lors de l'enregistrement.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifier = () => {
    setVerifData(calcCompletion(sections, formValues));
  };

  const selectCls =
    "w-full rounded-lg bg-white px-3 py-2 text-[12.5px] text-slate-700 outline-none transition";

  return (
    <div ref={containerRef}>
      <NotifBanner
        notif={notif}
        onClose={() => setNotif(null)}
        overlayStyle={overlayStyle}
      />
      <VerifPanel
        data={verifData}
        onClose={() => setVerifData(null)}
        overlayStyle={overlayStyle}
      />

      {/* Action bar */}
      <div className="mb-4 flex items-center justify-end gap-3">
        {readOnly && (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-semibold text-slate-500">
            <Lock size={10} /> Lecture seule
          </span>
        )}
        {error && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600">
            <AlertCircle size={13} /> {error}
          </div>
        )}
        {!readOnly && (
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => handleSave("Brouillon")}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: PURPLE,
              boxShadow: "0 4px 14px rgba(88,20,142,0.3)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = PURPLE_HOVER)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = PURPLE)
            }
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Enregistrer
          </button>
        )}
      </div>

      {/* Pipeline */}
      <div
        className="mb-4 rounded-xl bg-white px-8 py-5"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <PipelineFiche statut={currentStatut} />
      </div>

      {/* Form card */}
      <div
        className="overflow-hidden rounded-xl bg-white"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <div
          className="flex items-center justify-center px-6 py-3"
          style={{
            backgroundColor: PURPLE,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <span className="text-[12px] font-semibold text-white">
            Fiche Processus
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <Loader2
              size={26}
              className="animate-spin"
              style={{ color: PURPLE }}
            />
            <span className="text-[12px]">Chargement du formulaire…</span>
          </div>
        ) : (
          <div>
            {/* Section 0 — Liens processus */}
            <div style={{ borderTop: `1px solid ${BORDER}` }}>
              <div
                className="flex items-center gap-3 px-6 py-3"
                style={{
                  backgroundColor: "#F9FAFB",
                  borderBottom: `1px solid ${BORDER}`,
                }}
              >
                <span
                  className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
                  style={{ backgroundColor: PURPLE }}
                >
                  0
                </span>
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500">
                  Liens processus
                </span>
              </div>
              <div className="bg-white px-6">
                <div
                  className="py-4 grid items-start gap-5"
                  style={{ gridTemplateColumns: "200px 1fr" }}
                >
                  <div className="flex items-start gap-1 pt-0.5">
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: PURPLE }}
                    >
                      Processus en amont
                    </span>
                  </div>
                  <MultiProcessSelect
                    value={amontIds}
                    onChange={setAmontIds}
                    options={processusList.filter(
                      (p) => p.id_processus !== Number(processusId),
                    )}
                    disabled={readOnly}
                  />
                </div>
                <div
                  className="py-4 grid items-start gap-5"
                  style={{
                    gridTemplateColumns: "200px 1fr",
                    borderTop: `1px solid ${BORDER}`,
                  }}
                >
                  <div className="flex items-start gap-1 pt-0.5">
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: PURPLE }}
                    >
                      Processus en aval
                    </span>
                  </div>
                  <MultiProcessSelect
                    value={avalIds}
                    onChange={setAvalIds}
                    options={processusList.filter(
                      (p) => p.id_processus !== Number(processusId),
                    )}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>

            {/* Sections 1..N */}
            {sections.map((section, idx) => (
              <SectionBlock
                key={section.id_section_template}
                section={section}
                index={idx + 1}
                formValues={formValues}
                onChange={handleChange}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom action buttons */}
      {!readOnly && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleVerifier}
            className="rounded-xl px-6 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: "#fff",
              border: `1.5px solid ${PURPLE}`,
              color: PURPLE,
            }}
          >
            Vérifier avant soumettre
          </button>
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => handleSave("Soumise")}
            className="flex items-center gap-2 rounded-xl px-6 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: PURPLE }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = PURPLE_HOVER)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = PURPLE)
            }
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Soumettre la fiche
          </button>
        </div>
      )}
    </div>
  );
}

// ── Versions Tab ─────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const colors = {
    Brouillon: { bg: "#F1F5F9", text: "#64748B" },
    Soumise: { bg: "#FEF3C7", text: "#92400E" },
    Validée: { bg: "#D1FAE5", text: "#065F46" },
    Rejetée: { bg: "#FEE2E2", text: "#991B1B" },
  };
  const c = colors[statut] ?? { bg: "#F3F4F6", text: "#374151" };
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {statut ?? "—"}
    </span>
  );
}

function VersionsTab({ versions, loading, processus, onConsulterCurrent }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[12px] text-slate-400">
        <Loader2
          size={18}
          className="animate-spin mr-2"
          style={{ color: PURPLE }}
        />{" "}
        Chargement…
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div
        className="rounded-xl bg-white px-6 py-10 text-center text-[13px] text-slate-400"
        style={{ border: `1px solid ${BORDER}` }}
      >
        Aucune version publiée pour ce processus.
      </div>
    );
  }

  return (
    <div className="space-y-0 relative pl-12">
      {/* Vertical line on the left */}
      <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-slate-200" />

      {versions.map((version, idx) => {
        const isCurrent = idx === 0;
        return (
          <div
            key={version.id_version}
            className="relative flex items-start gap-4 pb-6"
          >
            {/* Circle */}
            <div
              className="absolute -left-[46px] top-0 shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 40,
                height: 40,
                backgroundColor: isCurrent ? PURPLE : "#fff",
                border: isCurrent ? "none" : "2px solid #CBD5E1",
                color: isCurrent ? "#fff" : "#94A3B8",
                fontWeight: "bold",
                fontSize: 12,
              }}
            >
              {isCurrent ? "✓" : idx + 1}
            </div>

            {/* Card */}
            <div
              className="flex-1 rounded-xl bg-white px-5 py-4"
              style={{
                border: `1px solid ${BORDER}`,
                borderLeft: isCurrent
                  ? `4px solid ${PURPLE}`
                  : `1px solid ${BORDER}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-slate-800">
                    Version {version.numero_version}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {version.date_creation
                      ? fmtDate(version.date_creation)
                      : version.created_at
                        ? fmtDate(version.created_at)
                        : "—"}
                  </p>
                  {processus?.pilote_nom && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilote : {processus.pilote_nom}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Statut badge */}
                  <StatutBadge statut={version.statut} />

                  {/* Buttons */}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold text-slate-500 transition hover:bg-slate-50"
                    style={{ borderColor: BORDER }}
                  >
                    <Download size={12} /> Télécharger
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isCurrent
                        ? onConsulterCurrent()
                        : navigate(
                            `/gestion-processus/fiches/${version.id_version}/modifier`,
                          )
                    }
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-white transition"
                    style={{ backgroundColor: PURPLE }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = PURPLE_HOVER)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = PURPLE)
                    }
                  >
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

// ── Pieces Tab ───────────────────────────────────────────────────────────────
function PiecesTab({ versions, currentVersion, isPilote, user }) {
  const [versionDocs, setVersionDocs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!versions.length) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.all(
          versions.map((v) =>
            getDocuments(v.id_version)
              .then((docs) => [v.id_version, docs])
              .catch(() => [v.id_version, []]),
          ),
        );
        const map = {};
        results.forEach(([id, docs]) => {
          map[id] = docs;
        });
        setVersionDocs(map);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [versions]);

  return (
    <div className="space-y-4">
      {/* Current version documents */}
      <div
        className="overflow-hidden rounded-xl bg-white"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <div
          className="flex items-center gap-3 px-5 py-3"
          style={{
            backgroundColor: "#F9FAFB",
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Documents — Version actuelle
          </span>
          {!isPilote && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              Lecture seule
            </span>
          )}
        </div>
        {currentVersion ? (
          <DocumentSection
            versionId={currentVersion.id_version}
            readOnly={!isPilote}
            sectionIndex="•"
          />
        ) : (
          <div className="px-6 py-8 text-center text-[12px] text-slate-400">
            Aucune version disponible pour ce processus.
          </div>
        )}
      </div>

      {/* Per-version docs list */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-[12px] text-slate-400">
          <Loader2
            size={16}
            className="animate-spin mr-2"
            style={{ color: PURPLE }}
          />{" "}
          Chargement des documents…
        </div>
      ) : (
        versions.length > 1 && (
          <div
            className="overflow-hidden rounded-xl bg-white"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{
                backgroundColor: "#F9FAFB",
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Documents par version
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {versions.slice(1).map((v) => {
                const docs = versionDocs[v.id_version] ?? [];
                const bpmn = docs.find((d) => d.type_document === "BPMN");
                const preuves = docs.filter(
                  (d) => d.type_document === "Preuve",
                );
                return (
                  <div key={v.id_version} className="px-5 py-4">
                    <p className="mb-2 text-[12px] font-bold text-slate-700">
                      Version {v.numero_version}
                    </p>
                    {docs.length === 0 ? (
                      <p className="text-[11.5px] italic text-slate-400">
                        Aucun document.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {bpmn && (
                          <div className="flex items-center gap-2 text-[12px]">
                            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
                              BPMN
                            </span>
                            <a
                              href={bpmn.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate font-medium text-slate-600 hover:underline"
                            >
                              {bpmn.nom_fichier}
                            </a>
                          </div>
                        )}
                        {preuves.map((p) => (
                          <div
                            key={p.id_document}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                              Preuve
                            </span>
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate font-medium text-slate-600 hover:underline"
                            >
                              {p.nom_fichier}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function DossierProcessusPage() {
  const { id: processusId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("fiche");
  const [processus, setProcessus] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loadingProcessus, setLoadingProcessus] = useState(true);

  const userName =
    `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() ||
    user?.email ||
    "Utilisateur";
  const userRole = user?.roles?.[0] ?? "";
  const isPilote = user?.roles?.some((r) =>
    ["Pilote", "pilote", "PILOTE"].includes(r),
  );

  useEffect(() => {
    async function load() {
      setLoadingProcessus(true);
      try {
        const [processusList, fiches] = await Promise.all([
          getProcessusList(),
          getFiches({ id_processus: processusId }),
        ]);
        const found = processusList.find(
          (p) => String(p.id_processus) === String(processusId),
        );
        setProcessus(found ?? null);
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

  return (
    <AppLayout
      pageTitle={processus?.nom ?? "Dossier processus"}
      userName={userName}
      userRole={userRole}
    >
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="pb-12">
        {/* Back button */}
        <div className="mb-4 flex items-center gap-1.5 text-[12px] text-slate-500">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronLeft size={14} /> Retour
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-700">
            {processus?.nom ?? "Dossier processus"}
          </span>
        </div>

        {/* Info bar */}
        <div
          className="mb-3 rounded-xl bg-white px-6 py-4"
          style={{ border: `1px solid ${BORDER}` }}
        >
          {loadingProcessus ? (
            <div className="flex items-center gap-2 text-[12px] text-slate-400">
              <Loader2
                size={14}
                className="animate-spin"
                style={{ color: PURPLE }}
              />{" "}
              Chargement…
            </div>
          ) : (
            <div className="flex items-stretch" style={{ gap: 0 }}>
              <InfoItem label="Code processus">
                <span className="font-bold" style={{ color: PURPLE }}>
                  {processus?.code_process ?? "—"}
                </span>
              </InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Intitulé">{processus?.nom ?? "—"}</InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Pilote affecté">
                {processus?.pilote_nom ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: PURPLE }}
                    >
                      {initials(processus.pilote_nom)}
                    </span>
                    {processus.pilote_nom}
                  </div>
                ) : (
                  "—"
                )}
              </InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Département">
                {processus?.departement_nom ?? "—"}
              </InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Date création">
                {fmtDate(processus?.created_at)}
              </InfoItem>
              <div style={{ width: 1, backgroundColor: BORDER }} />
              <InfoItem label="Version actuelle">
                {currentVersion?.numero_version ? (
                  <span
                    className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white"
                    style={{ backgroundColor: PURPLE }}
                  >
                    V{currentVersion.numero_version}
                  </span>
                ) : (
                  <span className="text-[11px] italic text-slate-400">
                    Pas encore publiée
                  </span>
                )}
              </InfoItem>
            </div>
          )}
        </div>

        {/* Tab navbar */}
        <div className="mb-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-end gap-6 px-1">
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-2 pb-3 pt-2 text-[13px] font-semibold transition"
                  style={{
                    color: active ? PURPLE : "#94A3B8",
                    borderBottom: active
                      ? `3px solid ${PURPLE}`
                      : "3px solid transparent",
                  }}
                >
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
              onVersionCreated={() => {
                getFiches({ id_processus: processusId }).then((f) => {
                  setVersions(
                    (f ?? []).sort((a, b) => b.id_version - a.id_version),
                  );
                });
              }}
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
            <div
              className="rounded-xl bg-white px-6 py-10 text-center text-[13px] text-slate-400"
              style={{ border: `1px solid ${BORDER}` }}
            >
              Module audit terrain — à venir.
            </div>
          )}
          {activeTab === "pieces" && (
            <PiecesTab
              versions={versions}
              currentVersion={currentVersion}
              isPilote={isPilote}
              user={user}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
