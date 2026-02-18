import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  DisplayMode,
  ProcessingProgress,
  PublicationFormValues,
  TableOfContentsItem,
} from '@/types/publication'

type PublicationFormProps = {
  initial?: Partial<PublicationFormValues> & {
    pdf_path?: string
    pdf_url?: string
    cover_url?: string
  }
  submitting: boolean
  processingProgress?: ProcessingProgress
  onSubmit: (values: PublicationFormValues, pdfFile: File | null) => Promise<void>
  onCancel: () => void
}

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function PublicationForm({
  initial,
  submitting,
  processingProgress,
  onSubmit,
  onCancel,
}: PublicationFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    initial?.display_mode ?? 'double',
  )
  const [pageWidth, setPageWidth] = useState(initial?.page_width ?? 400)
  const [pageHeight, setPageHeight] = useState(initial?.page_height ?? 600)
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false)
  const [publishDate, setPublishDate] = useState(
    initial?.publish_date
      ? new Date(initial.publish_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  )
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(initial?.seo_description ?? '')
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>(
    (initial?.table_of_contents as TableOfContentsItem[]) ?? [],
  )

  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPreviewName, setPdfPreviewName] = useState(
    initial?.pdf_path ? initial.pdf_path.split('/').pop() : '',
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!initial?.slug) {
      setSlug(generateSlug(value))
    }
    if (!seoTitle) {
      setSeoTitle(value)
    }
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setPdfPreviewName(file.name)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setPdfPreviewName(file.name)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(
      {
        title,
        slug,
        description,
        display_mode: displayMode,
        page_width: pageWidth,
        page_height: pageHeight,
        is_active: isActive,
        is_featured: isFeatured,
        publish_date: publishDate,
        seo_title: seoTitle,
        seo_description: seoDescription,
        table_of_contents: tableOfContents,
      },
      pdfFile,
    )
  }

  const addTocItem = () => {
    setTableOfContents([...tableOfContents, { title: '', pageNumber: 1 }])
  }

  const updateTocItem = (
    index: number,
    field: 'title' | 'pageNumber',
    value: string | number,
  ) => {
    const updated = [...tableOfContents]
    if (field === 'title') {
      updated[index] = { ...updated[index], title: value as string }
    } else {
      updated[index] = { ...updated[index], pageNumber: value as number }
    }
    setTableOfContents(updated)
  }

  const removeTocItem = (index: number) => {
    setTableOfContents(tableOfContents.filter((_, i) => i !== index))
  }

  const isProcessing =
    processingProgress?.status === 'uploading' ||
    processingProgress?.status === 'processing' ||
    processingProgress?.status === 'rendering'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Ficheiro PDF</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            pdfFile ? 'border-green-300 bg-green-50 dark:bg-green-950/10' : 'border-muted hover:border-foreground/20'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {pdfPreviewName ? (
            <div className="flex items-center justify-center gap-3">
              <div className="text-left">
                <p className="font-medium">{pdfPreviewName}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Alterar ficheiro
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mt-2 text-sm text-muted-foreground">
                Arraste um ficheiro PDF ou{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:underline"
                >
                  selecione do computador
                </button>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF ate 50MB</p>
            </div>
          )}
        </div>

        {isProcessing && processingProgress && (
          <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {processingProgress.status === 'uploading' && 'A carregar PDF...'}
                  {processingProgress.status === 'processing' && 'A processar PDF...'}
                  {processingProgress.status === 'rendering' &&
                    `A renderizar pagina ${processingProgress.currentPage} de ${processingProgress.totalPages}...`}
                </p>
                {processingProgress.totalPages && processingProgress.currentPage && (
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: `${(processingProgress.currentPage / processingProgress.totalPages) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titulo *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Nome da publicacao"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="url-amigavel"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descricao</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Breve descricao da publicacao"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Modo de exibicao</Label>
          <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as DisplayMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Pagina unica</SelectItem>
              <SelectItem value="double">Pagina dupla</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pageWidth">Largura (px)</Label>
          <Input
            id="pageWidth"
            type="number"
            value={pageWidth}
            onChange={(e) => setPageWidth(parseInt(e.target.value, 10) || 400)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pageHeight">Altura (px)</Label>
          <Input
            id="pageHeight"
            type="number"
            value={pageHeight}
            onChange={(e) => setPageHeight(parseInt(e.target.value, 10) || 600)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="publishDate">Data de publicacao</Label>
          <Input
            id="publishDate"
            type="date"
            value={publishDate}
            onChange={(e) => setPublishDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-6 pt-6">
          <div className="flex items-center gap-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Activo</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
            <Label htmlFor="isFeatured">Destaque</Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO titulo</Label>
          <Input
            id="seoTitle"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="Titulo para motores de busca"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO descricao</Label>
          <Input
            id="seoDescription"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="Descricao para motores de busca"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Indice (opcional)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addTocItem}>
            Adicionar item
          </Button>
        </div>
        {tableOfContents.length > 0 && (
          <div className="space-y-2">
            {tableOfContents.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={item.title}
                  onChange={(e) => updateTocItem(index, 'title', e.target.value)}
                  placeholder="Titulo do capitulo"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={item.pageNumber}
                  onChange={(e) =>
                    updateTocItem(index, 'pageNumber', parseInt(e.target.value, 10) || 1)
                  }
                  min={1}
                  className="w-20"
                  placeholder="Pag."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTocItem(index)}
                  className="shrink-0"
                >
                  x
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting || isProcessing || (!pdfFile && !initial?.pdf_path)}>
          {submitting ? 'A guardar...' : initial?.slug ? 'Actualizar' : 'Criar publicacao'}
        </Button>
      </div>
    </form>
  )
}
