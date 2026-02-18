import { createFileRoute } from '@tanstack/react-router'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ArticleEditor } from '@/components/dashboard/article-editor'

export const Route = createFileRoute('/artigos/novo')({
  component: NewArticlePage,
})

function NewArticlePage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
          <ArticleEditor />
        </div>
      </div>
    </SidebarProvider>
  )
}
