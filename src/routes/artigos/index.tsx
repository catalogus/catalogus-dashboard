import { createFileRoute } from '@tanstack/react-router'
import { ArtigosContent } from '@/components/dashboard/artigos-content'
import { DashboardHeader } from '@/components/dashboard/header'

export const Route = createFileRoute('/artigos/')({
  component: ArtigosPage,
})

function ArtigosPage() {
  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
        <DashboardHeader />
        <main className="w-full flex-1 overflow-auto">
          <ArtigosContent />
        </main>
      </div>
    </div>
  )
}
