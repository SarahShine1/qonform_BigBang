import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, Save, Plus, Trash2, Loader2, AlertCircle, Send,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import PipelineFiche from "../../components/fiche/PipelineFiche";
import { useAuth } from "../../hooks/useAuth";
import { getProcessusList } from "../../api/processus.api";
import {
  getSectionTemplates, getChampTemplates,
  createVersionFiche, updateVersionFiche, saveChampFiches,
  getVersionFiche, getChampsFiche,
} from "../../api/fiches.api";

const PURPLE      = "#58148E";
const PURPLE_HOVER = "#45107A";
const PURPLE_LIGHT = "#EDE9FE";
const BORDER      = "#D1D5DB";

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const initials = (name) =>
  name ? name.trim().split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2) : "?";

const normalizeOpt = (opt) =>
  typeof opt === "object" && opt !== null
    ? { value: String(opt.valeur ?? opt.value ?? opt.id ?? ""), label: String(opt.libelle ?? opt.label ?? opt.nom ?? "") }
    : { value: String(opt), label: String(opt) };

// handles both {key,label} and {id,libelle} column formats; idx prevents duplicate keys
const normalizeCol = (col, idx = 0) =>
  typeof col === "object" && col !== null
    ? {
        key:         String(col.key ?? col.id ?? col.nom ?? idx),
        label:       String(col.label ?? col.libelle ?? col.nom ?? col.key ?? col.id ?? ""),
        placeholder: col.placeholder ?? "",
      }
    : { key: String(col), label: String(col), placeholder: "" };

// ── InfoItem ───────────────────────────────────────────────────────────────
function InfoItem({ label, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-5 first:pl-0 last:pr-0">
      <span className="text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div className="text-[12.5px] font-semibold text-slate-800">{children}</div>
    </div>
  );
}

// ── TableField ─────────────────────────────────────────────────────────────
function TableField({ columns = [], value = [], onChange }) {
  const cols = columns.map(normalizeCol);

  const emptyRow = () => Object.fromEntries(cols.map(({ key }) => [key, ""]));
  const rows = value.length ? value : [emptyRow()];

  const updateCell = (ri, key, val) =>
    onChange(rows.map((r, i) => (i === ri ? { ...r, [key]: val } : r)));
  const addRow    = () => onChange([...rows, emptyRow()]);
  const removeRow = (ri) => onChange(rows.length > 1 ? rows.filter((_, i) => i !== ri) : rows);

  return (
    <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ backgroundColor: PURPLE_LIGHT }}>
            {cols.map(({ key, label }) => (
              <th
                key={key}
                className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: PURPLE }}
              >
                {label}
              </th>
            ))}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderTop: `1px solid ${BORDER}` }}>
              {cols.map(({ key, placeholder }) => (
                <td key={key} className="px-3 py-1.5" style={{ borderRight: `1px solid ${BORDER}` }}>
                  <input
                    type="text"
                    value={row[key] ?? ""}
                    onChange={(e) => updateCell(ri, key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded bg-transparent px-1.5 py-1 text-[12px] text-slate-700 placeholder:text-slate-300 outline-none focus:bg-white"
                  />
                </td>
              ))}
              <td className="pr-2 text-center">
                <button type="button" onClick={() => removeRow(ri)}
                  className="rounded p-1 text-slate-300 transition hover:text-red-400">
                  <Trash2 size={11} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button type="button" onClick={addRow}
          className="flex items-center gap-1.5 text-[11px] font-semibold transition"
          style={{ color: PURPLE }}>
          <Plus size={12} /> Ajouter une ligne
        </button>
      </div>
    </div>
  );
}

