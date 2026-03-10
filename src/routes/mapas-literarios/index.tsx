import { createFileRoute } from '@tanstack/react-router'
import { MapasLiterariosContent } from '@/components/dashboard/mapas-literarios-content'
import { DashboardHeader } from '@/components/dashboard/header'

export const Route = createFileRoute('/mapas-literarios/')({
  component: MapasLiterariosPage,
})

function MapasLiterariosPage() {
  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
        <DashboardHeader />
        <main className="w-full flex-1 overflow-auto">
          <MapasLiterariosContent />
        </main>
      </div>
    </div>
  )
}
