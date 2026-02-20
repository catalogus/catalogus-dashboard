import { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider } from '@/components/ui/sidebar'

const MapasLiterariosContent = lazy(async () => {
  const module = await import('@/components/dashboard/mapas-literarios-content')
  return { default: module.MapasLiterariosContent }
})

export const Route = createFileRoute('/mapas-literarios/')({
  component: MapasLiterariosPage,
})

function MapasLiterariosPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
          <DashboardHeader />
          <main className="w-full flex-1 overflow-auto">
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando mapas literarios...</div>}>
              <MapasLiterariosContent />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
