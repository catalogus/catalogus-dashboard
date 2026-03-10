import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  FileEdit,
  Trash2,
  ExternalLink,
  FileText,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  usePublications,
  usePublicationStats,
} from '@/hooks/supabase/publications'
import { useLongLoading } from '@/hooks/use-long-loading'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { supabase, type Json, type Publication } from '@/lib/supabase'
import {
  type ProcessingProgress,
  type PublicationFormValues,
  type TableOfContentsItem,
} from '@/types/publication'
import { PublicationForm } from '@/components/dashboard/publication-form'
import { toast } from 'sonner'

type PdfHelpersModule = typeof import('@/lib/pdfHelpers')

let pdfHelpersPreloadPromise: Promise<PdfHelpersModule> | null = null

const preloadPdfHelpers = () => {
  if (!pdfHelpersPreloadPromise) {
    pdfHelpersPreloadPromise = import('@/lib/pdfHelpers')
  }
  return pdfHelpersPreloadPromise
}

const deletePublicationClientSide = async (id: string) => {
  const { data: pages } = await supabase.storage.from('publications').list(`${id}/pages`)
  if (pages?.length) {
    await supabase
      .storage
      .from('publications')
      .remove(pages.map((f) => `${id}/pages/${f.name}`))
  }

  const { data: thumbs } = await supabase.storage.from('publications').list(`${id}/thumbnails`)
  if (thumbs?.length) {
    await supabase
      .storage
      .from('publications')
      .remove(thumbs.map((f) => `${id}/thumbnails/${f.name}`))
  }

  await supabase.storage.from('publications').remove([`${id}/original.pdf`])

  const { error } = await supabase.from('publications').delete().eq('id', id)
  if (error) throw error
}

const deletePublicationViaApi = async (id: string) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Missing session for publication delete')
  }

  const response = await fetch(`/api/publications/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error((await response.text()) || 'Failed to delete publication')
  }
}

const buildSeoTitle = (value?: string | null) => {
  const title = value?.trim()
  return title ? title : null
}

const buildSeoDescription = (value?: string | null) => {
  const cleaned = value
    ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : ''
  if (!cleaned) return null
  const maxLength = 160
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength).trim()}...`
}

const normalizeToc = (value: unknown): TableOfContentsItem[] => {
  if (!Array.isArray(value)) return []
  return value as TableOfContentsItem[]
}

