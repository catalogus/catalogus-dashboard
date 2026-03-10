import { createFileRoute } from '@tanstack/react-router'
import { PedidosContent } from '@/components/dashboard/pedidos-content'
import { DashboardHeader } from '@/components/dashboard/header'
import { SuperAdminGuard } from '@/components/super-admin-guard'

export const Route = createFileRoute('/pedidos/')({
  component: PedidosPage,
})

function PedidosPage() {
  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
        <DashboardHeader />
        <main className="w-full flex-1 overflow-auto">
          <SuperAdminGuard>
            <PedidosContent />
          </SuperAdminGuard>
        </main>
      </div>
    </div>
  )
}
