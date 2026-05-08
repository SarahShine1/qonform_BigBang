import { useState } from "react"
import AppLayout from "../../components/layout/AppLayout"
import AuditsSidebar from "../../components/audit/AuditsSidebar"
import StatsCards from "../../components/audit/StatsCards"
import UserFilters from "../../components/audit/UserFilters"
import CreateUserModal from "../../components/audit/CreateUserModal"

export default function MesAudits() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <AppLayout
      pageTitle="Mes audits"
      userName="Ahmed BENALI"
      userRole="Chef Cellule Qualité"
    >
      <div className="flex min-w-0 items-start gap-6 text-left">
        <AuditsSidebar />
        <div className="flex-1 min-w-0 space-y-6">
          <StatsCards />
          <UserFilters onCreateUser={() => setIsModalOpen(true)} />
        </div>
      </div>
      <CreateUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </AppLayout>
  )
}