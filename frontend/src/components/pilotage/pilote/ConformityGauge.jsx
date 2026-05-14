import { PURPLE } from "./constants";

const CIRCUMFERENCE = 263.89;

export default function ConformityGauge({ value }) {
  if (value == null) {
    return (
      <div className="text-center">
        <p className="text-[11px] text-slate-400 font-semibold">
          Taux moyen<br />de conformité
        </p>
        <p className="mt-2 text-xs text-slate-400">Non disponible</p>
      </div>
    );
  }

  const normalized = Math.min(Math.max(value, 0), 100);
  const label =
    normalized >= 90 ? "Conforme" :
    normalized >= 75 ? "Quasi-conforme" :
    normalized >= 60 ? "En progression" : "Non-conforme";
  const badge =
    normalized >= 75 ? "bg-emerald-50 text-emerald-700" :
    normalized >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[11px] font-semibold text-slate-500">Taux moyen de conformité</p>
      <svg viewBox="0 0 120 120" className="h-24 w-24">
        <circle cx="60" cy="60" r="42" fill="none" stroke="#e5e7eb" strokeWidth="14" />
        <circle
          cx="60" cy="60" r="42"
          fill="none"
          stroke={PURPLE}
          strokeWidth="14"
          strokeDasharray={`${(normalized / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          className="transition-all duration-300"
        />
        <text x="60" y="65" textAnchor="middle" className="fill-gray-950 text-base font-bold">
          {normalized}%
        </text>
      </svg>
      <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${badge}`}>{label}</span>
    </div>
  );
}
