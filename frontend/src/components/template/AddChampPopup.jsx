import { useState } from "react";
import { AlignLeft, ListChecks, Plus, Table2, Trash2, X } from "lucide-react";

const PURPLE       = "#58148E";
const PURPLE_LIGHT = "#EDE9FE";
const BORDER       = "#D1D5DB";

const TYPES = [
  { value: "text",      label: "Texte",     Icon: AlignLeft  },
  { value: "checklist", label: "Checklist", Icon: ListChecks },
  { value: "tableau",   label: "Tableau",   Icon: Table2     },
];

const inputCls =
  "w-full rounded-lg border px-3 py-2 text-[12.5px] text-slate-700 outline-none transition focus:ring-1 focus:ring-[#58148E]/30";

function OptionRow({ opt, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <input value={opt.valeur} onChange={(e) => onChange({ ...opt, valeur: e.target.value })}
        placeholder="valeur (code)" className={inputCls} style={{ borderColor: BORDER }} />
      <input value={opt.libelle} onChange={(e) => onChange({ ...opt, libelle: e.target.value })}
        placeholder="libellé affiché" className={inputCls} style={{ borderColor: BORDER }} />
      <button type="button" onClick={onRemove}
        className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:text-red-400">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function ColonneRow({ col, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <input value={col.cle} onChange={(e) => onChange({ ...col, cle: e.target.value })}
        placeholder="clé (ex: nom)" className={inputCls} style={{ borderColor: BORDER }} />
      <input value={col.libelle} onChange={(e) => onChange({ ...col, libelle: e.target.value })}
        placeholder="libellé colonne" className={inputCls} style={{ borderColor: BORDER }} />
      <input value={col.placeholder || ""} onChange={(e) => onChange({ ...col, placeholder: e.target.value })}
        placeholder="placeholder" className={inputCls} style={{ borderColor: BORDER }} />
      <button type="button" onClick={onRemove}
        className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:text-red-400">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function AddChampPopup({ onAdd, onCancel }) {
  const [form, setForm] = useState({
    libelle: "",
    type_champ: "text",
    placeholder: "",
    aide: "",
    est_obligatoire: false,
  });
  const [options,  setOptions]  = useState([]);
  const [colonnes, setColonnes] = useState([]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const needsOptions  = form.type_champ === "checklist";
  const needsColonnes = form.type_champ === "tableau";

  const handleAdd = () => {
    if (!form.libelle.trim()) return;
    onAdd({
      ...form,
      options:  needsOptions  ? options  : [],
      colonnes: needsColonnes ? colonnes : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl"
        style={{ border: "1px solid #E5E7EB" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-[14px] font-bold text-slate-800">Nouveau champ</p>
          <button type="button" onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Type selector — 3 horizontal cards */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Type de champ
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(({ value, label, Icon }) => {
                const selected = form.type_champ === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("type_champ", value)}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 py-3 transition"
                    style={{
                      backgroundColor: selected ? PURPLE_LIGHT : "#F9FAFB",
                      borderColor:     selected ? PURPLE       : "#E5E7EB",
                    }}
                  >
                    <Icon size={20} style={{ color: selected ? PURPLE : "#9CA3AF" }} strokeWidth={1.8} />
                    <span className="text-[11.5px] font-semibold"
                      style={{ color: selected ? PURPLE : "#6B7280" }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Libellé */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Libellé <span className="text-red-400">*</span>
            </label>
            <input value={form.libelle} onChange={(e) => set("libelle", e.target.value)}
              placeholder="Nom du champ…"
              className={inputCls} style={{ borderColor: BORDER }} />
          </div>

          {/* Placeholder (not for tableau) */}
          {!needsColonnes && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Placeholder
              </label>
              <input value={form.placeholder} onChange={(e) => set("placeholder", e.target.value)}
                placeholder="Texte indicatif…"
                className={inputCls} style={{ borderColor: BORDER }} />
            </div>
          )}

          {/* Aide */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Aide (optionnel)
            </label>
            <input value={form.aide} onChange={(e) => set("aide", e.target.value)}
              placeholder="Description ou aide contextuelle…"
              className={inputCls} style={{ borderColor: BORDER }} />
          </div>

          {/* Obligatoire */}
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={form.est_obligatoire}
              onChange={(e) => set("est_obligatoire", e.target.checked)}
              className="h-4 w-4 rounded accent-[#58148E]" />
            <span className="text-[12.5px] font-medium text-slate-600">Champ obligatoire</span>
          </label>

          {/* Options (checklist) */}
          {needsOptions && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Options</p>
                <button type="button"
                  onClick={() => setOptions((o) => [...o, { valeur: "", libelle: "", ordre: o.length + 1 }])}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition"
                  style={{ backgroundColor: PURPLE_LIGHT, color: PURPLE }}>
                  <Plus size={11} /> Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <OptionRow key={i} opt={opt}
                    onChange={(u) => setOptions((o) => o.map((x, j) => j === i ? u : x))}
                    onRemove={() => setOptions((o) => o.filter((_, j) => j !== i))} />
                ))}
                {options.length === 0 && (
                  <p className="text-[11.5px] italic text-slate-400">Aucune option — cliquez Ajouter</p>
                )}
              </div>
            </div>
          )}

          {/* Colonnes (tableau) */}
          {needsColonnes && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Colonnes</p>
                <button type="button"
                  onClick={() => setColonnes((c) => [...c, { cle: "", libelle: "", placeholder: "", ordre: c.length + 1 }])}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition"
                  style={{ backgroundColor: PURPLE_LIGHT, color: PURPLE }}>
                  <Plus size={11} /> Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {colonnes.map((col, i) => (
                  <ColonneRow key={i} col={col}
                    onChange={(u) => setColonnes((c) => c.map((x, j) => j === i ? u : x))}
                    onRemove={() => setColonnes((c) => c.filter((_, j) => j !== i))} />
                ))}
                {colonnes.length === 0 && (
                  <p className="text-[11.5px] italic text-slate-400">Aucune colonne — cliquez Ajouter</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4"
          style={{ borderTop: `1px solid ${BORDER}` }}>
          <button type="button" onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50">
            Annuler
          </button>
          <button type="button" onClick={handleAdd} disabled={!form.libelle.trim()}
            className="rounded-xl px-5 py-2 text-[12px] font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: PURPLE }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#45107A")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PURPLE)}>
            Ajouter le champ
          </button>
        </div>
      </div>
    </div>
  );
}
