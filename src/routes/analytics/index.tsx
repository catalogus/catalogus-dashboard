import { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

const AnalyticsContent = lazy(async () => {
  const module = await import('@/components/dashboard/analytics-content')
  return { default: module.AnalyticsContent }
})

export const Route = createFileRoute('/analytics/')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
          <DashboardHeader />
          <main className="w-full flex-1 overflow-auto">
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando analytics...</div>}>
              <AnalyticsContent />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
