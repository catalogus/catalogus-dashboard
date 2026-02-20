import { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider } from '@/components/ui/sidebar'

const AutoresContent = lazy(async () => {
  const module = await import('@/components/dashboard/autores-content')
  return { default: module.AutoresContent }
})

export const Route = createFileRoute('/autores/')({
  component: AutoresPage,
})

function AutoresPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
          <DashboardHeader />
          <main className="w-full flex-1 overflow-auto">
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando autores...</div>}>
              <AutoresContent />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
