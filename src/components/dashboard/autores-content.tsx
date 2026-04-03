import { useCallback, useState } from "react"
import { Plus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthorStats, useAuthors, useCreateAuthor, useDeleteAuthor, useUpdateAuthor } from "@/hooks/supabase/authors"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { supabase } from "@/lib/supabase"
import type { Author } from "@/lib/supabase"
import { toast } from "sonner"
import { AuthorDeleteDialog } from "./authors/author-delete-dialog"
import { AuthorDetailDialog } from "./authors/author-detail-dialog"
import { AuthorFormSheet, type AuthorFormValues } from "./authors/author-form-sheet"
import { AuthorListTable } from "./authors/author-list-table"
import { AuthorStatsCards } from "./authors/author-stats-cards"
import { AuthorsPagination } from "./authors/authors-pagination"

const PAGE_SIZE = 10

function getVisiblePages(page: number, totalPages: number): Array<number | "ellipsis"> {
  const visible: Array<number | "ellipsis"> = []
  const maxVisible = 5
  if (totalPages <= maxVisible) {
    for (let current = 1; current <= totalPages; current += 1) visible.push(current)
    return visible
  }
  if (page <= 3) {
    for (let current = 1; current <= 4; current += 1) visible.push(current)
    visible.push("ellipsis", totalPages)
    return visible
  }
  if (page >= totalPages - 2) {
    visible.push(1, "ellipsis")
    for (let current = totalPages - 3; current <= totalPages; current += 1) visible.push(current)
    return visible
  }

  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages]
}

export function AutoresContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [viewingAuthor, setViewingAuthor] = useState<Author | null>(null)
  const [pendingDeleteAuthor, setPendingDeleteAuthor] = useState<Author | null>(null)
  const [isSavingPhoto, setIsSavingPhoto] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const { data: authorsData, isLoading } = useAuthors(page, PAGE_SIZE, debouncedSearch)
  const { data: stats } = useAuthorStats()
  const createMutation = useCreateAuthor()
  const updateMutation = useUpdateAuthor()
  const deleteMutation = useDeleteAuthor()

  const authors = authorsData?.data || []
  const totalPages = authorsData?.totalPages || 1
  const totalCount = authorsData?.totalCount || 0

  const resolvePhotoUrl = useCallback((photoUrl: string | null, photoPath: string | null) => {
    if (photoUrl) return photoUrl
    return photoPath ? supabase.storage.from("author-photos").getPublicUrl(photoPath).data.publicUrl : null
  }, [])

  const uploadAuthorPhoto = async (targetFile: File, ownerId: string) => {
    const safeName = targetFile.name.replace(/\s+/g, "-")
    const path = `${ownerId}/${Date.now()}-${safeName}`
    const { error: uploadError } = await supabase.storage
      .from("author-photos")
      .upload(path, targetFile, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from("author-photos").getPublicUrl(path)
    return { path, publicUrl: data.publicUrl }
  }

  const resetSheetState = () => {
    setIsSheetOpen(false)
    setEditingAuthor(null)
  }

  const handleCreate = () => {
    setEditingAuthor(null)
    setIsSheetOpen(true)
  }

  const handleView = (author: Author) => {
    setViewingAuthor(author)
    setIsDetailOpen(true)
  }

  const handleEdit = (author: Author) => {
    setViewingAuthor(null)
    setIsDetailOpen(false)
    setEditingAuthor(author)
    setIsSheetOpen(true)
  }

  const handleRequestDelete = (author: Author) => {
    setViewingAuthor(null)
    setIsDetailOpen(false)
    setPendingDeleteAuthor(author)
  }

  const handleSubmit = async (values: AuthorFormValues, photoFile: File | null) => {
    try {
      setIsSavingPhoto(!!photoFile)

      let nextPhotoPath = editingAuthor?.photo_path || null
      let nextPhotoUrl = editingAuthor?.photo_url || null

      if (photoFile) {
        if (editingAuthor?.photo_path) {
          await supabase.storage.from("author-photos").remove([editingAuthor.photo_path])
        }

        const uploaded = await uploadAuthorPhoto(photoFile, editingAuthor?.id || `author-${Date.now()}`)
        nextPhotoPath = uploaded.path
        nextPhotoUrl = uploaded.publicUrl
      }

      const mutationPromise = editingAuthor
        ? updateMutation.mutateAsync({ id: editingAuthor.id, ...values, photo_url: nextPhotoUrl, photo_path: nextPhotoPath })
        : createMutation.mutateAsync({ ...values, photo_url: nextPhotoUrl, photo_path: nextPhotoPath })

      toast.promise(mutationPromise, {
        loading: editingAuthor ? "A guardar autor..." : "A criar autor...",
        success: editingAuthor ? "Autor actualizado com sucesso" : "Autor criado com sucesso",
        error: (error) => error instanceof Error ? error.message : "Falha ao guardar autor",
      })

      await mutationPromise
      resetSheetState()
    } catch (error) {
      console.error("Failed saving author:", error)
    } finally {
      setIsSavingPhoto(false)
    }
  }

  const handleDelete = async (author: Author) => {
    const deletePromise = deleteMutation.mutateAsync(author.id)
    toast.promise(deletePromise, {
      loading: "A excluir autor...",
      success: "Autor excluido com sucesso",
      error: (error) => error instanceof Error ? error.message : "Falha ao excluir autor",
    })

    await deletePromise
    setPendingDeleteAuthor(null)
  }

  if (isLoading && !authorsData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando autores...</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Comunidade</p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Autores ({stats?.total || 0})</h1>
          </div>
          <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700" onClick={handleCreate}>
            <Plus className="size-4" />
            Adicionar autor
          </Button>
        </div>

        <AuthorStatsCards
          total={stats?.total || 0}
          featured={stats?.featured || 0}
          linkedProfiles={stats?.linkedProfiles || 0}
          pendingClaims={stats?.pendingClaims || 0}
        />

        <div className="relative flex-1">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar autores..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>

        <div className="text-sm text-muted-foreground">{totalCount} autores encontrados</div>

        <AuthorListTable
          authors={authors}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleRequestDelete}
        />

        <AuthorsPagination
          page={page}
          totalPages={totalPages}
          visiblePages={getVisiblePages(page, totalPages)}
          onPageChange={setPage}
        />
      </div>

      <AuthorDetailDialog
        author={viewingAuthor}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEdit}
        onDelete={handleRequestDelete}
      />

      <AuthorDeleteDialog
        author={pendingDeleteAuthor}
        open={!!pendingDeleteAuthor}
        deleting={deleteMutation.isPending}
        onOpenChange={(open) => !open && setPendingDeleteAuthor(null)}
        onConfirm={(author) => void handleDelete(author)}
      />

      <AuthorFormSheet
        author={editingAuthor}
        open={isSheetOpen}
        submitting={createMutation.isPending || updateMutation.isPending || isSavingPhoto}
        onOpenChange={(open) => (open ? setIsSheetOpen(true) : resetSheetState())}
        onSubmit={handleSubmit}
        resolvePhotoUrl={resolvePhotoUrl}
      />
    </div>
  )
}
