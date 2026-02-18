import { createFileRoute } from '@tanstack/react-router'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { HeroSlidesContent } from '@/components/dashboard/hero-slides-content'
import { SidebarProvider } from '@/components/ui/sidebar'

export const Route = createFileRoute('/hero-slides/')({
  component: HeroSlidesPage,
})

function HeroSlidesPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
          <DashboardHeader />
          <main className="w-full flex-1 overflow-auto">
            <HeroSlidesContent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
