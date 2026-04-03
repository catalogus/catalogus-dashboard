import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { validateAndOptimizeImage } from "@/lib/imageOptimization"
import type { HeroSlide } from "@/lib/supabase"
import { toast } from "sonner"
import { HeroSlideContentTypeField } from "./hero-slide-content-type-field"
import { HeroSlideImageField } from "./hero-slide-image-field"
import { HeroSlideLinkedContentFields } from "./hero-slide-linked-content-fields"
import {
  createHeroSlideFormValues,
  defaultHeroSlideFormValues,
  type ContentType,
  type HeroAuthorOption,
  type HeroBookOption,
  type HeroContentOption,
  type HeroPostOption,
  type HeroSlideFormValues,
} from "./hero-slide-types"

type OptimizationStats = {
  originalSizeMB: string
  optimizedSizeMB: string
}

type HeroSlideFormSheetProps = {
  open: boolean
  editingSlide: HeroSlide | null
  books: HeroBookOption[]
  authors: HeroAuthorOption[]
  posts: HeroPostOption[]
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: HeroSlideFormValues, imageFile: File | null) => Promise<void>
}

export function HeroSlideFormSheet({
  open,
  editingSlide,
  books,
  authors,
  posts,
  submitting,
  onOpenChange,
  onSubmit,
}: HeroSlideFormSheetProps) {
  const [formData, setFormData] = useState<HeroSlideFormValues>(defaultHeroSlideFormValues)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isOptimizingImage, setIsOptimizingImage] = useState(false)
  const [optimizationStats, setOptimizationStats] = useState<OptimizationStats | null>(null)
  const [postSearchQuery, setPostSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const nextValues = createHeroSlideFormValues(editingSlide)
    setFormData(nextValues)
    setImageFile(null)
    setImagePreview(nextValues.background_image_url || null)
    setIsOptimizingImage(false)
    setOptimizationStats(null)
    setPostSearchQuery("")
  }, [editingSlide, open])

  useEffect(() => {
    if (formData.content_type === "custom" || !formData.content_id) return

    let autoUrl = ""
    switch (formData.content_type) {
      case "book":
        autoUrl = `/livro/${formData.content_id}`
        break
      case "author":
        autoUrl = `/autor/${formData.content_id}`
        break
      case "post": {
        const selectedPost = posts.find((post) => post.id === formData.content_id)
        autoUrl = selectedPost?.slug ? `/noticias/${selectedPost.slug}` : ""
        break
      }
    }

    if (autoUrl && formData.cta_url !== autoUrl) {
      setFormData((current) => ({ ...current, cta_url: autoUrl }))
    }
  }, [formData.content_type, formData.content_id, formData.cta_url, posts])

  const handleFieldChange = (field: keyof HeroSlideFormValues, value: string | number | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    if (!selected) {
      setImageFile(null)
      setImagePreview(formData.background_image_url || null)
      setOptimizationStats(null)
      return
    }

    setIsOptimizingImage(true)
    setOptimizationStats(null)

    try {
      const originalSizeMB = (selected.size / 1024 / 1024).toFixed(2)
      const optimizedFile = await validateAndOptimizeImage(selected, "heroBackground")
      const optimizedSizeMB = (optimizedFile.size / 1024 / 1024).toFixed(2)

      setImageFile(optimizedFile)
      setImagePreview(URL.createObjectURL(optimizedFile))
      setOptimizationStats({ originalSizeMB, optimizedSizeMB })
      toast.success(`Imagem otimizada: ${originalSizeMB}MB -> ${optimizedSizeMB}MB`)
    } catch (error) {
      console.error("Image optimization error:", error)
      toast.error(error instanceof Error ? error.message : "Falha ao otimizar imagem")
      setImageFile(null)
      setImagePreview(formData.background_image_url || null)
      setOptimizationStats(null)
      event.target.value = ""
    } finally {
      setIsOptimizingImage(false)
    }
  }

  const getContentOptions = (): HeroContentOption[] => {
    switch (formData.content_type) {
      case "book":
        return books
      case "author":
        return authors
      case "post":
        return posts
      default:
        return []
    }
  }

  const filteredPosts = posts.filter((post) => {
    const query = postSearchQuery.trim().toLowerCase()
    if (!query) return true
    return post.title.toLowerCase().includes(query) || (post.slug ?? "").toLowerCase().includes(query)
  })

  const selectedPost = posts.find((post) => post.id === formData.content_id)
  const searchablePostOptions = selectedPost && !filteredPosts.some((post) => post.id === selectedPost.id)
    ? [selectedPost, ...filteredPosts]
    : filteredPosts

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex h-full sm:h-screen flex-col overflow-hidden">
        <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
          <SheetTitle>{editingSlide ? "Editar Slide" : "Novo Hero Slide"}</SheetTitle>
          <SheetDescription>Crie e gerencie slides do hero para o carrossel da homepage.</SheetDescription>
        </SheetHeader>

        <form onSubmit={(event) => {
          event.preventDefault()
          void onSubmit(formData, imageFile)
        }} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <HeroSlideImageField
              fileInputRef={fileInputRef}
              isOptimizingImage={isOptimizingImage}
              imageFile={imageFile}
              imagePreview={imagePreview}
              optimizationStats={optimizationStats}
              onImageSelect={handleImageSelect}
            />

            <div className="space-y-3">
              <Label htmlFor="title">Título <span className="text-destructive">*</span></Label>
              <Input id="title" value={formData.title} onChange={(e) => handleFieldChange("title", e.target.value)} placeholder="Digite o título do slide" required />
            </div>

            <div className="space-y-3">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input id="subtitle" value={formData.subtitle} onChange={(e) => handleFieldChange("subtitle", e.target.value)} placeholder="Digite o subtítulo (opcional)" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => handleFieldChange("description", e.target.value)} placeholder="Breve descrição do slide" rows={3} />
            </div>

            <div className="space-y-3">
              <Label htmlFor="cta_text">Texto do Botão</Label>
              <Input id="cta_text" value={formData.cta_text} onChange={(e) => handleFieldChange("cta_text", e.target.value)} placeholder="ex: Explorar, Ver Mais, Saber Mais" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="cta_url">URL do Botão</Label>
              <Input id="cta_url" value={formData.cta_url} onChange={(e) => handleFieldChange("cta_url", e.target.value)} placeholder="/livros, /autores, https://..." disabled={formData.content_type !== "custom" && !!formData.content_id} />
              {formData.content_type !== "custom" && formData.content_id && <p className="text-xs text-blue-600">Preenchido automaticamente. Mude para "Personalizado" para editar manualmente.</p>}
            </div>

            <HeroSlideContentTypeField
              contentType={formData.content_type}
              onChange={(value) => {
                handleFieldChange("content_type", value as ContentType)
                handleFieldChange("content_id", "")
                setPostSearchQuery("")
                if (value !== "author" && value !== "book") handleFieldChange("accent_color", "")
              }}
            />

            <HeroSlideLinkedContentFields
              contentType={formData.content_type}
              contentId={formData.content_id}
              postSearchQuery={postSearchQuery}
              searchablePostOptions={searchablePostOptions}
              contentOptions={getContentOptions()}
              onPostSearchQueryChange={setPostSearchQuery}
              onContentIdChange={(value) => handleFieldChange("content_id", value)}
            />

            {(formData.content_type === "author" || formData.content_type === "book") && (
              <div className="space-y-3">
                <Label>Cor de Destaque</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(formData.accent_color) ? formData.accent_color : "#4b5563"} onChange={(e) => handleFieldChange("accent_color", e.target.value)} className="h-10 w-14 cursor-pointer rounded border bg-background" />
                  <Input value={formData.accent_color} onChange={(e) => handleFieldChange("accent_color", e.target.value)} placeholder="#4b5563" />
                </div>
                <p className="text-xs text-muted-foreground">Usada como fundo para slides de destaque.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="order_weight">Peso da Ordem</Label>
                <Input id="order_weight" type="number" value={formData.order_weight} onChange={(e) => handleFieldChange("order_weight", parseInt(e.target.value) || 0)} min="0" />
                <p className="text-xs text-muted-foreground">Números menores aparecem primeiro</p>
              </div>

              <div className="space-y-3">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleFieldChange("is_active", checked === true)} />
                  <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">Ativo (visível na homepage)</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-background shrink-0">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={submitting || isOptimizingImage}>
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                {editingSlide ? "Guardar" : "Criar Slide"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
