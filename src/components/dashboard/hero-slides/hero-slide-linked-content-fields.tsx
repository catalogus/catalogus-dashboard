import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ContentType, HeroContentOption, HeroPostOption } from "./hero-slide-types"

type HeroSlideLinkedContentFieldsProps = {
  contentType: ContentType
  contentId: string
  postSearchQuery: string
  searchablePostOptions: HeroPostOption[]
  contentOptions: HeroContentOption[]
  onPostSearchQueryChange: (value: string) => void
  onContentIdChange: (value: string) => void
}

export function HeroSlideLinkedContentFields({
  contentType,
  contentId,
  postSearchQuery,
  searchablePostOptions,
  contentOptions,
  onPostSearchQueryChange,
  onContentIdChange,
}: HeroSlideLinkedContentFieldsProps) {
  if (contentType === "custom") return null

  return (
    <div className="space-y-3">
      <Label>Selecionar {contentType === "book" ? "Livro" : contentType === "author" ? "Autor" : "Artigo"}</Label>
      {contentType === "post" && <Input value={postSearchQuery} onChange={(e) => onPostSearchQueryChange(e.target.value)} placeholder="Pesquisar artigo por titulo ou slug..." />}
      <Select value={contentId} onValueChange={onContentIdChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Selecione um ${contentType === "book" ? "livro" : contentType === "author" ? "autor" : "artigo"}`} />
        </SelectTrigger>
        <SelectContent>
          {contentType === "post"
            ? searchablePostOptions.map((post) => <SelectItem key={post.id} value={post.id}>{post.title}</SelectItem>)
            : contentOptions.map((item) => <SelectItem key={item.id} value={item.id}>{"name" in item ? item.name : item.title}</SelectItem>)}
        </SelectContent>
      </Select>
      {contentType === "post" && postSearchQuery.trim() && <p className="text-xs text-muted-foreground">{searchablePostOptions.length} artigo(s) encontrado(s)</p>}
      {(contentType === "post" ? searchablePostOptions.length : contentOptions.length) === 0 && (
        <p className="text-xs text-amber-600">Nenhum {contentType === "book" ? "livro" : contentType === "author" ? "autor em destaque" : "artigo publicado"} disponível.</p>
      )}
    </div>
  )
}