export function MapasLiterariosContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editingPublication, setEditingPublication] = useState<Publication | null>(
    null,
  )
  const [viewingPublication, setViewingPublication] = useState<Publication | null>(
    null,
  )
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress>({
    status: 'idle',
  })
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false)
  const [pendingReplace, setPendingReplace] = useState<{
    values: PublicationFormValues
    pdfFile: File | null
  } | null>(null)

  const queryClient = useQueryClient()
  const { data: publications, isLoading, isFetching, error, refetch } = usePublications()
  const { data: stats } = usePublicationStats()
  const isLongLoading = useLongLoading(isLoading, 7000)

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.publications.all() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.publications.stats() }),
    ])
  }

  const handleSavePublication = async (
    values: PublicationFormValues,
    pdfFile: File | null,
  ) => {
    const publicationId = editingPublication?.id ?? crypto.randomUUID()
    const seo_title = buildSeoTitle(values.seo_title || values.title)
    const seo_description = buildSeoDescription(values.seo_description || values.description)

    let pdf_path = editingPublication?.pdf_path ?? ''
    let pdf_url = editingPublication?.pdf_url ?? ''
    let cover_path = editingPublication?.cover_path ?? ''
    let cover_url = editingPublication?.cover_url ?? ''
    let page_count = editingPublication?.page_count ?? 0
    let file_size_bytes = editingPublication?.file_size_bytes ?? null
    let tableOfContents = normalizeToc(values.table_of_contents)
    let publicationInserted = false

    try {
      if (pdfFile) {
        const {
          dataUrlToBlob,
          extractPdfOutline,
          renderAllPages,
        } = await preloadPdfHelpers()

        setProcessingProgress({ status: 'uploading' })

        const pdfFileName = `${publicationId}/original.pdf`
        const { error: uploadError } = await supabase.storage
          .from('publications')
          .upload(pdfFileName, pdfFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: pdfUrlData } = supabase.storage
          .from('publications')
          .getPublicUrl(pdfFileName)

        pdf_path = pdfFileName
        pdf_url = pdfUrlData.publicUrl
        file_size_bytes = pdfFile.size

        setProcessingProgress({ status: 'processing' })

        if (!tableOfContents || tableOfContents.length === 0) {
          tableOfContents = await extractPdfOutline(pdf_url)
        }

        if (!editingPublication) {
          const { error: insertError } = await supabase.from('publications').insert({
            id: publicationId,
            title: values.title,
            slug: values.slug,
            description: values.description || null,
            pdf_path,
            pdf_url,
            file_size_bytes,
            table_of_contents: tableOfContents as Json,
            display_mode: values.display_mode,
            page_width: values.page_width,
            page_height: values.page_height,
            is_active: values.is_active,
            is_featured: values.is_featured,
            publish_date: values.publish_date || null,
            seo_title,
            seo_description,
            created_by: null,
            updated_at: new Date().toISOString(),
          })
          if (insertError) throw insertError
          publicationInserted = true
        }

        await supabase
          .from('publication_pages')
          .delete()
          .eq('publication_id', publicationId)

        const { data: existingPages } = await supabase.storage
          .from('publications')
          .list(`${publicationId}/pages`)
        if (existingPages?.length) {
          await supabase.storage
            .from('publications')
            .remove(existingPages.map((f) => `${publicationId}/pages/${f.name}`))
        }

        const { data: existingThumbs } = await supabase.storage
          .from('publications')
          .list(`${publicationId}/thumbnails`)
        if (existingThumbs?.length) {
          await supabase.storage
            .from('publications')
            .remove(existingThumbs.map((f) => `${publicationId}/thumbnails/${f.name}`))
        }

        const pagesGenerator = renderAllPages(pdf_url, {
          onProgress: setProcessingProgress,
        })

        for await (const renderedPage of pagesGenerator) {
          page_count = renderedPage.pageNumber

          const pageFileName = `${publicationId}/pages/page-${String(renderedPage.pageNumber).padStart(3, '0')}.webp`
          const pageBlob = dataUrlToBlob(renderedPage.imageDataUrl)
          const { error: pageUploadError } = await supabase.storage
            .from('publications')
            .upload(pageFileName, pageBlob, {
              contentType: 'image/webp',
              upsert: true,
            })
          if (pageUploadError) continue

          const { data: pageUrlData } = supabase.storage
            .from('publications')
            .getPublicUrl(pageFileName)

          const thumbFileName = `${publicationId}/thumbnails/thumb-${String(renderedPage.pageNumber).padStart(3, '0')}.webp`
          const thumbBlob = dataUrlToBlob(renderedPage.thumbnailDataUrl)
          await supabase.storage.from('publications').upload(thumbFileName, thumbBlob, {
            contentType: 'image/webp',
            upsert: true,
          })
          const { data: thumbUrlData } = supabase.storage
            .from('publications')
            .getPublicUrl(thumbFileName)

          await supabase.from('publication_pages').insert({
            publication_id: publicationId,
            page_number: renderedPage.pageNumber,
            image_path: pageFileName,
            image_url: pageUrlData.publicUrl,
            thumbnail_path: thumbFileName,
            thumbnail_url: thumbUrlData.publicUrl,
            width: renderedPage.width,
            height: renderedPage.height,
          })

          if (renderedPage.pageNumber === 1) {
            cover_path = pageFileName
            cover_url = pageUrlData.publicUrl
          }
        }
      }

      const payload = {
        title: values.title,
        slug: values.slug,
        description: values.description || null,
        pdf_path,
        pdf_url: pdf_url || null,
        cover_path: cover_path || null,
        cover_url: cover_url || null,
        file_size_bytes,
        page_count,
        table_of_contents: tableOfContents as Json,
        display_mode: values.display_mode,
        page_width: values.page_width,
        page_height: values.page_height,
        is_active: values.is_active,
        is_featured: values.is_featured,
        publish_date: values.publish_date || null,
        seo_title,
        seo_description,
        updated_at: new Date().toISOString(),
      }

      if (editingPublication || publicationInserted) {
        const { error } = await supabase
          .from('publications')
          .update(payload)
          .eq('id', publicationId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('publications').insert({
          id: publicationId,
          ...payload,
          created_by: null,
        })
        if (error) throw error
      }

      setProcessingProgress({ status: 'completed' })
      await invalidate()
      setIsSheetOpen(false)
      setEditingPublication(null)
      setProcessingProgress({ status: 'idle' })
      setPendingReplace(null)
      setReplaceConfirmOpen(false)
      toast.success('Publicacao guardada')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao guardar publicacao'
      setProcessingProgress({ status: 'error', error: message })
      toast.error(message)
    }
  }

  const handleEdit = (pub: Publication) => {
    void preloadPdfHelpers()
    setEditingPublication(pub)
    setProcessingProgress({ status: 'idle' })
    setIsSheetOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta publicacao?')) return

    try {
      try {
        await deletePublicationViaApi(id)
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        const canFallback =
          message.includes('not configured') ||
          message.includes('Missing session') ||
          message.includes('Failed to fetch')

        if (!canFallback) throw error

        await deletePublicationClientSide(id)
      }

      await invalidate()
      toast.success('Publicacao eliminada')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao eliminar publicacao'
      toast.error(message)
    }
  }

  const handleRowClick = (pub: Publication) => {
    setViewingPublication(pub)
    setIsDetailOpen(true)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Carregando publicacoes...</p>
          {isLongLoading && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Isto está a demorar mais do que o esperado.</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar publicacoes'
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-red-500">{message}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Biblioteca Digital
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Mapas Literarios
            </h1>
          </div>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onPointerEnter={() => {
              void preloadPdfHelpers()
            }}
            onFocus={() => {
              void preloadPdfHelpers()
            }}
            onClick={() => {
              void preloadPdfHelpers()
              setEditingPublication(null)
              setProcessingProgress({ status: 'idle' })
              setIsSheetOpen(true)
            }}
          >
            Adicionar publicacao
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total</p>
            <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Activo</p>
            <p className="text-3xl font-bold mt-1">{stats?.active || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Visivel para leitores</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
            <p className="text-3xl font-bold mt-1">{stats?.featured || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Destacado</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Processado</p>
            <p className="text-3xl font-bold mt-1">{stats?.processed || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Contagem de paginas &gt; 0</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[80px]">Capa</TableHead>
                <TableHead>Titulo</TableHead>
                <TableHead className="w-[100px]">Paginas</TableHead>
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead className="w-[100px]">Estado</TableHead>
                <TableHead className="w-[80px]">Accoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publications?.map((pub) => (
                <TableRow
                  key={pub.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(pub)}
                >
                  <TableCell>
                    {pub.cover_url ? (
                      <img src={pub.cover_url} alt={pub.title} className="w-14 h-20 object-cover rounded" />
                    ) : (
                      <div className="w-14 h-20 bg-muted rounded flex items-center justify-center">
                        <FileText className="size-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{pub.title}</span>
                  </TableCell>
                  <TableCell className="text-center">{pub.page_count || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {pub.publish_date ? formatDate(pub.publish_date) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {pub.is_active && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 w-fit">Activo</Badge>
                      )}
                      {pub.is_featured && (
                        <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 w-fit">Destaque</Badge>
                      )}
                      {!pub.is_active && !pub.is_featured && <Badge variant="secondary">Inactivo</Badge>}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onPointerEnter={() => {
                            void preloadPdfHelpers()
                          }}
                          onFocus={() => {
                            void preloadPdfHelpers()
                          }}
                          onClick={() => handleEdit(pub)}
                        >
                          <FileEdit className="size-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(pub.id)}>
                          <Trash2 className="size-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {publications?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma publicacao encontrada. Clique em "Adicionar publicacao" para comecar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingPublication?.title}</DialogTitle>
            <DialogDescription>Detalhes da publicacao</DialogDescription>
          </DialogHeader>

          {viewingPublication && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {viewingPublication.cover_url ? (
                  <img src={viewingPublication.cover_url} alt={viewingPublication.title} className="w-32 h-44 object-cover rounded-lg" />
                ) : (
                  <div className="w-32 h-44 bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="size-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Descricao</p>
                    <p className="text-sm mt-1">{viewingPublication.description || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Paginas</p>
                  <p className="text-sm mt-1">{viewingPublication.page_count || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Tamanho</p>
                  <p className="text-sm mt-1">{formatFileSize(viewingPublication.file_size_bytes)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Modo de Exibicao</p>
                  <p className="text-sm mt-1">{viewingPublication.display_mode === 'double' ? 'Pagina dupla' : 'Pagina unica'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Dimensoes</p>
                  <p className="text-sm mt-1">{viewingPublication.page_width} x {viewingPublication.page_height}px</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={viewingPublication.is_active ? 'default' : 'secondary'}>
                      {viewingPublication.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {viewingPublication.is_featured && (
                      <Badge className="bg-amber-500/15 text-amber-600">Destaque</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Data de Publicacao</p>
                  <p className="text-sm mt-1">{viewingPublication.publish_date ? formatDate(viewingPublication.publish_date) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Criado em</p>
                  <p className="text-sm mt-1">{formatDateTime(viewingPublication.created_at)}</p>
                </div>
              </div>

              {viewingPublication.pdf_url && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Ficheiro PDF</p>
                  <a href={viewingPublication.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                    Ver PDF
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onPointerEnter={() => {
                    void preloadPdfHelpers()
                  }}
                  onFocus={() => {
                    void preloadPdfHelpers()
                  }}
                  onClick={() => { setIsDetailOpen(false); handleEdit(viewingPublication) }}
                >
                  Editar
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => { setIsDetailOpen(false); handleDelete(viewingPublication.id) }}>
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          if (open) {
            void preloadPdfHelpers()
          }
          setIsSheetOpen(open)
          if (!open) {
            setEditingPublication(null)
            setProcessingProgress({ status: 'idle' })
            setPendingReplace(null)
            setReplaceConfirmOpen(false)
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-xl px-4 overflow-hidden">
          <SheetHeader>
            <SheetTitle>{editingPublication ? 'Editar publicacao' : 'Nova publicacao'}</SheetTitle>
            <SheetDescription>
              Carregue um PDF e configure as opcoes de visualizacao.
            </SheetDescription>
          </SheetHeader>
          <div className="pt-4 max-h-[80vh] overflow-y-auto pr-2 space-y-4">
            <PublicationForm
              initial={
                editingPublication
                  ? {
                      title: editingPublication.title,
                      slug: editingPublication.slug,
                      description: editingPublication.description ?? '',
                      display_mode: editingPublication.display_mode,
                      page_width: editingPublication.page_width,
                      page_height: editingPublication.page_height,
                      is_active: editingPublication.is_active,
                      is_featured: editingPublication.is_featured,
                      publish_date: editingPublication.publish_date ?? '',
                      seo_title: editingPublication.seo_title ?? '',
                      seo_description: editingPublication.seo_description ?? '',
                      table_of_contents: normalizeToc(editingPublication.table_of_contents),
                      pdf_path: editingPublication.pdf_path,
                      pdf_url: editingPublication.pdf_url ?? undefined,
                      cover_url: editingPublication.cover_url ?? undefined,
                    }
                  : undefined
              }
              submitting={processingProgress.status !== 'idle' && processingProgress.status !== 'completed' && processingProgress.status !== 'error'}
              processingProgress={processingProgress}
              onSubmit={async (values, pdfFile) => {
                if (editingPublication && pdfFile) {
                  setPendingReplace({ values, pdfFile })
                  setReplaceConfirmOpen(true)
                  return
                }
                await handleSavePublication(values, pdfFile)
              }}
              onCancel={() => {
                setIsSheetOpen(false)
                setEditingPublication(null)
                setProcessingProgress({ status: 'idle' })
                setPendingReplace(null)
                setReplaceConfirmOpen(false)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={replaceConfirmOpen} onOpenChange={setReplaceConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Substituir PDF da publicacao?</DialogTitle>
            <DialogDescription>
              Isto vai remover paginas e miniaturas existentes e reprocessar o documento inteiro. Esta acao pode levar alguns minutos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setReplaceConfirmOpen(false)
                setPendingReplace(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={async () => {
                if (!pendingReplace) return
                setReplaceConfirmOpen(false)
                await handleSavePublication(pendingReplace.values, pendingReplace.pdfFile)
                setPendingReplace(null)
              }}
            >
              Sim, substituir e reprocessar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
