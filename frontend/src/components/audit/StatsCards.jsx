import { Users, Settings, UserCheck, UserX } from "lucide-react";

const stats = [
  {
    icon: Users,
    iconBg: "bg-purple-50 dark:bg-violet-950",
    iconColor: "text-[#6366f1] dark:text-violet-300",
    label: "UTILISATEURS ACTIFS",
    value: "42",
    accent: true,
  },
  {
    icon: Settings,
    iconBg: "bg-purple-50 dark:bg-violet-950",
    iconColor: "text-[#6366f1] dark:text-violet-300",
    label: "PILOTES DE PROCESSUS",
    value: "7",
  },
  {
    icon: UserCheck,
    iconBg: "bg-orange-50 dark:bg-orange-950",
    iconColor: "text-orange-500 dark:text-orange-300",
    label: "AUDITEURS INTERNES",
    value: "4",
  },
  {
    icon: UserX,
    iconBg: "bg-red-50 dark:bg-rose-950",
    iconColor: "text-red-500 dark:text-rose-300",
    label: "COMPTES DÉSACTIVÉS",
    value: "3",
  },
];

export default function StatsCards() {
  return (
    <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-white p-4 transition-colors dark:border-slate-800 dark:bg-slate-900"
        >
          {stat.accent ? (
            <div className="absolute right-3 top-3 h-5 w-12 rounded-full bg-gradient-to-r from-green-200 to-cyan-200 opacity-60" />
          ) : null}
          <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg}`}>
            <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
          </div>
          <p className="mb-1 text-[11px] font-semibold tracking-[0.16em] text-slate-500 dark:text-slate-400">{stat.label}</p>
          <p className="text-[30px] font-bold leading-none text-slate-900 dark:text-slate-100">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