// ── FieldInput ─────────────────────────────────────────────────────────────
function FieldInput({ champ, value, onChange }) {
  const { type_champ, configuration: rawConf, placeholder } = champ;
  // null-safe: destructuring default {} only fires for undefined, not null
  const configuration = (rawConf !== null && rawConf !== undefined) ? rawConf : {};
  const inputCls = "w-full rounded-lg bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-300 outline-none transition focus:ring-1 focus:ring-[#58148E]/20";
  const inputStyle = { border: `1px solid ${BORDER}` };

  switch (type_champ) {
    case "text":
      return (configuration.multiline || configuration.multiligne)
        ? <textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? ""} className={`${inputCls} resize-y`} style={inputStyle} />
        : <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? ""} className={inputCls} style={inputStyle} />;

    case "nombre":
      return <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
               placeholder={placeholder ?? ""} className={inputCls} style={inputStyle} />;

    case "date":
      return <input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
               className={inputCls} style={inputStyle} />;

    case "booleen":
      return (
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={value === "true" || value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded" style={{ accentColor: PURPLE }} />
          <span className="text-[13px] text-slate-600">{configuration.label ?? "Oui"}</span>
        </label>
      );

    case "checklist": {
      const opts = (configuration.options ?? []).map(normalizeOpt);
      const selected = Array.isArray(value) ? value : [];
      const toggle = (v) => onChange(selected.includes(v) ? selected.filter((o) => o !== v) : [...selected, v]);
      return (
        <div className="flex flex-wrap gap-2">
          {opts.map(({ value: v, label }) => (
            <button key={v} type="button" onClick={() => toggle(v)}
              className="rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition"
              style={selected.includes(v)
                ? { backgroundColor: PURPLE, borderColor: PURPLE, color: "#fff" }
                : { backgroundColor: "#fff", borderColor: BORDER, color: "#475569" }}>
              {label}
            </button>
          ))}
        </div>
      );
    }

    case "liste": {
      const opts = (configuration.options ?? []).map(normalizeOpt);
      return (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          className={inputCls} style={inputStyle}>
          <option value="">-- Sélectionner --</option>
          {opts.map(({ value: v, label }) => <option key={v} value={v}>{label}</option>)}
        </select>
      );
    }

    case "tableau": {
      // eslint-disable-next-line no-console
      console.log("[DEBUG tableau]", champ.libelle, "configuration=", JSON.stringify(configuration));
      const rawCols =
        configuration.columns ?? configuration.colonnes ??
        configuration.cols   ?? configuration.champs   ?? [];
      const cols = rawCols.map(normalizeCol);
      console.log("[DEBUG tableau]", champ.libelle, "cols after normalize=", cols);
      return <TableField columns={cols} value={Array.isArray(value) ? value : []} onChange={onChange} />;
    }

    default:
      return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
               placeholder={placeholder ?? ""} className={inputCls} style={inputStyle} />;
  }
}

// ── FieldRow ───────────────────────────────────────────────────────────────
function FieldRow({ champ, value, onChange }) {
  const isWide = champ.type_champ === "tableau" || champ.configuration?.multiline || champ.configuration?.multiligne;
  return (
    <div className={["py-4", isWide ? "space-y-2" : "grid items-start gap-5"].join(" ")}
      style={!isWide ? { gridTemplateColumns: "200px 1fr" } : undefined}>
      <div className="flex items-start gap-1 pt-0.5">
        <span className="text-[12px] font-semibold" style={{ color: PURPLE }}>{champ.libelle}</span>
        {champ.est_obligatoire && <span className="text-[10px] text-red-400 mt-0.5">*</span>}
      </div>
      <div>
        <FieldInput champ={champ} value={value} onChange={onChange} />
        {champ.aide && <p className="mt-1.5 text-[11px] text-slate-400">{champ.aide}</p>}
      </div>
    </div>
  );
}

