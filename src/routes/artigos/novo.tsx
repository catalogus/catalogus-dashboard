import { createFileRoute } from '@tanstack/react-router'
import { ArticleEditor } from '@/components/dashboard/article-editor'

export const Route = createFileRoute('/artigos/novo')({
  component: NewArticlePage,
})

function NewArticlePage() {
  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <ArticleEditor />
    </div>
  )
}
