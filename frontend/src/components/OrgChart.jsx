import { Plus } from 'lucide-react'
import { Button } from './ui/Button'

const departments = [
  {
    name: 'Ressources Humaines',
    person: 'Mme. Fatima AMARA',
    code: 'RH',
    color: 'border-orange-400',
    codeBg: 'bg-orange-100',
    codeColor: 'text-orange-500',
  },
  {
    name: 'Cellule Qualité',
    person: 'Ahmed BENALI',
    code: 'CQ',
    color: 'border-purple-500',
    codeBg: 'bg-purple-100',
    codeColor: 'text-purple-600',
  },
  {
    name: 'Informatique',
    person: 'M. Youcef SAIDI',
    code: 'IT',
    color: 'border-gray-300',
    codeBg: 'bg-gray-100',
    codeColor: 'text-gray-500',
  },
  {
    name: 'Finance',
    person: 'Mme. Nadia BELKAD',
    code: 'FI',
    color: 'border-gray-300',
    codeBg: 'bg-pink-100',
    codeColor: 'text-pink-500',
  },
]

export function OrgChart() {
  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Structure organisationnelle</h2>
        <Button className="bg-[#6366f1] hover:bg-[#5558e8] text-white text-sm h-10 px-4">
          <Plus className="w-4 h-4 mr-1" />
          Créer l&apos;organigramme
        </Button>
      </div>

      {/* Org Chart */}
      <div className="flex flex-col items-center">
        {/* Top Level - Direction Générale */}
        <div className="border-2 border-yellow-400 rounded-lg p-4 text-center min-w-[160px] mb-4">
          <p className="font-semibold text-gray-900 text-sm">Direction Générale</p>
          <p className="text-gray-500 text-xs mt-1">M. Larbi KACI</p>
          <span className="inline-block mt-2 px-3 py-0.5 bg-yellow-100 text-yellow-600 text-xs font-medium rounded">
            DG
          </span>
        </div>

        {/* Vertical line */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Horizontal connector */}
        <div className="relative w-[700px]">
          <div className="absolute top-0 left-[88px] right-[88px] h-px bg-gray-300" />
          <div className="absolute top-0 left-[88px] w-px h-6 bg-gray-300" />
          <div className="absolute top-0 left-[262px] w-px h-6 bg-gray-300" />
          <div className="absolute top-0 right-[262px] w-px h-6 bg-gray-300" />
          <div className="absolute top-0 right-[88px] w-px h-6 bg-gray-300" />
        </div>

        {/* Department Cards */}
        <div className="flex gap-4 mt-6">
          {departments.map((dept) => (
            <div
              key={dept.code}
              className={`border-2 ${dept.color} rounded-lg p-4 text-center min-w-[150px]`}
            >
              <p className="font-semibold text-gray-900 text-sm">{dept.name}</p>
              <p className="text-gray-500 text-xs mt-1">{dept.person}</p>
              <span
                className={`inline-block mt-2 px-3 py-0.5 ${dept.codeBg} ${dept.codeColor} text-xs font-medium rounded`}
              >
                {dept.code}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}