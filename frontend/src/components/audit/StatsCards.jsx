import { Users, Settings, UserCheck, UserX } from "lucide-react"

const stats = [
  {
    icon: Users,
    iconBg: "bg-purple-50",
    iconColor: "text-[#6366f1]",
    label: "UTILISATEURS ACTIFS",
    value: "42",
    accent: true,
  },
  {
    icon: Settings,
    iconBg: "bg-purple-50",
    iconColor: "text-[#6366f1]",
    label: "PILOTES DE PROCESSUS",
    value: "7",
  },
  {
    icon: UserCheck,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    label: "AUDITEURS INTERNES",
    value: "4",
  },
  {
    icon: UserX,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    label: "COMPTES DÉSACTIVÉS",
    value: "3",
  },
]

export default function StatsCards() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-5 border border-gray-100 relative overflow-hidden"
        >
          {stat.accent && (
            <div className="absolute top-3 right-3 w-16 h-6 bg-gradient-to-r from-green-200 to-cyan-200 rounded-full opacity-60" />
          )}
          <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center mb-4`}>
            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
          </div>
          <p className="text-xs font-semibold text-gray-500 tracking-wide mb-1">{stat.label}</p>
          <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}