export default function KpiCard({ icon: Icon, label, value, color, bg, onClick }) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm transition ${onClick ? "cursor-pointer hover:shadow-md hover:border-violet-200" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 leading-4">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </span>
      </div>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}
