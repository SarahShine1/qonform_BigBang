import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Save, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";
import { getProcessusList } from "../../api/processus.api";
import {
  getSectionTemplates,
  getChampTemplates,
  createVersionFiche,
  saveChampFiches,
  getVersionFiche,
  getChampsFiche,
} from "../../api/fiches.api";

const PURPLE = "#58148E";
const PURPLE_HOVER = "#45107A";
const PURPLE_LIGHT = "#EDE9FE";

// ── TableField ─────────────────────────────────────────────────────────────
function TableField({ columns = [], value = [], onChange }) {
  const emptyRow = () => Object.fromEntries(columns.map((c) => [c.key ?? c, ""]));
  const rows = value.length ? value : [emptyRow()];

  const updateCell = (ri, key, val) => {
    onChange(rows.map((r, i) => (i === ri ? { ...r, [key]: val } : r)));
  };
  const addRow = () => onChange([...rows, emptyRow()]);
  const removeRow = (ri) =>
    onChange(rows.length > 1 ? rows.filter((_, i) => i !== ri) : rows);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ backgroundColor: PURPLE_LIGHT }}>
            {columns.map((col) => (
              <th
                key={col.key ?? col}
                className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: PURPLE }}
              >
                {col.label ?? col}
              </th>
            ))}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-slate-200">
              {columns.map((col) => (
                <td key={col.key ?? col} className="border-r border-slate-200 px-3 py-1.5 last:border-r-0">
                  <input
                    type="text"
                    value={row[col.key ?? col] ?? ""}
                    onChange={(e) => updateCell(ri, col.key ?? col, e.target.value)}
                    placeholder={col.placeholder ?? ""}
                    className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-[12px] text-slate-700 placeholder:text-slate-300 transition focus:bg-white focus:outline-none focus:ring-1"
                    style={{ "--tw-ring-color": PURPLE + "33" }}
                  />
                </td>
              ))}
              <td className="pr-2 text-center">
                <button
                  type="button"
                  onClick={() => removeRow(ri)}
                  className="rounded p-1 text-slate-300 transition hover:text-red-400"
                >
                  <Trash2 size={11} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-200 px-4 py-2.5">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-[11px] font-semibold transition"
          style={{ color: PURPLE }}
        >
          <Plus size={12} />
          Ajouter une ligne
        </button>
      </div>
    </div>
  );
}

// options peuvent être strings ou objets { valeur, libelle }
const normalizeOpt = (opt) =>
  typeof opt === "object" && opt !== null
    ? {
        value: String(opt.valeur ?? opt.value ?? opt.id ?? ""),
        label: String(opt.libelle ?? opt.label ?? opt.nom ?? ""),
      }
    : { value: String(opt), label: String(opt) };

