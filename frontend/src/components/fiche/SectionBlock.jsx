import FieldRow from "./FieldRow";
import { PURPLE, BORDER } from "./ficheConstants";

export default function SectionBlock({ section, index, formValues, onChange, readOnly = false }) {
  return (
    <div style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-3 px-6 py-3"
        style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
        <span
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
          style={{ backgroundColor: PURPLE }}
        >
          {index}
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500">
          {section.nom}
        </span>
      </div>
      <div className="bg-white px-6">
        {section.champs.map((champ, i) => (
          <div key={champ.id_champ_template} style={i > 0 ? { borderTop: `1px solid ${BORDER}` } : {}}>
            <FieldRow
              champ={champ}
              value={formValues[champ.id_champ_template]}
              onChange={(val) => onChange(champ.id_champ_template, val)}
              readOnly={readOnly}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
