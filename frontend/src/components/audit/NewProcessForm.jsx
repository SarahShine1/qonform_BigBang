import { useMemo, useState } from "react";
import { FilePlus2, RotateCcw, Save } from "lucide-react";

const INITIAL_FORM = {
  intitule: "",
  idDepartement: "",
  typeProcess: "Support",
  description: "",
  disponiblePourFiche: true,
};

const TYPE_OPTIONS = [
  { value: "Management", label: "Management", code: "MNG" },
  { value: "Realisation", label: "Realisation", code: "REA" },
  { value: "Support", label: "Support", code: "SUP" },
];

function getNextSequence(processes, departmentId, typeProcess) {
  if (!departmentId || !typeProcess) return 1;

  const matching = processes.filter((process) => {
    const processDepartmentId = process.id_departement ?? process.idDepartement ?? process.departement_id;
    const processType = process.type_process || process.type;
    return String(processDepartmentId) === String(departmentId) && processType === typeProcess;
  });

  let nextNumber = 1;
  for (const process of matching) {
    const code = String(process.code_process || process.code || "").trim();
    const match = code.match(/(\d+)$/);
    if (match) {
      nextNumber = Math.max(nextNumber, Number(match[1]) + 1);
    }
  }

  return nextNumber;
}

export default function NewProcessForm({ onCreate, departments = [], processes = [], saving = false }) {
  const [form, setForm] = useState(INITIAL_FORM);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
  };

  const selectedDepartment = useMemo(
    () => departments.find((department) => String(department.id) === String(form.idDepartement)) ?? null,
    [departments, form.idDepartement],
  );

  const selectedType = useMemo(
    () => TYPE_OPTIONS.find((option) => option.value === form.typeProcess) ?? TYPE_OPTIONS[2],
    [form.typeProcess],
  );

  const nextSequence = useMemo(
    () => getNextSequence(processes, form.idDepartement, form.typeProcess),
    [processes, form.idDepartement, form.typeProcess],
  );

  const codePreview = selectedDepartment
    ? `${selectedDepartment.code || "CODE"}-${selectedType.code}-${String(nextSequence).padStart(3, "0")}`
    : `CODE-${selectedType.code}-${String(nextSequence).padStart(3, "0")}`;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      nom: form.intitule.trim(),
      id_departement: Number(form.idDepartement),
      description: form.description.trim(),
      type_process: form.typeProcess,
      disponible_pour_fiche: form.disponiblePourFiche,
    };

    try {
      await onCreate(payload);
      handleReset();
    } catch {
      return;
    }
  };

  return (
    <section className="rounded-[12px] border border-[#E9E1F8] bg-white p-2.5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-purple-50 text-purple-700">
          <FilePlus2 className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-[11.5px] font-semibold text-[#121942]">Nouveau processus constate</h2>
      </div>

      <div className="mb-2.5 rounded-[8px] border border-purple-100 bg-purple-50/70 px-2.5 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-500">Codification auto</p>
        <p className="mt-1 text-[12px] font-semibold text-[#121942]">{codePreview}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="mb-1 block text-[10.5px] font-semibold text-slate-600">
            Intitule du processus <span className="text-red-500">*</span>
          </label>
          <input
            value={form.intitule}
            onChange={(event) => updateField("intitule", event.target.value)}
            placeholder="Ex. : Achats de matieres premieres"
            required
            className="h-7.5 w-full rounded-[7px] border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10.5px] font-semibold text-slate-600">
              Departement rattache <span className="text-red-500">*</span>
            </label>
            <select
              value={form.idDepartement}
              onChange={(event) => updateField("idDepartement", event.target.value)}
              required
            className="h-7.5 w-full rounded-[7px] border border-slate-200 bg-white px-2.5 text-[11px] text-slate-600 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              <option value="">Selectionner</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10.5px] font-semibold text-slate-600">
              Type de processus <span className="text-red-500">*</span>
            </label>
            <select
              value={form.typeProcess}
              onChange={(event) => updateField("typeProcess", event.target.value)}
              required
            className="h-7.5 w-full rounded-[7px] border border-slate-200 bg-white px-2.5 text-[11px] text-slate-600 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10.5px] font-semibold text-slate-600">Finalite / description</label>
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Objectif principal du processus..."
            rows={2}
            className="min-h-[48px] w-full resize-none rounded-[7px] border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <label className="flex items-center gap-2.5 text-[10.5px] font-medium text-slate-500">
          <button
            type="button"
            onClick={() => updateField("disponiblePourFiche", !form.disponiblePourFiche)}
            className={[
              "relative h-5 w-9 rounded-full transition",
              form.disponiblePourFiche ? "bg-purple-700" : "bg-slate-300",
            ].join(" ")}
            aria-pressed={form.disponiblePourFiche}
          >
            <span
              className={[
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",
                form.disponiblePourFiche ? "left-[18px]" : "left-0.5",
              ].join(" ")}
            />
          </button>
          Creer le processus et le rendre disponible pour la fiche
        </label>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-7.5 items-center justify-center gap-1.5 rounded-[7px] border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reinitialiser
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-7.5 items-center justify-center gap-1.5 rounded-[7px] bg-purple-700 px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}
