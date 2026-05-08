import { Search, Download, Users, UserPlus, ChevronDown } from "lucide-react";

export default function UserFilters({ onCreateUser }) {
  return (
    <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-64"
          />
        </div>

        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
          <span>Tous les roles</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
          <span>Tout les services</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
          <Download className="h-4 w-4" />
          <span>Exporter liste</span>
        </button>

        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
          <Users className="h-4 w-4" />
          <span>Gérer les rôles</span>
        </button>

        <button
          onClick={onCreateUser}
          className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-sm text-white transition hover:bg-[#5558e3]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Créer utilisateur</span>
        </button>
      </div>
    </div>
  );
}
