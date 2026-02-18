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
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
        <ArticleEditor />
      </div>
    </SidebarProvider>
  )
}
