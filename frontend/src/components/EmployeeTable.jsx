import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/Table'

const employees = [
  {
    name: 'Larbi KACI',
    email: 'l.kaci@qonforme.dz',
    matricule: 'EMP-001',
    poste: 'Directeur Général',
    departement: 'Direction Générale',
    departementColor: 'bg-green-100 text-green-700 border-green-200',
    statut: 'Actif',
    statutColor: 'text-green-600',
  },
  {
    name: 'Fatima AMARA',
    email: 'f.amara@qonforme.dz',
    matricule: 'EMP-002',
    poste: 'Responsable RH',
    departement: 'Ressources Humaines',
    departementColor: 'bg-orange-100 text-orange-700 border-orange-200',
    statut: 'Actif',
    statutColor: 'text-green-600',
  },
  {
    name: 'Ahmed BENALI',
    email: 'a.benali@qonforme.dz',
    matricule: 'EMP-003',
    poste: 'Chef Cellule Qualité',
    departement: 'Cellule Qualité',
    departementColor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    statut: 'Actif',
    statutColor: 'text-green-600',
  },
  {
    name: 'Youcef SAIDI',
    email: 'y.saidi@qonforme.dz',
    matricule: 'EMP-004',
    poste: 'Responsable IT',
    departement: 'Informatique',
    departementColor: 'bg-blue-100 text-blue-700 border-blue-200',
    statut: 'Actif',
    statutColor: 'text-green-600',
  },
  {
    name: 'Nadia BELKAD',
    email: 'n.belkad@qonforme.dz',
    matricule: 'EMP-005',
    poste: 'Directrice Financière',
    departement: 'Finance',
    departementColor: 'bg-pink-100 text-pink-700 border-pink-200',
    statut: 'Inactif',
    statutColor: 'text-gray-500',
  },
]

export function EmployeeTable() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Liste des employés</h2>
        <Button
          variant="outline"
          className="border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1]/5 text-sm h-10 px-4"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter employé
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-100 hover:bg-transparent">
            <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Nom &amp; Prénom
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Matricule
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Poste
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Département
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Statut
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow
              key={employee.matricule}
              className="border-b border-gray-50 hover:bg-gray-50/50"
            >
              <TableCell className="py-4">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{employee.name}</p>
                  <p className="text-gray-400 text-xs">{employee.email}</p>
                </div>
              </TableCell>
              <TableCell className="text-gray-600 text-sm">{employee.matricule}</TableCell>
              <TableCell className="text-gray-600 text-sm">{employee.poste}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${employee.departementColor}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                  {employee.departement}
                </span>
              </TableCell>
              <TableCell>
                <span className={`text-sm font-medium ${employee.statutColor}`}>
                  {employee.statut}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}