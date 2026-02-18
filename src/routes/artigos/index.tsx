import { createFileRoute } from '@tanstack/react-router'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { ArtigosContent } from '@/components/dashboard/artigos-content'
import { SidebarProvider } from '@/components/ui/sidebar'

export const Route = createFileRoute('/artigos/')({
  component: ArtigosPage,
})

function ArtigosPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
          <DashboardHeader />
          <main className="w-full flex-1 overflow-auto">
            <ArtigosContent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