// ── FieldInput ─────────────────────────────────────────────────────────────
function FieldInput({ champ, value, onChange }) {
  const { type_champ, configuration = {}, placeholder } = champ;

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-300 transition outline-none focus:border-[#58148E] focus:ring-1 focus:ring-[#58148E]/20";

  switch (type_champ) {
    case "text":
      return configuration.multiline ? (
        <textarea
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? ""}
          className={`${inputCls} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? ""}
          className={inputCls}
        />
      );

    case "nombre":
      return (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? ""}
          className={inputCls}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );

    case "booleen":
      return (
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={value === "true" || value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
            style={{ accentColor: PURPLE }}
          />
          <span className="text-[13px] text-slate-600">
            {configuration.label ?? "Oui"}
          </span>
        </label>
      );

    case "checklist": {
      const options = (configuration.options ?? []).map(normalizeOpt);
      const selected = Array.isArray(value) ? value : [];
      const toggle = (val) =>
        onChange(
          selected.includes(val)
            ? selected.filter((o) => o !== val)
            : [...selected, val]
        );
      return (
        <div className="flex flex-wrap gap-2">
          {options.map(({ value: val, label }) => {
            const active = selected.includes(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => toggle(val)}
                className="rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition"
                style={
                  active
                    ? { backgroundColor: PURPLE, borderColor: PURPLE, color: "#fff" }
                    : { backgroundColor: "#fff", borderColor: "#e2e8f0", color: "#475569" }
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      );
    }

    case "liste": {
      const options = (configuration.options ?? []).map(normalizeOpt);
      return (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        >
          <option value="">-- Sélectionner --</option>
          {options.map(({ value: val, label }) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      );
    }

    case "tableau":
      return (
        <TableField
          columns={configuration.columns ?? []}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );

    default:
      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? ""}
          className={inputCls}
        />
      );
  }
}

// ── FieldRow ───────────────────────────────────────────────────────────────
function FieldRow({ champ, value, onChange }) {
  const isWide = champ.type_champ === "tableau" || champ.configuration?.multiline;

  return (
    <div
      className={["py-4", isWide ? "space-y-2" : "grid items-start gap-6"].join(" ")}
      style={!isWide ? { gridTemplateColumns: "220px 1fr" } : undefined}
    >
      <div className="flex items-start gap-1 pt-0.5">
        <span className="text-[12.5px] font-semibold" style={{ color: PURPLE }}>
          {champ.libelle}
        </span>
        {champ.est_obligatoire && (
          <span className="mt-0.5 text-[10px] text-red-400">*</span>
        )}
      </div>
      <div>
        <FieldInput champ={champ} value={value} onChange={onChange} />
        {champ.aide && (
          <p className="mt-1.5 text-[11px] text-slate-400">{champ.aide}</p>
        )}
      </div>
    </div>
  );
}

// ── SectionBlock ───────────────────────────────────────────────────────────
function SectionBlock({ section, index, formValues, onChange }) {
  return (
    <div style={{ borderTop: "1px solid #D1D5DB" }}>
      {/* En-tête section */}
      <div
        className="flex items-center gap-3 px-6 py-3"
        style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #D1D5DB" }}
      >
        <span
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
          style={{ backgroundColor: PURPLE }}
        >
          {index + 1}
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500">
          {section.nom}
        </span>
      </div>
      {/* Champs */}
      <div className="bg-white px-6" style={{ "--divider": "#D1D5DB" }}>
        {section.champs.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-slate-400">
            Aucun champ dans cette section.
          </p>
        ) : (
          section.champs.map((champ, i) => (
            <div key={champ.id_champ_template} style={i > 0 ? { borderTop: "1px solid #D1D5DB" } : {}}>
              <FieldRow
                champ={champ}
                value={formValues[champ.id_champ_template]}
                onChange={(val) => onChange(champ.id_champ_template, val)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function FicheProcessusForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sections, setSections] = useState([]);
  const [processusList, setProcessusList] = useState([]);
  const [selectedProcessusId, setSelectedProcessusId] = useState("");
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = Boolean(id);
  const userName = `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] ?? "";

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
            .map(async (section) => {
              const champs = await getChampTemplates(section.id_section_template);
              return {
                ...section,
                champs: champs
                  .filter((c) => c.est_actif !== false)
                  .sort((a, b) => a.ordre - b.ordre),
              };
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
          const vals = {};
          champsExistants.forEach((c) => {
            vals[c.id_champ_template] = c.valeur_json !== null ? c.valeur_json : c.valeur;
          });
          setFormValues(vals);
        }
      } catch (err) {
        setError("Impossible de charger le formulaire. Vérifiez la connexion au serveur.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProcessusId) {
      setError("Veuillez sélectionner un processus.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let versionId = id;
      if (!isEdit) {
        const fiche = await createVersionFiche({
          id_processus: Number(selectedProcessusId),
          id_redacteur: user?.id_user,
          numero_version: "1.0",
        });
        versionId = fiche.id_version;
      }

      const champsPayload = sections.flatMap((section) =>
        section.champs.map((champ) => {
          const val = formValues[champ.id_champ_template];
          const isJson = Array.isArray(val) || (typeof val === "object" && val !== null);
          return {
            id_champ_template: champ.id_champ_template,
            libelle: champ.libelle,
            type_champ: champ.type_champ,
            est_obligatoire: champ.est_obligatoire,
            ordre: champ.ordre,
            valeur: isJson ? null : val != null ? String(val) : null,
            valeur_json: isJson ? val : null,
          };
        })
      );

      await saveChampFiches(versionId, champsPayload);
      navigate("/gestion-processus/fiches");
    } catch (err) {
      setError("Une erreur est survenue lors de l'enregistrement.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout pageTitle="Gestion des processus" userName={userName} userRole={userRole}>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="flex h-full gap-5 pb-12">

        {/* ── Colonne gauche 80% ── */}
        <div className="min-w-0" style={{ flex: "0 0 80%" }}>
          <form onSubmit={handleSubmit}>

            {/* Barre supérieure */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <ChevronLeft size={14} />
                  Retour
                </button>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-700">
                  {isEdit ? "Modifier la fiche" : "Nouvelle fiche"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {error && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600">
                    <AlertCircle size={13} />
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="flex items-center gap-2 rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: PURPLE, boxShadow: "0 4px 14px rgba(88,20,142,0.3)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PURPLE_HOVER)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PURPLE)}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Enregistrer
                </button>
              </div>
            </div>

            {/* Sélecteur de processus */}
            <div
              className="mb-4 flex items-center gap-4 rounded-xl bg-white px-5 py-3"
              style={{ border: "1px solid #D1D5DB" }}
            >
              <label className="shrink-0 text-[12px] font-semibold" style={{ color: PURPLE }}>
                Processus concerné
              </label>
              <select
                value={selectedProcessusId}
                onChange={(e) => setSelectedProcessusId(e.target.value)}
                disabled={isEdit || loading}
                className="flex-1 rounded-lg bg-white px-3 py-1.5 text-[13px] text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:text-slate-400"
                style={{ border: "1px solid #D1D5DB" }}
              >
                <option value="">-- Sélectionner un processus --</option>
                {processusList.map((p) => (
                  <option key={p.id_processus} value={p.id_processus}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Carte Fiche Processus */}
            <div
              className="overflow-hidden rounded-xl bg-white"
              style={{ border: "1px solid #D1D5DB" }}
            >
              {/* En-tête slim — fond mauve, texte centré */}
              <div
                className="flex items-center justify-center px-6 py-3"
                style={{ backgroundColor: PURPLE, borderBottom: "1px solid #D1D5DB" }}
              >
                <span className="text-[12px] font-semibold text-white">
                  Fiche Processus
                </span>
              </div>

              {/* Chargement */}
              {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                  <Loader2 size={26} className="animate-spin" style={{ color: PURPLE }} />
                  <span className="text-[12px]">Chargement du formulaire…</span>
                </div>
              )}

              {!loading && sections.length === 0 && !error && (
                <div className="py-16 text-center text-[13px] text-slate-400">
                  Aucune section trouvée dans le template.
                </div>
              )}

              {!loading &&
                sections.map((section, idx) => (
                  <SectionBlock
                    key={section.id_section_template}
                    section={section}
                    index={idx}
                    formValues={formValues}
                    onChange={handleChange}
                  />
                ))}
            </div>
          </form>
        </div>

        {/* ── Colonne droite 20% — à remplir ── */}
        <div className="min-w-0" style={{ flex: "1 1 0" }} />

      </div>
    </AppLayout>
  );
}
