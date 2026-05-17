import { CheckCircle2, CircleX, ExternalLink, FileText } from "lucide-react";

export default function ProcessSectionPanel({ section, sectionIndex, onOpenDocument }) {
  return (
    <section className="min-h-[520px] rounded-xl border border-gray-200 bg-white shadow-sm">
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
          <Rows fields={section.processFields} onOpenDocument={onOpenDocument} />
        )}
      </div>
    </section>
  );
}

function Rows({ fields, onOpenDocument }) {
  return (
    <div className="divide-y divide-gray-100">
      {fields.map((field) => {
        const valid = field.valid ?? isFieldValid(field.value);
        const structured = isStructuredTableValue(field.value);

        if (structured) {
          return (
            <div key={field.label} className="py-3">
              <div className="mb-3 flex items-center gap-3">
                <div className="text-xs font-bold text-[#5b1fa8]">{field.label}</div>
                <FieldStatusIcon valid={valid} />
              </div>
              <FieldValue value={field.value} />
            </div>
          );
        }

        return (
          <div key={field.label} className="grid grid-cols-[220px_1fr_32px] items-start gap-5 py-2.5">
            <div className="text-xs font-bold text-[#5b1fa8]">{field.label}</div>
            <div className="min-h-[22px] border-b border-gray-100 pb-1 text-sm text-slate-500">
              <FieldValue value={field.value} />
              {field.documentId && (
                <button
                  type="button"
                  onClick={() => onOpenDocument?.(field.documentId)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Voir
                </button>
              )}
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
    <div className="rounded-lg border border-gray-100">
      <div className="grid grid-cols-2 bg-gray-50">
        <div className="border-r border-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
          Documents de reference
        </div>
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
          Enregistrements
        </div>
      </div>
      <div className="space-y-0">
        {fields.map((field) => {
          const valid = field.valid ?? isFieldValid(field.value);
          const structured = isStructuredTableValue(field.value);

          if (structured) {
            return (
              <div key={field.label} className="border-t border-gray-100 px-4 py-3">
                <div className="mb-3 flex items-center gap-3">
                  <div className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">{field.label}</div>
                  <FieldStatusIcon valid={valid} />
                </div>
                <FieldValue value={field.value} />
              </div>
            );
          }

          return (
            <div key={field.label} className="grid grid-cols-[220px_1fr_32px] items-start gap-4 border-t border-gray-100 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">{field.label}</div>
              <FieldValue value={field.value} />
              <FieldStatusIcon valid={valid} />
            </div>
          );
        })}
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
        <div className="mb-3 text-xs font-bold text-[#202044]">Tâches - Grandes étapes chronologiques</div>
        <div className="space-y-2">
          {steps.map((field) => (
            <div key={field.label} className="grid grid-cols-[1fr_32px] items-center gap-4 rounded-lg border border-gray-100 px-3 py-2">
              <FieldValue value={field.value} />
              <FieldStatusIcon valid={field.valid ?? isFieldValid(field.value)} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 text-xs font-bold text-[#202044]">Cartographie - BPMN</div>
        <div className="grid grid-cols-[1fr_32px] items-center gap-4 rounded-lg border-2 border-dashed border-gray-200 px-4 py-8">
          <div className="text-sm italic text-slate-400">
            {bpmn?.value || "Insérer ici l'image du logigramme ou le lien vers le schéma BPMN"}
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

function FieldValue({ value }) {
  const parsedValue = parseStructuredValue(value);

  if (Array.isArray(parsedValue)) {
    if (parsedValue.length === 0) {
      return <div className="text-sm italic text-slate-400">Non renseigné</div>;
    }

    if (parsedValue.every((item) => isPlainObject(item))) {
      return <StructuredTable rows={parsedValue} />;
    }

    return (
      <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
        {parsedValue.map((item, index) => (
          <li key={`${String(item)}-${index}`}>{formatCellValue(item)}</li>
        ))}
      </ul>
    );
  }

  if (isPlainObject(parsedValue)) {
    return <StructuredTable rows={[parsedValue]} />;
  }

  return <div className="text-sm italic text-slate-500">{formatCellValue(parsedValue)}</div>;
}

function StructuredTable({ rows }) {
  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  if (!columns.length) {
    return <div className="text-sm italic text-slate-400">Non renseigné</div>;
  }

  const minWidth = Math.max(columns.length * 190, 680);

  return (
    <div className="block w-full max-w-full overflow-x-auto rounded-xl border border-purple-100 bg-white">
      <table
        className="w-full table-auto border-collapse text-left text-xs"
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead className="bg-purple-50 text-[#5b1fa8]">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="whitespace-nowrap border-b border-purple-100 px-4 py-3 align-top font-bold uppercase tracking-[0.06em]"
              >
                {formatColumnLabel(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top">
              {columns.map((column) => (
                <td key={`${rowIndex}-${column}`} className="min-w-[190px] whitespace-normal break-words px-4 py-3 align-top leading-5 text-slate-700">
                  {formatCellValue(row?.[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseStructuredValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || !["[", "{"].includes(trimmed[0])) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function isStructuredTableValue(value) {
  const parsedValue = parseStructuredValue(value);
  if (Array.isArray(parsedValue)) {
    return parsedValue.length > 0 && parsedValue.every((item) => isPlainObject(item));
  }
  return isPlainObject(parsedValue);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatColumnLabel(value) {
  const labels = {
    etape: "Étape",
    acteur: "Acteur",
    entree: "Entrée",
    sortie: "Sortie",
    description: "Description",
    consequences: "Conséquences",
    causes: "Causes",
    client: "Client",
    type: "Type",
    besoin_attendu: "Besoin attendu",
  };

  const key = String(value || "");
  if (labels[key]) return labels[key];

  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Non renseigné";
  }

  if (Array.isArray(value)) {
    return value.map(formatCellValue).join(", ");
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([key, item]) => `${formatColumnLabel(key)} : ${formatCellValue(item)}`)
      .join(" - ");
  }

  return String(value);
}

function isFieldValid(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(normalized) && normalized !== "non renseigne" && normalized !== "non renseigné";
}
