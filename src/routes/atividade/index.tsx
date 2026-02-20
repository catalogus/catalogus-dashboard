import { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

const ActivityLogContent = lazy(async () => {
  const module = await import('@/components/dashboard/activity-log-content')
  return { default: module.ActivityLogContent }
})

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
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando activity log...</div>}>
              <ActivityLogContent />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
