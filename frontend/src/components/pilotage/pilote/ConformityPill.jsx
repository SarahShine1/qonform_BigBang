export default function ConformityPill({ value }) {
  const cls =
    value >= 75 ? "bg-emerald-50 text-emerald-700" :
    value >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>
      {value}%
    </span>
  );
}
