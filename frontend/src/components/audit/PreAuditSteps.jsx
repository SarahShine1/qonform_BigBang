import { Flag } from "lucide-react";

const STEPS = [
  "Observer les activites de l'organisation",
  "Identifier les processus constates",
  "Attribuer une codification et un departement",
  "Publier le processus pour le gestionnaire de processus",
];

export default function PreAuditSteps() {
  return (
    <section className="rounded-[12px] border border-[#E9E1F8] bg-white px-3 py-2.5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-purple-50 text-purple-700">
          <Flag className="h-3 w-3 fill-purple-700/10" />
        </div>
        <h2 className="text-[12px] font-semibold text-[#121942]">Demarche du pre-audit</h2>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {STEPS.map((step, index) => (
          <div key={step} className="relative flex flex-col items-center text-center">
            {index < STEPS.length - 1 && (
              <span className="absolute left-1/2 top-3.5 h-px w-full border-t border-dashed border-slate-300" />
            )}
            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-[13px] font-semibold text-amber-500">
              {index + 1}
            </span>
            <p className="mt-1.5 max-w-[118px] text-[9.5px] font-semibold leading-3.5 text-slate-600">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
