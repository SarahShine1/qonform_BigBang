import { FileText } from "lucide-react";

export default function ProcessSectionPanel({ section, sectionIndex }) {
  return (
    <section className="min-h-[600px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-center bg-[#5b1fa8] px-5 py-4">
        <div className="text-base font-bold text-white">Fiche Processus</div>
      </div>
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-6 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#5b1fa8] text-sm font-bold text-white">
          {sectionIndex + 1}
        </span>
        <div className="text-sm font-bold uppercase tracking-[0.08em] text-[#202044]">{section.title}</div>
        <FileText className="ml-auto h-4 w-4 text-slate-400" />
      </div>

      <div className="px-7 py-4">
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
      {fields.map((field) => (
        <div key={field.label} className="grid grid-cols-[260px_1fr] items-start gap-8 py-4">
          <div className="text-sm font-bold text-[#5b1fa8]">{field.label}</div>
          <div className="min-h-[24px] border-b border-gray-100 pb-1 text-sm italic text-slate-500">
            {field.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentedInfoView({ fields }) {
  return (
    <div className="overflow-hidden border border-gray-100">
      <div className="grid grid-cols-2 bg-gray-50">
        <div className="border-r border-gray-100 px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
          Documents de référence
        </div>
        <div className="px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
          Enregistrements
        </div>
      </div>
      <div className="grid grid-cols-4 bg-gray-50">
        {fields.slice(1, 5).map((field) => (
          <div key={field.label} className="border-t border-r border-gray-100 px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-500 last:border-r-0">
            {field.label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4">
        {fields.slice(1, 5).map((field) => (
          <div key={field.label} className="min-h-[74px] border-t border-r border-gray-100 px-5 py-4 text-sm italic text-slate-500 last:border-r-0">
            {field.value}
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowView({ fields }) {
  const steps = fields.filter((field) => field.label.startsWith("Étape"));
  const bpmn = fields.find((field) => field.label.includes("BPMN"));

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 text-sm font-bold text-[#202044]">Tâches - Grandes étapes chronologiques</div>
        <div className="divide-y divide-gray-100">
          {steps.map((field) => (
            <div key={field.label} className="flex items-center gap-3 py-3 text-sm italic text-slate-500">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <span>{field.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 text-sm font-bold text-[#202044]">Cartographie - BPMN</div>
        <div className="flex min-h-[150px] items-center justify-center rounded-md border-2 border-dashed border-gray-200 text-sm italic text-slate-400">
          {bpmn?.value || "Insérer ici l'image du logigramme ou le lien vers le schéma BPMN"}
        </div>
      </div>
    </div>
  );
}
