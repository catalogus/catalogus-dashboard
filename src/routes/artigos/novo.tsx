import { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

const ArticleEditor = lazy(async () => {
  const module = await import('@/components/dashboard/article-editor')
  return { default: module.ArticleEditor }
})

export const Route = createFileRoute('/artigos/novo')({
  component: NewArticlePage,
})

function NewArticlePage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando editor...</div>}>
          <ArticleEditor />
        </Suspense>
      </div>
    </SidebarProvider>
  )
}
