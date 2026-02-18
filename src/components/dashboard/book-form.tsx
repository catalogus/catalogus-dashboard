import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { validateAndOptimizeImage } from '@/lib/imageOptimization'

type AuthorOption = { id: string; name: string }

export type BookFormValues = {
  title: string
  slug: string
  price_mzn: number
  promo_type: 'promocao' | 'pre-venda' | ''
  promo_price_mzn: number | null
  promo_start_date: string
  promo_end_date: string
  is_digital: boolean
  digital_access: 'paid' | 'free' | ''
  digital_file_path: string
  digital_file_url: string
  stock: number
  category: string
  language: string
  is_active: boolean
  featured: boolean
  cover_url: string
  cover_path: string
  description: string
  isbn: string
  publisher: string
  seo_title: string
  seo_description: string
  author_ids: string[]
}

type BookFormProps = {
  initial?: Partial<BookFormValues>
  onSubmit: (
    values: BookFormValues,
    files?: { coverFile?: File | null; digitalFile?: File | null },
  ) => Promise<void> | void
  onCancel: () => void
  submitting?: boolean
  authors: AuthorOption[]
  onCreateAuthor?: (name: string) => Promise<AuthorOption>
}

const defaultValues: BookFormValues = {
  title: '',
  slug: '',
  price_mzn: 0,
  promo_type: '',
  promo_price_mzn: null,
  promo_start_date: '',
  promo_end_date: '',
  is_digital: false,
  digital_access: '',
  digital_file_path: '',
  digital_file_url: '',
  stock: 0,
  category: '',
  language: 'pt',
  is_active: true,
  featured: false,
  cover_url: '',
  cover_path: '',
  description: '',
  isbn: '',
  publisher: '',
  seo_title: '',
  seo_description: '',
  author_ids: [],
}

