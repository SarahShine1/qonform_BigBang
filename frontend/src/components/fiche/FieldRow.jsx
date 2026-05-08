import FieldInput from "./FieldInput";
import { PURPLE, BORDER } from "./ficheConstants";

export default function FieldRow({ champ, value, onChange, readOnly = false }) {
  const cfg = champ.configuration ?? {};
  const isWide = champ.type_champ === "tableau" || cfg.multiline || cfg.multiligne;
  return (
    <div
      className={["py-4", isWide ? "space-y-2" : "grid items-start gap-5"].join(" ")}
      style={!isWide ? { gridTemplateColumns: "200px 1fr" } : undefined}
    >
      <div className="flex items-start gap-1 pt-0.5">
        <span className="text-[12px] font-semibold" style={{ color: PURPLE }}>{champ.libelle}</span>
        {champ.est_obligatoire && !readOnly && <span className="text-[10px] text-red-400 mt-0.5">*</span>}
      </div>
      <div>
        <FieldInput champ={champ} value={value} onChange={onChange} readOnly={readOnly} />
        {champ.aide && <p className="mt-1.5 text-[11px] text-slate-400">{champ.aide}</p>}
      </div>
    </div>
  );
}
