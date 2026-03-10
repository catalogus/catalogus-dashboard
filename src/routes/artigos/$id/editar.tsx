import { createFileRoute } from '@tanstack/react-router'
import { ArticleEditor } from '@/components/dashboard/article-editor'

export const Route = createFileRoute('/artigos/$id/editar')({
  component: EditArticlePage,
})

function EditArticlePage() {
  const { id } = Route.useParams()
  
  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <ArticleEditor postId={id} />
    </div>
  )
}
