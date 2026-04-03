import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useAuthorsForHero,
  useBooksForHero,
  useCreateHeroSlide,
  useDeleteHeroSlide,
  useHeroSlides,
  usePostsForHero,
  useUpdateHeroSlide,
} from "@/hooks/supabase/hero-slides"
import { useUploadFile } from "@/hooks/supabase/upload"
import type { HeroSlide } from "@/lib/supabase"
import { toast } from "sonner"
import { HeroSlideDeleteDialog } from "./hero-slides/hero-slide-delete-dialog"
import { HeroSlideDetailDialog } from "./hero-slides/hero-slide-detail-dialog"
import { HeroSlideFormSheet } from "./hero-slides/hero-slide-form-sheet"
import { getLinkedContentName, type HeroSlideFormValues } from "./hero-slides/hero-slide-types"
import { HeroSlidesTable } from "./hero-slides/hero-slides-table"

export function HeroSlidesContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [viewingSlide, setViewingSlide] = useState<HeroSlide | null>(null)
  const [pendingDeleteSlide, setPendingDeleteSlide] = useState<HeroSlide | null>(null)

  const { data: slides, isLoading } = useHeroSlides()
  const { data: books } = useBooksForHero()
  const { data: authors } = useAuthorsForHero()
  const { data: posts } = usePostsForHero()

  const createMutation = useCreateHeroSlide()
  const updateMutation = useUpdateHeroSlide()
  const deleteMutation = useDeleteHeroSlide()
  const uploadMutation = useUploadFile()

  const linkedContentName = useMemo(
    () => (slide: HeroSlide) => getLinkedContentName(slide, books, authors, posts),
    [authors, books, posts],
  )

  const resetSheetState = () => {
    setIsSheetOpen(false)
    setEditingSlide(null)
  }

  const handleCreate = () => {
    setEditingSlide(null)
    setIsSheetOpen(true)
  }

  const handleView = (slide: HeroSlide) => {
    setViewingSlide(slide)
    setIsDetailOpen(true)
  }

  const handleEdit = (slide: HeroSlide) => {
    setViewingSlide(null)
    setIsDetailOpen(false)
    setEditingSlide(slide)
    setIsSheetOpen(true)
  }

  const handleRequestDelete = (slide: HeroSlide) => {
    setViewingSlide(null)
    setIsDetailOpen(false)
    setPendingDeleteSlide(slide)
  }

  const handleSubmit = async (values: HeroSlideFormValues, imageFile: File | null) => {
    try {
      let background_image_url = values.background_image_url
      let background_image_path = values.background_image_path

      if (imageFile) {
        const path = `hero-backgrounds/${Date.now()}-${imageFile.name}`
        try {
          const url = await uploadMutation.mutateAsync({ file: imageFile, bucket: "hero-backgrounds", folder: "" })
          background_image_url = url
          background_image_path = path
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Erro ao fazer upload da imagem")
          return
        }
      }

      const slideData = {
        title: values.title,
        subtitle: values.subtitle || null,
        description: values.description || null,
        cta_text: values.cta_text || null,
        cta_url: values.cta_url || null,
        background_image_url,
        background_image_path,
        accent_color: values.accent_color || null,
        content_type: values.content_type,
        content_id: values.content_id || null,
        order_weight: values.order_weight,
        is_active: values.is_active,
      }

      const mutationPromise = editingSlide
        ? updateMutation.mutateAsync({ id: editingSlide.id, ...slideData })
        : createMutation.mutateAsync(slideData)

      toast.promise(mutationPromise, {
        loading: editingSlide ? "A guardar slide..." : "A criar slide...",
        success: editingSlide ? "Slide actualizado com sucesso" : "Slide criado com sucesso",
        error: (error) => error instanceof Error ? error.message : "Falha ao guardar slide",
      })

      await mutationPromise
      resetSheetState()
    } catch (error) {
      console.error("Failed saving hero slide:", error)
    }
  }

  const handleDelete = async (slide: HeroSlide) => {
    const deletePromise = deleteMutation.mutateAsync(slide.id)
    toast.promise(deletePromise, {
      loading: "A excluir slide...",
      success: "Slide excluido com sucesso",
      error: (error) => error instanceof Error ? error.message : "Falha ao excluir slide",
    })

    await deletePromise
    setPendingDeleteSlide(null)
  }

  const handleToggleActive = async (slide: HeroSlide) => {
    const promise = updateMutation.mutateAsync({ id: slide.id, is_active: !slide.is_active })
    toast.promise(promise, {
      loading: "A actualizar slide...",
      success: slide.is_active ? "Slide desactivado" : "Slide activado",
      error: "Falha ao actualizar slide",
    })
    await promise
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando slides...</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conteúdo</p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Slides do Hero</h1>
          </div>
          <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700" onClick={handleCreate}>
            <Plus className="size-4" />
            Novo Slide
          </Button>
        </div>

        <HeroSlidesTable
          slides={slides || []}
          getLinkedContentName={linkedContentName}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleRequestDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      <HeroSlideDetailDialog
        slide={viewingSlide}
        open={isDetailOpen}
        getLinkedContentName={linkedContentName}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEdit}
        onDelete={handleRequestDelete}
      />

      <HeroSlideDeleteDialog
        slide={pendingDeleteSlide}
        open={!!pendingDeleteSlide}
        deleting={deleteMutation.isPending}
        onOpenChange={(open) => !open && setPendingDeleteSlide(null)}
        onConfirm={(slide) => void handleDelete(slide)}
      />

      <HeroSlideFormSheet
        open={isSheetOpen}
        editingSlide={editingSlide}
        books={books || []}
        authors={authors || []}
        posts={posts || []}
        submitting={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
        onOpenChange={(open) => (open ? setIsSheetOpen(true) : resetSheetState())}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
