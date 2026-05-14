export default function NcBadge({ value }) {
  if (!value) return <span className="text-[12px] font-semibold text-slate-400">0</span>;
  return (
    <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
      {value}
    </span>
  );
}
