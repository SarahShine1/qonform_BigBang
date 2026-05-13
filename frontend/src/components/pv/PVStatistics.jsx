import { BarChart3, FileText, CheckCircle } from "lucide-react";

export default function PVStatistics({ stats }) {
  const totalPVs = stats.total_pvs || 0;
  const byType = stats.by_type || {};

  const statCards = [
    {
      label: "Total PVs",
      value: totalPVs,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      label: "Suivis",
      value: byType.SUIVI || 0,
      icon: CheckCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    {
      label: "Revues avec DG",
      value: byType.REVUE_DG || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-lg border ${card.borderColor} ${card.bgColor} p-4`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-600 font-medium">{card.label}</p>
                <p className={`mt-2 text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
              <Icon className={`${card.color} h-8 w-8 opacity-20`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
