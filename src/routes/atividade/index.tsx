import { createFileRoute } from '@tanstack/react-router'
import { ActivityLogContent } from '@/components/dashboard/activity-log-content'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export const Route = createFileRoute('/atividade/')({
  component: AtividadePage,
})

function AtividadePage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
          <DashboardHeader />
          <main className="w-full flex-1 overflow-auto">
            <ActivityLogContent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
