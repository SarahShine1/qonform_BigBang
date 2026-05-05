import { useState } from "react"
import { X, Eye, EyeOff, ChevronDown, Check } from "lucide-react"

export default function CreateUserModal({ isOpen, onClose }) {
  const [showPassword, setShowPassword] = useState(false)
  const [sendInvitation, setSendInvitation] = useState(true)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-xl shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Créer un nouvel utilisateur</h2>
            <p className="text-sm text-gray-500 mt-1">Renseignez les informations du compte qualité</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Row 1: Nom complet & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
              <input
                type="text"
                placeholder="ex: BOUALI RIMA"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email institutionnel</label>
              <input
                type="email"
                placeholder="j.dupont@esi.dz"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
              />
            </div>
          </div>

          {/* Row 2: Téléphone & Rôle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input
                type="tel"
                placeholder="+213..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
                <span className="text-gray-900">CAQ</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Row 3: Département & Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Département</label>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
                <span className="text-gray-900">Cellule Assurance Qualité</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
              <button className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
                <span className="text-gray-900">Actif</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Row 4: Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                defaultValue="********"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Checkbox */}
          <div className="bg-purple-50 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => setSendInvitation(!sendInvitation)}
                className={`w-5 h-5 rounded flex items-center justify-center ${
                  sendInvitation
                    ? "bg-[#6366f1] text-white"
                    : "border-2 border-gray-300 bg-white"
                }`}
              >
                {sendInvitation && <Check className="w-3.5 h-3.5" />}
              </button>
              <span className="text-sm text-[#6366f1] font-medium">
                Envoyer invitation par email à l&apos;utilisateur immédiatement.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Annuler
          </button>
          <button className="px-6 py-2.5 text-sm text-white bg-[#6366f1] rounded-lg hover:bg-[#5558e3]">
            Créer utilisateur
          </button>
        </div>
      </div>
    </div>
  )
}