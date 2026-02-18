import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, FileEdit, Trash2, Search, BookOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBooks, useBookStats, useCreateBook, useUpdateBook, useDeleteBook } from "@/hooks/use-supabase";
import type { Book } from "@/lib/supabase";

const PAGE_SIZE = 10;

export function LivrosContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const { data: booksData, isLoading } = useBooks(page, PAGE_SIZE, debouncedSearch);
  const { data: stats } = useBookStats();
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();
  const deleteMutation = useDeleteBook();

  const books = booksData?.data || [];
  const totalPages = booksData?.totalPages || 1;
  const totalCount = booksData?.totalCount || 0;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const bookData = {
      title: formData.get('title') as string,
      slug: (formData.get('title') as string).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: formData.get('description') as string || null,
      price_mzn: parseFloat(formData.get('price') as string) || 0,
      stock: parseInt(formData.get('stock') as string) || 0,
      is_digital: formData.get('digital') === 'on',
      is_active: formData.get('active') === 'on',
      featured: formData.get('featured') === 'on',
      isbn: formData.get('isbn') as string || null,
      publisher: formData.get('publisher') as string || null,
      category: formData.get('category') as string || null,
      language: (formData.get('language') as 'pt' | 'en') || 'pt',
      promo_type: formData.get('promoType') === 'no-promo' ? null : formData.get('promoType') as string,
      promo_price_mzn: parseFloat(formData.get('promoPrice') as string) || null,
      promo_start_date: formData.get('promoStart') as string || null,
      promo_end_date: formData.get('promoEnd') as string || null,
    };

    if (editingBook) {
      await updateMutation.mutateAsync({ id: editingBook.id, ...bookData });
    } else {
      await createMutation.mutateAsync(bookData);
    }
    
    setIsSheetOpen(false);
    setEditingBook(null);
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este livro?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleRowClick = (book: Book) => {
    setViewingBook(book);
    setIsDetailOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ').format(price);
  };

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const visible: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) visible.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) visible.push(i);
        visible.push('ellipsis');
        visible.push(totalPages);
      } else if (page >= totalPages - 2) {
        visible.push(1);
        visible.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) visible.push(i);
      } else {
        visible.push(1);
        visible.push('ellipsis');
        for (let i = page - 1; i <= page + 1; i++) visible.push(i);
        visible.push('ellipsis');
        visible.push(totalPages);
      }
    }
    return visible;
  };

  if (isLoading && !booksData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando livros...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Catálogo
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Livros
            </h1>
          </div>
          <Button 
            size="sm" 
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={() => {
              setEditingBook(null);
              setIsSheetOpen(true);
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
            <p className="text-xs text-muted-foreground mt-1">Disponível na loja</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
            <p className="text-3xl font-bold mt-1">{stats?.featured || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Destaques homepage</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Digital</p>
            <p className="text-3xl font-bold mt-1">{stats?.digital || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Catálogo digital</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">stock Baixo</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{stats?.lowStock || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Físico &lt;= 5</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar livros..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {totalCount} livros encontrados
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Título</TableHead>
                <TableHead className="w-[150px]">Categoria</TableHead>
                <TableHead className="w-[80px]">Idioma</TableHead>
                <TableHead className="w-[100px]">Preço</TableHead>
                <TableHead className="w-[80px]">Stock</TableHead>
                <TableHead className="w-[80px]">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : books?.map((book) => (
                <TableRow 
                  key={book.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(book)}
                >
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
                        {book.featured && (
                          <span className="text-xs text-amber-600">Destaque</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {book.category || "—"}
                  </TableCell>
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
                    <span className={book.stock <= 5 ? 'text-amber-600 font-medium' : ''}>
                      {book.stock}
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
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(book.id)}>
                          <Trash2 className="size-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && books?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum livro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingBook?.title}</DialogTitle>
            <DialogDescription>
              Detalhes do livro
            </DialogDescription>
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
                    <p className="text-xs font-medium text-muted-foreground uppercase">Descrição</p>
                    <p className="text-sm mt-1">{viewingBook.description || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Preço</p>
                  <p className="text-sm mt-1">
                    {viewingBook.promo_price_mzn ? (
                      <span>
                        <span className="line-through text-muted-foreground">{formatPrice(viewingBook.price_mzn)}</span>
                        <span className="ml-1 font-medium text-emerald-600">{formatPrice(viewingBook.promo_price_mzn)} MTn</span>
                      </span>
                    ) : (
                      `${formatPrice(viewingBook.price_mzn)} MTn`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Stock</p>
                  <p className={`text-sm mt-1 ${viewingBook.stock <= 5 ? 'text-amber-600 font-medium' : ''}`}>
                    {viewingBook.stock}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Categoria</p>
                  <p className="text-sm mt-1">{viewingBook.category || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Idioma</p>
                  <p className="text-sm mt-1">{viewingBook.language === 'pt' ? 'Português' : 'English'}</p>
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
                  <p className="text-xs font-medium text-muted-foreground uppercase">Digital</p>
                  <p className="text-sm mt-1">{viewingBook.is_digital ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <div className="flex gap-2 mt-1">
                    {viewingBook.is_active && <span className="text-xs text-emerald-600">Activo</span>}
                    {viewingBook.featured && <span className="text-xs text-amber-600">Destaque</span>}
                    {!viewingBook.is_active && !viewingBook.featured && <span className="text-xs text-muted-foreground">Inactivo</span>}
                  </div>
                </div>
              </div>
              
              {viewingBook.promo_type && (
                <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Tipo Promoção</p>
                    <p className="text-sm mt-1">{viewingBook.promo_type}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Início</p>
                    <p className="text-sm mt-1">{viewingBook.promo_start_date ? formatDate(viewingBook.promo_start_date) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Fim</p>
                    <p className="text-sm mt-1">{viewingBook.promo_end_date ? formatDate(viewingBook.promo_end_date) : '-'}</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleEdit(viewingBook);
                  }}
                >
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleDelete(viewingBook.id);
                  }}
                >
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        setIsSheetOpen(open);
        if (!open) setEditingBook(null);
      }}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>{editingBook ? 'Editar livro' : 'Adicionar livro'}</SheetTitle>
            <SheetDescription>
              Gerencie título, slug, preço, stock e visibilidade.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  name="title"
                  placeholder="Digite o título do livro" 
                  required
                  defaultValue={editingBook?.title || ''}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Digite a descrição do livro"
                  rows={4}
                  defaultValue={editingBook?.description || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="price">Preço (MZN)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    defaultValue={editingBook?.price_mzn || 0}
                    min="0"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    defaultValue={editingBook?.stock || 0}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Tipo de promoção</Label>
                  <Select name="promoType" defaultValue={editingBook?.promo_type || 'no-promo'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-promo">Sem promoção</SelectItem>
                      <SelectItem value="percentage">Percentual</SelectItem>
                      <SelectItem value="fixed">Valor fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="promoPrice">Preço promocional (MZN)</Label>
                  <Input
                    id="promoPrice"
                    name="promoPrice"
                    type="number"
                    placeholder="0"
                    min="0"
                    defaultValue={editingBook?.promo_price_mzn || ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="promoStart">Data início promo</Label>
                  <Input
                    id="promoStart"
                    name="promoStart"
                    type="date"
                    defaultValue={editingBook?.promo_start_date || ''}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="promoEnd">Data fim promo</Label>
                  <Input
                    id="promoEnd"
                    name="promoEnd"
                    type="date"
                    defaultValue={editingBook?.promo_end_date || ''}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="digital" name="digital" defaultChecked={editingBook?.is_digital} />
                <Label htmlFor="digital" className="text-sm font-normal cursor-pointer">
                  Livro digital
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input id="isbn" name="isbn" placeholder="ISBN" defaultValue={editingBook?.isbn || ''} />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="publisher">Editora</Label>
                  <Input id="publisher" name="publisher" placeholder="Editora" defaultValue={editingBook?.publisher || ''} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="category">Categoria</Label>
                  <Input id="category" name="category" placeholder="Categoria" defaultValue={editingBook?.category || ''} />
                </div>
                <div className="space-y-3">
                  <Label>Idioma</Label>
                  <Select name="language" defaultValue={editingBook?.language || 'pt'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="featured" name="featured" defaultChecked={editingBook?.featured ?? false} />
                  <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                    Destaque
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="active" name="active" defaultChecked={editingBook?.is_active ?? true} />
                  <Label htmlFor="active" className="text-sm font-normal cursor-pointer">
                    Activo
                  </Label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-background shrink-0">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsSheetOpen(false);
                    setEditingBook(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingBook ? 'Guardar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
