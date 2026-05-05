import { OrgChart } from '../../components/OrgChart'
import { EmployeeTable } from '../../components/EmployeeTable'
import AppLayout from '../../components/layout/AppLayout'

export default function Organigramme() {
  return (
    <AppLayout pageTitle="Organigramme" userName="User Name" userRole="Admin">
      <div className="space-y-6">
        <OrgChart />
        <EmployeeTable />
      </div>
    </AppLayout>
  )
}