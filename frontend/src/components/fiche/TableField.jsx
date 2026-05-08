import { Plus, Trash2 } from "lucide-react";
import { PURPLE, PURPLE_LIGHT, BORDER } from "./ficheConstants";

export default function TableField({ columns = [], value = [], onChange, readOnly = false }) {
  const emptyRow = () => Object.fromEntries(columns.map(({ key }) => [key, ""]));
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
            {columns.map(({ key, label }) => (
              <th key={key}
                className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: PURPLE }}>
                {label}
              </th>
            ))}
            {!readOnly && <th className="w-8" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderTop: `1px solid ${BORDER}` }}>
              {columns.map(({ key, placeholder }) => (
                <td key={key} className="px-3 py-1.5" style={{ borderRight: `1px solid ${BORDER}` }}>
                  <input
                    type="text"
                    value={row[key] ?? ""}
                    onChange={(e) => !readOnly && updateCell(ri, key, e.target.value)}
                    placeholder={readOnly ? "" : placeholder}
                    disabled={readOnly}
                    className="w-full rounded bg-transparent px-1.5 py-1 text-[12px] text-slate-700 placeholder:text-slate-300 outline-none focus:bg-white disabled:cursor-default"
                  />
                </td>
              ))}
              {!readOnly && (
                <td className="pr-2 text-center">
                  <button type="button" onClick={() => removeRow(ri)}
                    className="rounded p-1 text-slate-300 transition hover:text-red-400">
                    <Trash2 size={11} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button type="button" onClick={addRow}
            className="flex items-center gap-1.5 text-[11px] font-semibold transition"
            style={{ color: PURPLE }}>
            <Plus size={12} /> Ajouter une ligne
          </button>
        </div>
      )}
    </div>
  );
}
