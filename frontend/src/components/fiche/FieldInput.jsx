import TableField from "./TableField";
import { PURPLE, BORDER } from "./ficheConstants";

export default function FieldInput({ champ, value, onChange, readOnly = false }) {
  const { type_champ, configuration, placeholder } = champ;
  const conf = configuration != null ? configuration : {};
  const inputCls = "w-full rounded-lg bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-300 outline-none transition focus:ring-1 focus:ring-[#58148E]/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-default";
  const inputStyle = { border: `1px solid ${BORDER}` };

  switch (type_champ) {
    case "text":
      return (conf.multiline || conf.multiligne)
        ? <textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? ""} disabled={readOnly}
            className={`${inputCls} resize-y`} style={inputStyle} />
        : <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? ""} disabled={readOnly}
            className={inputCls} style={inputStyle} />;

    case "nombre":
      return <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
               placeholder={placeholder ?? ""} disabled={readOnly}
               className={inputCls} style={inputStyle} />;

    case "date":
      return <input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
               disabled={readOnly} className={inputCls} style={inputStyle} />;

    case "booleen":
      return (
        <label className={["flex items-center gap-2", readOnly ? "cursor-default" : "cursor-pointer"].join(" ")}>
          <input type="checkbox" checked={value === "true" || value === true}
            onChange={(e) => !readOnly && onChange(e.target.checked)}
            disabled={readOnly}
            className="h-4 w-4 rounded" style={{ accentColor: PURPLE }} />
          <span className="text-[13px] text-slate-600">{conf.label ?? "Oui"}</span>
        </label>
      );

    case "checklist": {
      const opts = champ.options ?? [];
      const selected = Array.isArray(value) ? value : [];
      const toggle = (v) => {
        if (readOnly) return;
        onChange(selected.includes(v) ? selected.filter((o) => o !== v) : [...selected, v]);
      };
      return (
        <div className="flex flex-wrap gap-2">
          {opts.map(({ valeur, libelle }) => (
            <button key={valeur} type="button" onClick={() => toggle(valeur)}
              disabled={readOnly}
              className="rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition disabled:cursor-default"
              style={selected.includes(valeur)
                ? { backgroundColor: PURPLE, borderColor: PURPLE, color: "#fff" }
                : { backgroundColor: "#fff", borderColor: BORDER, color: "#475569" }}>
              {libelle}
            </button>
          ))}
        </div>
      );
    }

    case "liste": {
      const opts = champ.options ?? [];
      return (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          disabled={readOnly} className={inputCls} style={inputStyle}>
          <option value="">-- Sélectionner --</option>
          {opts.map(({ valeur, libelle }) => (
            <option key={valeur} value={valeur}>{libelle}</option>
          ))}
        </select>
      );
    }

    case "tableau": {
      const cols = (champ.colonnes ?? []).map((c) => ({
        key:         c.cle,
        label:       c.libelle,
        placeholder: c.placeholder ?? "",
      }));
      return <TableField columns={cols} value={Array.isArray(value) ? value : []}
               onChange={onChange} readOnly={readOnly} />;
    }

    default:
      return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
               placeholder={placeholder ?? ""} disabled={readOnly}
               className={inputCls} style={inputStyle} />;
  }
}
