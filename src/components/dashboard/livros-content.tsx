import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Plus, MoreHorizontal, FileEdit, Trash2, BookOpen } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import {
  useBooks,
  useBookStats,
  useDeleteBook,
  useUploadFile,
  useBookAuthorsList,
  useToggleBookActive,
  useToggleBookFeatured,
  useUpdateBookStock,
} from '@/hooks/use-supabase'
import { supabase, type Book } from '@/lib/supabase'
import { toast } from 'sonner'
import { BookForm, type BookFormValues } from '@/components/dashboard/book-form'

const PAGE_SIZE = 10

type BookWithAuthors = Book & {
  authors?: {
    author_id: string
    authors: { id: string; name: string | null; photo_url: string | null } | null
  }[]
}

export function LivrosContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<BookWithAuthors | null>(null)
  const [viewingBook, setViewingBook] = useState<BookWithAuthors | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  const queryClient = useQueryClient()
  const { data: booksData, isLoading } = useBooks(page, PAGE_SIZE, debouncedSearch)
  const { data: stats } = useBookStats()
  const { data: authorsList } = useBookAuthorsList()
  const deleteMutation = useDeleteBook()
  const uploadMutation = useUploadFile()
  const toggleActiveMutation = useToggleBookActive()
  const toggleFeaturedMutation = useToggleBookFeatured()
  const updateStockMutation = useUpdateBookStock()

  const books = (booksData?.data || []) as BookWithAuthors[]
  const totalPages = booksData?.totalPages || 1
  const totalCount = booksData?.totalCount || 0

  const extractStoragePathFromPublicUrl = (publicUrl: string, bucket: string) => {
    const marker = `/storage/v1/object/public/${bucket}/`
    const markerIndex = publicUrl.indexOf(marker)
    if (markerIndex === -1) return ''
    return publicUrl.slice(markerIndex + marker.length)
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

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
    const timeout = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
    return () => clearTimeout(timeout)
  }

  const invalidateBookQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['books'] }),
      queryClient.invalidateQueries({ queryKey: ['book-stats'] }),
    ])
  }

  const handleSaveBook = async (
    values: BookFormValues,
    files?: { coverFile?: File | null; digitalFile?: File | null },
  ) => {
    const bookId = editingBook?.id ?? crypto.randomUUID()

    setIsSaving(true)
    try {
      let cover_url = values.cover_url || null
      let cover_path = values.cover_path || null
      if (files?.coverFile) {
        const uploadedCoverUrl = await uploadMutation.mutateAsync({
          file: files.coverFile,
          bucket: 'covers',
          folder: `books/${bookId}`,
        })
        cover_url = uploadedCoverUrl
        cover_path = extractStoragePathFromPublicUrl(uploadedCoverUrl, 'covers')
      }

      let digital_file_url = values.digital_file_url || null
      let digital_file_path = values.digital_file_path || null
      if (files?.digitalFile) {
        const uploadedDigitalUrl = await uploadMutation.mutateAsync({
          file: files.digitalFile,
          bucket: 'digital-books',
          folder: `books/${bookId}`,
        })
        digital_file_url = uploadedDigitalUrl
        digital_file_path = extractStoragePathFromPublicUrl(uploadedDigitalUrl, 'digital-books')
      }

      const description_json = values.description
        ? {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: values.description }],
              },
            ],
          }
        : null

      const payload = {
        id: bookId,
        title: values.title,
        slug: values.slug,
        description: values.description || null,
        description_json,
        price_mzn: values.price_mzn,
        stock: values.stock,
        category: values.category || null,
        language: values.language as 'pt' | 'en',
        isbn: values.isbn || null,
        publisher: values.publisher || null,
        is_active: values.is_active,
        featured: values.featured,
        cover_url,
        cover_path,
        promo_type: values.promo_type || null,
        promo_price_mzn: values.promo_price_mzn,
        promo_start_date: values.promo_start_date || null,
        promo_end_date: values.promo_end_date || null,
        is_digital: values.is_digital,
        digital_access: values.is_digital ? (values.digital_access || null) : null,
        digital_file_url: values.is_digital ? digital_file_url : null,
        digital_file_path: values.is_digital ? digital_file_path : null,
        seo_title: buildSeoTitle(values.seo_title || values.title),
        seo_description: buildSeoDescription(values.seo_description || values.description),
      }

      if (editingBook) {
        const { error } = await supabase.from('books').update(payload).eq('id', bookId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('books').insert(payload)
        if (error) throw error
      }

      await supabase.from('authors_books').delete().eq('book_id', bookId)
      if (values.author_ids.length > 0) {
        const { error } = await supabase.from('authors_books').insert(
          values.author_ids.map((authorId) => ({
            author_id: authorId,
            book_id: bookId,
          })),
        )
        if (error) throw error
      }

      await invalidateBookQueries()
      setIsSheetOpen(false)
      setEditingBook(null)
      toast.success('Livro guardado com sucesso')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao guardar livro'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateAuthor = async (name: string) => {
    const { data, error } = await supabase
      .from('authors')
      .insert({ name })
      .select('id, name')
      .single()

    if (error) throw error

    await queryClient.invalidateQueries({ queryKey: ['book-authors-list'] })
    return {
      id: data.id,
      name: data.name || 'Autor',
    }
  }

  const handleEdit = (book: BookWithAuthors) => {
    setEditingBook(book)
    setIsSheetOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este livro?')) {
      const result = await deleteMutation.mutateAsync(id)
      if (result.archived) {
        toast.success('Livro com pedidos foi arquivado em vez de excluido')
      } else {
        toast.success('Livro excluido com sucesso')
      }
    }
  }

  const handleToggleActive = async (book: BookWithAuthors) => {
    await toggleActiveMutation.mutateAsync({
      id: book.id,
      is_active: !book.is_active,
    })
    toast.success(book.is_active ? 'Livro desativado' : 'Livro ativado')
  }

  const handleToggleFeatured = async (book: BookWithAuthors) => {
    await toggleFeaturedMutation.mutateAsync({
      id: book.id,
      featured: !book.featured,
    })
    toast.success(book.featured ? 'Livro removido dos destaques' : 'Livro marcado como destaque')
  }

  const handleAdjustStock = async (book: BookWithAuthors) => {
    if (book.is_digital) {
      toast.info('Livros digitais nao usam stock')
      return
    }

    const input = prompt('Definir novo stock:', String(book.stock ?? 0))
    if (input === null) return

    const parsed = Number(input)
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Stock invalido. Use um numero maior ou igual a 0')
      return
    }

    await updateStockMutation.mutateAsync({
      id: book.id,
      stock: Math.floor(parsed),
    })
    toast.success('Stock atualizado com sucesso')
  }

  const handleRowClick = (book: BookWithAuthors) => {
    setViewingBook(book)
    setIsDetailOpen(true)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ').format(price)
  }

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const visible: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) visible.push(i)
    } else if (page <= 3) {
      for (let i = 1; i <= 4; i++) visible.push(i)
      visible.push('ellipsis')
      visible.push(totalPages)
    } else if (page >= totalPages - 2) {
      visible.push(1)
      visible.push('ellipsis')
      for (let i = totalPages - 3; i <= totalPages; i++) visible.push(i)
    } else {
      visible.push(1)
      visible.push('ellipsis')
      for (let i = page - 1; i <= page + 1; i++) visible.push(i)
      visible.push('ellipsis')
      visible.push(totalPages)
    }
    return visible
  }

  if (isLoading && !booksData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando livros...</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Catalogo
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Livros</h1>
          </div>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={() => {
              setEditingBook(null)
              setIsSheetOpen(true)
            }}
          >
            <Plus className="size-4" />
            Adicionar livro
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Livros</p>
            <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Activo</p>
            <p className="text-3xl font-bold mt-1">{stats?.active || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Disponivel na loja</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
            <p className="text-3xl font-bold mt-1">{stats?.featured || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Destaques homepage</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Digital</p>
            <p className="text-3xl font-bold mt-1">{stats?.digital || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Catalogo digital</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Stock Baixo</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{stats?.lowStock || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Fisico &lt;= 5</p>
          </div>
        </div>

        <div className="relative flex-1">
          <Input
            placeholder="Buscar livros..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="text-sm text-muted-foreground">{totalCount} livros encontrados</div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Titulo</TableHead>
                <TableHead className="w-[220px]">Autores</TableHead>
                <TableHead className="w-[150px]">Categoria</TableHead>
                <TableHead className="w-[80px]">Idioma</TableHead>
                <TableHead className="w-[100px]">Preco</TableHead>
                <TableHead className="w-[80px]">Stock</TableHead>
                <TableHead className="w-[80px]">Accoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : books.map((book) => (
                <TableRow key={book.id} className="cursor-pointer" onClick={() => handleRowClick(book)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="w-10 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                          <BookOpen className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p>{book.title}</p>
                        {book.featured && <span className="text-xs text-amber-600">Destaque</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {book.authors?.map((a) => a.authors?.name).filter(Boolean).join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{book.category || '-'}</TableCell>
                  <TableCell>{book.language}</TableCell>
                  <TableCell>
                    {book.promo_price_mzn ? (
                      <div>
                        <span className="line-through text-muted-foreground text-xs">{formatPrice(book.price_mzn)}</span>
                        <span className="ml-1">{formatPrice(book.promo_price_mzn)} MTn</span>
                      </div>
                    ) : (
                      `${formatPrice(book.price_mzn)} MTn`
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={book.stock <= 5 && !book.is_digital ? 'text-amber-600 font-medium' : ''}>
                      {book.is_digital ? 'infinito' : book.stock}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(book)}>
                          <FileEdit className="size-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFeatured(book)}>
                          {book.featured ? 'Remover destaque' : 'Marcar destaque'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(book)}>
                          {book.is_active ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAdjustStock(book)}>
                          Ajustar stock
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(book.id)}>
                          <Trash2 className="size-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && books.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum livro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <Pagination className="mx-0 w-auto justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {getVisiblePages().map((p, i) => (
                <PaginationItem key={i}>
                  {p === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setPage(p)}
                      isActive={page === p}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingBook?.title}</DialogTitle>
            <DialogDescription>Detalhes do livro</DialogDescription>
          </DialogHeader>

          {viewingBook && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {viewingBook.cover_url ? (
                  <img
                    src={viewingBook.cover_url}
                    alt={viewingBook.title}
                    className="w-32 h-44 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-44 bg-muted rounded-lg flex items-center justify-center">
                    <BookOpen className="size-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Autores</p>
                    <p className="text-sm mt-1">
                      {viewingBook.authors?.map((a) => a.authors?.name).filter(Boolean).join(', ') || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Descricao</p>
                    <p className="text-sm mt-1">{viewingBook.description || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Preco</p>
                  <p className="text-sm mt-1">{formatPrice(viewingBook.price_mzn)} MTn</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Stock</p>
                  <p className="text-sm mt-1">{viewingBook.is_digital ? 'infinito' : viewingBook.stock}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Categoria</p>
                  <p className="text-sm mt-1">{viewingBook.category || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Idioma</p>
                  <p className="text-sm mt-1">{viewingBook.language === 'pt' ? 'Portugues' : 'English'}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">ISBN</p>
                  <p className="text-sm mt-1">{viewingBook.isbn || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Editora</p>
                  <p className="text-sm mt-1">{viewingBook.publisher || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Acesso digital</p>
                  <p className="text-sm mt-1">{viewingBook.digital_access || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <div className="flex gap-2 mt-1">
                    {viewingBook.is_active && <span className="text-xs text-emerald-600">Activo</span>}
                    {viewingBook.featured && <span className="text-xs text-amber-600">Destaque</span>}
                    {!viewingBook.is_active && !viewingBook.featured && (
                      <span className="text-xs text-muted-foreground">Inactivo</span>
                    )}
                  </div>
                </div>
              </div>

              {viewingBook.promo_type && (
                <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Tipo Promocao</p>
                    <p className="text-sm mt-1">{viewingBook.promo_type}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Inicio</p>
                    <p className="text-sm mt-1">
                      {viewingBook.promo_start_date ? formatDate(viewingBook.promo_start_date) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Fim</p>
                    <p className="text-sm mt-1">
                      {viewingBook.promo_end_date ? formatDate(viewingBook.promo_end_date) : '-'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false)
                    handleEdit(viewingBook)
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false)
                    handleDelete(viewingBook.id)
                  }}
                >
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
          setIsSheetOpen(open)
          if (!open) {
            setEditingBook(null)
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>{editingBook ? 'Editar livro' : 'Adicionar livro'}</SheetTitle>
            <SheetDescription>
              Gerencie metadados, autores, preco, acesso digital e SEO.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <BookForm
              initial={
                editingBook
                  ? {
                      title: editingBook.title,
                      slug: editingBook.slug,
                      price_mzn: editingBook.price_mzn,
                      promo_type:
                        editingBook.promo_type === 'promocao' ||
                        editingBook.promo_type === 'pre-venda'
                          ? editingBook.promo_type
                          : '',
                      promo_price_mzn: editingBook.promo_price_mzn ?? null,
                      promo_start_date: editingBook.promo_start_date ?? '',
                      promo_end_date: editingBook.promo_end_date ?? '',
                      is_digital: editingBook.is_digital,
                      digital_access:
                        editingBook.digital_access === 'paid' ||
                        editingBook.digital_access === 'free'
                          ? editingBook.digital_access
                          : '',
                      digital_file_path: editingBook.digital_file_path ?? '',
                      digital_file_url: editingBook.digital_file_url ?? '',
                      stock: editingBook.stock,
                      category: editingBook.category ?? '',
                      language: editingBook.language,
                      is_active: editingBook.is_active,
                      featured: editingBook.featured ?? false,
                      cover_url: editingBook.cover_url ?? '',
                      cover_path: editingBook.cover_path ?? '',
                      description: editingBook.description ?? '',
                      isbn: editingBook.isbn ?? '',
                      publisher: editingBook.publisher ?? '',
                      seo_title: editingBook.seo_title ?? '',
                      seo_description: editingBook.seo_description ?? '',
                      author_ids: editingBook.authors?.map((a) => a.author_id) ?? [],
                    }
                  : undefined
              }
              submitting={isSaving || uploadMutation.isPending}
              onSubmit={handleSaveBook}
              authors={
                authorsList?.map((a) => ({
                  id: a.id,
                  name: a.name || 'Autor',
                })) || []
              }
              onCreateAuthor={handleCreateAuthor}
              onCancel={() => {
                setIsSheetOpen(false)
                setEditingBook(null)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