export function BookForm({
  initial,
  onSubmit,
  onCancel,
  submitting = false,
  authors,
  onCreateAuthor,
}: BookFormProps) {
  const [values, setValues] = useState<BookFormValues>({
    ...defaultValues,
    ...initial,
    author_ids: initial?.author_ids ?? defaultValues.author_ids,
  })
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initial?.cover_url ?? null,
  )
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [digitalFile, setDigitalFile] = useState<File | null>(null)
  const [localAuthors, setLocalAuthors] = useState<AuthorOption[]>(authors)
  const [newAuthorName, setNewAuthorName] = useState('')
  const [addingAuthor, setAddingAuthor] = useState(false)
  const [authorSearch, setAuthorSearch] = useState('')
  const [authorPickerOpen, setAuthorPickerOpen] = useState(false)
  const [isOptimizingImage, setIsOptimizingImage] = useState(false)
  const [optimizationStats, setOptimizationStats] = useState<{
    originalSizeMB: string
    optimizedSizeMB: string
  } | null>(null)

  useEffect(() => {
    setLocalAuthors(authors)
  }, [authors])

  const handleChange = (
    key: keyof BookFormValues,
    value: string | number | boolean | null | string[],
  ) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const slug =
      values.slug ||
      values.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
    onSubmit({ ...values, slug }, { coverFile, digitalFile })
  }

  const toggleAuthor = (authorId: string) => {
    const isSelected = values.author_ids.includes(authorId)
    const next = isSelected
      ? values.author_ids.filter((id) => id !== authorId)
      : [...values.author_ids, authorId]
    handleChange('author_ids', next)
  }

  const addAuthor = async () => {
    if (!onCreateAuthor) return
    const name = newAuthorName.trim()
    if (!name) return
    setAddingAuthor(true)
    try {
      const created = await onCreateAuthor(name)
      setLocalAuthors((prev) => [...prev, created])
      handleChange('author_ids', [...values.author_ids, created.id])
      setNewAuthorName('')
    } finally {
      setAddingAuthor(false)
    }
  }

  const normalizedSearch = authorSearch.trim().toLowerCase()
  const filteredAuthors = normalizedSearch
    ? localAuthors.filter((author) =>
        author.name.toLowerCase().includes(normalizedSearch),
      )
    : localAuthors
  const selectedAuthors = localAuthors.filter((author) =>
    values.author_ids.includes(author.id),
  )

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="title">Titulo</Label>
        <Input
          id="title"
          required
          value={values.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Autores</Label>
          <button
            type="button"
            onClick={() => setAuthorPickerOpen((prev) => !prev)}
            className="text-xs font-semibold text-foreground hover:text-muted-foreground"
          >
            {authorPickerOpen ? 'Ocultar lista' : 'Selecionar autores'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Selecione do catalogo ou adicione um novo autor.
        </p>
        {selectedAuthors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedAuthors.map((author) => (
              <span
                key={author.id}
                className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs"
              >
                {author.name}
                <button
                  type="button"
                  onClick={() => toggleAuthor(author.id)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remover ${author.name}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum autor selecionado.</p>
        )}

        {authorPickerOpen && (
          <div className="rounded-lg border bg-card">
            <div className="border-b p-2">
              <Input
                placeholder="Pesquisar autores..."
                value={authorSearch}
                onChange={(e) => setAuthorSearch(e.target.value)}
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filteredAuthors.map((author) => {
                const selected = values.author_ids.includes(author.id)
                return (
                  <button
                    key={author.id}
                    type="button"
                    onClick={() => toggleAuthor(author.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>{author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {selected ? 'Selecionado' : 'Adicionar'}
                    </span>
                  </button>
                )
              })}
              {localAuthors.length === 0 && (
                <p className="px-3 py-3 text-xs text-muted-foreground">Sem autores.</p>
              )}
              {localAuthors.length > 0 && filteredAuthors.length === 0 && (
                <p className="px-3 py-3 text-xs text-muted-foreground">Nenhum autor encontrado.</p>
              )}
            </div>
          </div>
        )}

        {onCreateAuthor && (
          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Nome do novo autor"
              value={newAuthorName}
              onChange={(e) => setNewAuthorName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addAuthor()
                }
              }}
            />
            <Button type="button" onClick={addAuthor} disabled={addingAuthor}>
              {addingAuthor ? 'A adicionar...' : 'Adicionar'}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Capa</Label>
        <div className="rounded-lg border border-dashed p-4">
          <div className="flex items-center gap-4">
            <label
              htmlFor="cover"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium"
            >
              Escolher ficheiro
            </label>
            <input
              id="cover"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const selected = e.target.files?.[0] ?? null
                if (!selected) {
                  setCoverFile(null)
                  setCoverPreview(values.cover_url || null)
                  setOptimizationStats(null)
                  return
                }

                setIsOptimizingImage(true)
                setOptimizationStats(null)

                try {
                  const originalSizeMB = (selected.size / 1024 / 1024).toFixed(2)
                  const optimizedFile = await validateAndOptimizeImage(selected, 'bookCover')
                  const optimizedSizeMB = (optimizedFile.size / 1024 / 1024).toFixed(2)

                  setCoverFile(optimizedFile)
                  setCoverPreview(URL.createObjectURL(optimizedFile))
                  setOptimizationStats({ originalSizeMB, optimizedSizeMB })
                } catch (error) {
                  alert(error instanceof Error ? error.message : 'Falha ao otimizar imagem')
                  e.target.value = ''
                } finally {
                  setIsOptimizingImage(false)
                }
              }}
              className="hidden"
              disabled={isOptimizingImage}
            />

            <div className="flex flex-col text-sm text-muted-foreground">
              <span className="font-medium">
                {isOptimizingImage
                  ? 'Otimizando imagem...'
                  : coverFile?.name ?? coverPreview
                    ? 'Preview carregado'
                    : 'Sem ficheiro'}
              </span>
              {optimizationStats ? (
                <span className="text-xs text-emerald-600">
                  Otimizada: {optimizationStats.originalSizeMB}MB {'->'} {optimizationStats.optimizedSizeMB}MB
                </span>
              ) : (
                <span className="text-xs">JPG/PNG/WebP, ate 50MB</span>
              )}
            </div>

            {coverPreview && (
              <img
                src={coverPreview}
                alt="Capa"
                className="h-16 w-12 rounded-md border object-cover ml-auto"
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descricao</Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preco (MZN)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            value={values.price_mzn}
            onChange={(e) => handleChange('price_mzn', Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min={0}
            value={values.stock}
            onChange={(e) => handleChange('stock', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="promo_type">Tipo de promocao</Label>
          <select
            id="promo_type"
            value={values.promo_type}
            onChange={(e) => handleChange('promo_type', e.target.value as BookFormValues['promo_type'])}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Sem promocao</option>
            <option value="promocao">Promocao</option>
            <option value="pre-venda">Pre-venda</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="promo_price">Preco promocional (MZN)</Label>
          <Input
            id="promo_price"
            type="number"
            min={0}
            value={values.promo_price_mzn ?? ''}
            onChange={(e) =>
              handleChange(
                'promo_price_mzn',
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="promo_start_date">Inicio promocao</Label>
          <Input
            id="promo_start_date"
            type="date"
            value={values.promo_start_date}
            onChange={(e) => handleChange('promo_start_date', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promo_end_date">Fim promocao</Label>
          <Input
            id="promo_end_date"
            type="date"
            value={values.promo_end_date}
            onChange={(e) => handleChange('promo_end_date', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2">
          <Checkbox
            id="is_digital"
            checked={values.is_digital}
            onCheckedChange={(checked) => handleChange('is_digital', checked === true)}
          />
          <Label htmlFor="is_digital">Livro digital</Label>
        </div>
        {values.is_digital && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="digital_access">Acesso digital</Label>
              <select
                id="digital_access"
                value={values.digital_access}
                onChange={(e) => handleChange('digital_access', e.target.value as BookFormValues['digital_access'])}
                required={values.is_digital}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecionar</option>
                <option value="paid">Pago</option>
                <option value="free">Gratis</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="digital_file">Ficheiro digital</Label>
              <Input
                id="digital_file"
                type="file"
                accept=".pdf,.epub"
                onChange={(e) => setDigitalFile(e.target.files?.[0] ?? null)}
              />
              {values.digital_file_path && !digitalFile && (
                <p className="text-xs text-muted-foreground">
                  Ficheiro atual: {values.digital_file_path.split('/').pop()}
                </p>
              )}
              {digitalFile && <p className="text-xs text-muted-foreground">Selecionado: {digitalFile.name}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input id="isbn" value={values.isbn} onChange={(e) => handleChange('isbn', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="publisher">Editora</Label>
          <Input
            id="publisher"
            value={values.publisher}
            onChange={(e) => handleChange('publisher', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            value={values.category}
            onChange={(e) => handleChange('category', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Idioma</Label>
          <select
            id="language"
            value={values.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="pt">Portugues</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="seo_title">SEO titulo</Label>
          <Input
            id="seo_title"
            value={values.seo_title}
            onChange={(e) => handleChange('seo_title', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seo_description">SEO descricao</Label>
          <Input
            id="seo_description"
            value={values.seo_description}
            onChange={(e) => handleChange('seo_description', e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <Checkbox
            checked={values.featured}
            onCheckedChange={(checked) => handleChange('featured', checked === true)}
          />
          <span>Destaque</span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <Checkbox
            checked={values.is_active}
            onCheckedChange={(checked) => handleChange('is_active', checked === true)}
          />
          <span>Activo</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting || isOptimizingImage}>
          {submitting ? 'A guardar...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
