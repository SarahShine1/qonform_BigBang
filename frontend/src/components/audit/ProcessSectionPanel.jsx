import { CheckCircle2, CircleX, FileText } from "lucide-react";

export default function ProcessSectionPanel({ section, sectionIndex }) {
  return (
    <section className="min-h-[520px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-center bg-[#5b1fa8] px-5 py-3.5">
        <div className="text-base font-bold text-white">Fiche Processus</div>
      </div>
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5b1fa8] text-xs font-bold text-white">
          {sectionIndex + 1}
        </span>
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-[#202044]">{section.title}</div>
        <FileText className="ml-auto h-4 w-4 text-slate-400" />
      </div>

      <div className="px-5 py-3.5">
        {section.id === "flow" ? (
          <FlowView fields={section.processFields} />
        ) : section.id === "documents" ? (
          <DocumentedInfoView fields={section.processFields} />
        ) : (
          <Rows fields={section.processFields} />
        )}
      </div>
    </section>
  );
}

function Rows({ fields }) {
  return (
    <div className="divide-y divide-gray-100">
      {fields.map((field) => {
        const valid = field.valid ?? isFieldValid(field.value);
        return (
          <div key={field.label} className="grid grid-cols-[220px_1fr_32px] items-start gap-5 py-2.5">
            <div className="text-xs font-bold text-[#5b1fa8]">{field.label}</div>
            <div className="min-h-[22px] border-b border-gray-100 pb-1 text-sm italic text-slate-500">
              {field.value}
            </div>
            <FieldStatusIcon valid={valid} />
          </div>
        );
      })}
    </div>
  );
}

function DocumentedInfoView({ fields }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100">
      <div className="grid grid-cols-2 bg-gray-50">
        <div className="border-r border-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
          Documents de reference
        </div>
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
          Enregistrements
        </div>
      </div>
      <div className="space-y-0">
        {fields.map((field) => (
          <div key={field.label} className="grid grid-cols-[220px_1fr_32px] items-start gap-4 border-t border-gray-100 px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">{field.label}</div>
            <div className="text-sm italic text-slate-500">{field.value}</div>
            <FieldStatusIcon valid={field.valid ?? isFieldValid(field.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowView({ fields }) {
  const steps = fields.filter((field) => field.label.toLowerCase().startsWith("etape") || field.label.toLowerCase().startsWith("étape"));
  const bpmn = fields.find((field) => field.label.includes("BPMN"));

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 text-xs font-bold text-[#202044]">Taches - Grandes etapes chronologiques</div>
        <div className="space-y-2">
          {steps.map((field) => (
            <div key={field.label} className="grid grid-cols-[1fr_32px] items-center gap-4 rounded-lg border border-gray-100 px-3 py-2">
              <div className="text-sm italic text-slate-500">{field.value}</div>
              <FieldStatusIcon valid={field.valid ?? isFieldValid(field.value)} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 text-xs font-bold text-[#202044]">Cartographie - BPMN</div>
        <div className="grid grid-cols-[1fr_32px] items-center gap-4 rounded-lg border-2 border-dashed border-gray-200 px-4 py-8">
          <div className="text-sm italic text-slate-400">
            {bpmn?.value || "Inserer ici l'image du logigramme ou le lien vers le schema BPMN"}
          </div>
          <FieldStatusIcon valid={bpmn?.valid ?? isFieldValid(bpmn?.value)} />
        </div>
      </div>
    </div>
  );
}

function FieldStatusIcon({ valid }) {
  return valid ? (
    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  ) : (
    <CircleX className="h-5 w-5 text-red-500" />
  );
}

function isFieldValid(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(normalized) && normalized !== "non renseigne" && normalized !== "non renseigné";
}