// ── SectionBlock ───────────────────────────────────────────────────────────
function SectionBlock({ section, index, formValues, onChange }) {
  return (
    <div style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-3 px-6 py-3"
        style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
        <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
          style={{ backgroundColor: PURPLE }}>
          {index + 1}
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500">
          {section.nom}
        </span>
      </div>
      <div className="bg-white px-6">
        {section.champs.map((champ, i) => (
          <div key={champ.id_champ_template} style={i > 0 ? { borderTop: `1px solid ${BORDER}` } : {}}>
            <FieldRow champ={champ} value={formValues[champ.id_champ_template]}
              onChange={(val) => onChange(champ.id_champ_template, val)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function FicheProcessusForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sections,           setSections]           = useState([]);
  const [processusList,      setProcessusList]      = useState([]);
  const [selectedProcessusId, setSelectedProcessusId] = useState("");
  const [formValues,         setFormValues]         = useState({});
  const [amontId,            setAmontId]            = useState("");
  const [avalId,             setAvalId]             = useState("");
  const [currentStatut,      setCurrentStatut]      = useState("Brouillon");
  const [versionNumero,      setVersionNumero]      = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [saving,             setSaving]             = useState(false);
  const [error,              setError]              = useState(null);

  const isEdit = Boolean(id);
  const userName = `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] ?? "";

  const selectedProcessus = processusList.find(
    (p) => p.id_processus === Number(selectedProcessusId)
  ) ?? null;

  // ── Load ─────────────────────────────────────────────────────────────────
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
              return { ...s, champs: champs.filter((c) => c.est_actif !== false).sort((a, b) => a.ordre - b.ordre) };
            })
        );

        setSections(sectionsWithChamps);
        setProcessusList(processus);

        if (isEdit) {
          const [fiche, champsExistants] = await Promise.all([
            getVersionFiche(id),
            getChampsFiche(id),
          ]);
          setSelectedProcessusId(String(fiche.id_processus));
          setCurrentStatut(fiche.statut ?? "Brouillon");
          setVersionNumero(fiche.numero_version);
          setAmontId(fiche.id_processus_amont ? String(fiche.id_processus_amont) : "");
          setAvalId(fiche.id_processus_aval   ? String(fiche.id_processus_aval)  : "");
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
  }, [id, isEdit]);

  const handleChange = useCallback((champId, value) => {
    setFormValues((prev) => ({ ...prev, [champId]: value }));
  }, []);

  // ── Save (shared by Enregistrer + Soumettre) ─────────────────────────────
  const handleSave = async (targetStatut) => {
    if (!selectedProcessusId) { setError("Veuillez sélectionner un processus."); return; }
    setSaving(true);
    setError(null);
    try {
      let versionId = id;
      if (!isEdit) {
        const fiche = await createVersionFiche({
          id_processus:       Number(selectedProcessusId),
          id_redacteur:       user?.id_user,
          numero_version:     "1.0",
          statut:             targetStatut,
          id_processus_amont: amontId ? Number(amontId) : null,
          id_processus_aval:  avalId  ? Number(avalId)  : null,
        });
        versionId = fiche.id_version;
      } else {
        await updateVersionFiche(id, {
          statut:             targetStatut,
          id_processus_amont: amontId ? Number(amontId) : null,
          id_processus_aval:  avalId  ? Number(avalId)  : null,
        });
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
      navigate("/gestion-processus/fiches");
    } catch (err) {
      setError("Une erreur est survenue lors de l'enregistrement.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); handleSave("Brouillon"); };

  const selectCls = "w-full rounded-lg bg-white px-3 py-2 text-[12.5px] text-slate-700 outline-none transition";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout pageTitle="Gestion des processus" userName={userName} userRole={userRole}>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="pb-12">
        <form onSubmit={handleSubmit}>

          {/* ── Action bar ── */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <button type="button" onClick={() => navigate(-1)}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition hover:bg-slate-100 hover:text-slate-700">
                <ChevronLeft size={14} /> Retour
              </button>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-700">
                {isEdit ? "Modifier la fiche" : "Nouvelle fiche"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {error && (
                <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              <button type="submit" disabled={saving || loading}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: PURPLE, boxShadow: "0 4px 14px rgba(88,20,142,0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PURPLE_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PURPLE)}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Enregistrer
              </button>
            </div>
          </div>

          {/* ── Processus selector ── */}
          <div className="mb-3 flex items-center gap-4 rounded-xl bg-white px-5 py-3"
            style={{ border: `1px solid ${BORDER}` }}>
            <label className="shrink-0 text-[12px] font-semibold" style={{ color: PURPLE }}>
              Processus concerné
            </label>
            <select value={selectedProcessusId} onChange={(e) => setSelectedProcessusId(e.target.value)}
              disabled={isEdit || loading}
              className={selectCls} style={{ border: `1px solid ${BORDER}` }}>
              <option value="">-- Sélectionner un processus --</option>
              {processusList.map((p) => (
                <option key={p.id_processus} value={p.id_processus}>
                  {p.code_process} — {p.nom}
                </option>
              ))}
            </select>
          </div>

          {/* ── Info rectangle ── */}
          <div className="mb-3 rounded-xl bg-white px-6 py-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-stretch" style={{ gap: 0 }}>

              <InfoItem label="Code processus">
                <span className="font-bold" style={{ color: PURPLE }}>
                  {selectedProcessus?.code_process ?? "—"}
                </span>
              </InfoItem>

              <div style={{ width: 1, backgroundColor: BORDER, margin: "0 0" }} />

              <InfoItem label="Intitulé">
                {selectedProcessus?.nom ?? "—"}
              </InfoItem>

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

              <InfoItem label="Département">
                {selectedProcessus?.departement_nom ?? "—"}
              </InfoItem>

              <div style={{ width: 1, backgroundColor: BORDER }} />

              <InfoItem label="Date création">
                {fmtDate(selectedProcessus?.created_at)}
              </InfoItem>

              <div style={{ width: 1, backgroundColor: BORDER }} />

              <InfoItem label="Version actuelle">
                {isEdit && versionNumero
                  ? <span className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: PURPLE }}>V{versionNumero}</span>
                  : <span className="text-[11px] italic text-slate-400">Pas encore publiée</span>}
              </InfoItem>

            </div>
          </div>

          {/* ── Status pipeline ── */}
          <div className="mb-4 rounded-xl bg-white px-8 py-5" style={{ border: `1px solid ${BORDER}` }}>
            <PipelineFiche statut={currentStatut} />
          </div>

          {/* ── Fiche card — full width ── */}
          <div className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>

            {/* Header slim */}
            <div className="flex items-center justify-center px-6 py-3"
              style={{ backgroundColor: PURPLE, borderBottom: `1px solid ${BORDER}` }}>
              <span className="text-[12px] font-semibold text-white">Fiche Processus</span>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                <Loader2 size={26} className="animate-spin" style={{ color: PURPLE }} />
                <span className="text-[12px]">Chargement du formulaire…</span>
              </div>
            )}

            {/* Content: 30% left + 70% right */}
            {!loading && (
              <div className="flex min-h-[300px]">

                {/* ── Left 30% : Amont / Aval ── */}
                <div className="w-[30%] shrink-0 p-5 space-y-5 bg-white"
                  style={{ borderRight: `1px solid ${BORDER}` }}>

                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-wider"
                      style={{ color: PURPLE }}>
                      Processus en amont
                    </label>
                    <select value={amontId} onChange={(e) => setAmontId(e.target.value)}
                      className={selectCls} style={{ border: `1px solid ${BORDER}` }}>
                      <option value="">— Aucun —</option>
                      {processusList.map((p) => (
                        <option key={p.id_processus} value={p.id_processus}>
                          {p.code_process} - {p.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-wider"
                      style={{ color: PURPLE }}>
                      Processus en aval
                    </label>
                    <select value={avalId} onChange={(e) => setAvalId(e.target.value)}
                      className={selectCls} style={{ border: `1px solid ${BORDER}` }}>
                      <option value="">— Aucun —</option>
                      {processusList.map((p) => (
                        <option key={p.id_processus} value={p.id_processus}>
                          {p.code_process} - {p.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ── Right 70% : Sections ── */}
                <div className="flex-1 min-w-0">
                  {sections.length === 0
                    ? <div className="py-16 text-center text-[13px] text-slate-400">Aucune section trouvée.</div>
                    : sections.map((section, idx) => (
                        <SectionBlock key={section.id_section_template} section={section} index={idx}
                          formValues={formValues} onChange={handleChange} />
                      ))
                  }
                </div>

              </div>
            )}
          </div>

          {/* ── Bottom action buttons ── */}
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={saving || loading}
              className="rounded-xl px-6 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: "#fff", border: `1.5px solid ${PURPLE}`, color: PURPLE }}
            >
              Vérifier validation
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={() => handleSave("Soumise")}
              className="flex items-center gap-2 rounded-xl px-6 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: PURPLE }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PURPLE_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PURPLE)}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Soumettre la fiche
            </button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}
