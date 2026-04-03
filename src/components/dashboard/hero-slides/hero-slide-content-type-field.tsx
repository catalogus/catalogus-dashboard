import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ContentType } from "./hero-slide-types"

type HeroSlideContentTypeFieldProps = {
  contentType: ContentType
  onChange: (value: ContentType) => void
}

export function HeroSlideContentTypeField({ contentType, onChange }: HeroSlideContentTypeFieldProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="content_type">Tipo de Conteúdo</Label>
      <Select value={contentType} onValueChange={(value) => onChange(value as ContentType)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom">Personalizado</SelectItem>
          <SelectItem value="book">Destaque de Livro</SelectItem>
          <SelectItem value="author">Destaque de Autor</SelectItem>
          <SelectItem value="post">Destaque de Artigo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
