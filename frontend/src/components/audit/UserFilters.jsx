import { Search, Download, Users, UserPlus, ChevronDown } from "lucide-react"

export default function UserFilters({ onCreateUser }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
          />
        </div>

        {/* Roles Filter */}
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <span>Tous les roles</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Services Filter */}
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <span>Tout les services</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Export Button */}
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
          <span>Exporter liste</span>
        </button>

        {/* Manage Roles Button */}
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <Users className="w-4 h-4" />
          <span>Gérer les rôles</span>
        </button>

        {/* Create User Button */}
        <button
          onClick={onCreateUser}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#6366f1] rounded-lg hover:bg-[#5558e3]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Créer utilisateur</span>
        </button>
      </div>
    </div>
  )
}