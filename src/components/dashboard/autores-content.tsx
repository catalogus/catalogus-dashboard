import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, FileEdit, Trash2, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthors, useAuthorStats, useCreateAuthor, useUpdateAuthor, useDeleteAuthor } from "@/hooks/use-supabase";
import type { Author } from "@/lib/supabase";

const PAGE_SIZE = 10;

export function AutoresContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [viewingAuthor, setViewingAuthor] = useState<Author | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const { data: authorsData, isLoading } = useAuthors(page, PAGE_SIZE, debouncedSearch);
  const { data: stats } = useAuthorStats();
  const createMutation = useCreateAuthor();
  const updateMutation = useUpdateAuthor();
  const deleteMutation = useDeleteAuthor();

  const authors = authorsData?.data || [];
  const totalPages = authorsData?.totalPages || 1;
  const totalCount = authorsData?.totalCount || 0;

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
    
    const authorData = {
      name: formData.get('name') as string,
      author_type: formData.get('authorType') as string || null,
      phone: formData.get('phone') as string || null,
      bio: formData.get('bio') as string || null,
      birth_date: formData.get('birthDate') as string || null,
      residence_city: formData.get('city') as string || null,
      province: formData.get('province') as string || null,
      featured_video: formData.get('videoUrl') as string || null,
      social_links: {
        website: (formData.get('website') as string) || null,
        linkedin: (formData.get('linkedin') as string) || null,
        facebook: (formData.get('facebook') as string) || null,
        instagram: (formData.get('instagram') as string) || null,
        twitter: (formData.get('twitter') as string) || null,
        youtube: (formData.get('youtube') as string) || null,
      } as any,
      featured: formData.get('featured') === 'on',
    };

    if (editingAuthor) {
      await updateMutation.mutateAsync({ id: editingAuthor.id, ...authorData });
    } else {
      await createMutation.mutateAsync(authorData);
    }
    
    setIsSheetOpen(false);
    setEditingAuthor(null);
  };

  const handleEdit = (author: Author) => {
    setEditingAuthor(author);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este autor?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleRowClick = (author: Author) => {
    setViewingAuthor(author);
    setIsDetailOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
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

  if (isLoading && !authorsData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando autores...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Comunidade
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Autores ({stats?.total || 0})
            </h1>
          </div>
          <Button 
            size="sm" 
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={() => {
              setEditingAuthor(null);
              setIsSheetOpen(true);
            }}
          >
            <Plus className="size-4" />
            Adicionar autor
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Autores</p>
            <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
            <p className="text-3xl font-bold mt-1">{stats?.featured || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Perfis destacados</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Perfis Vinculados</p>
            <p className="text-3xl font-bold mt-1">{stats?.linkedProfiles || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Conectados a utilizadores</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Reivindicações Pendentes</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{stats?.pendingClaims || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Aguardando revisão</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar autores..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {totalCount} autores encontrados
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Autor</TableHead>
                <TableHead className="w-[150px]">Telefone</TableHead>
                <TableHead className="w-[150px]">Tipo de Autor</TableHead>
                <TableHead className="w-[150px]">Perfil Vinculado</TableHead>
                <TableHead className="w-[100px]">Destaque</TableHead>
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
              ) : authors?.map((author) => (
                <TableRow 
                  key={author.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(author)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={author.photo_url || undefined} alt={author.name} />
                        <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{author.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {author.phone || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {author.author_type || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {author.profile_id ? (
                      <span className="text-emerald-600">Sim</span>
                    ) : (
                      <span className="text-muted-foreground">Não</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {author.featured ? (
                      <span className="text-emerald-600 font-medium">Sim</span>
                    ) : (
                      <span className="text-muted-foreground">Não</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(author)}>
                          <FileEdit className="size-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(author.id)}>
                          <Trash2 className="size-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && authors?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum autor encontrado.
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
            <DialogTitle>{viewingAuthor?.name}</DialogTitle>
            <DialogDescription>
              Detalhes do autor
            </DialogDescription>
          </DialogHeader>
          
          {viewingAuthor && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Avatar className="size-24">
                  <AvatarImage src={viewingAuthor.photo_url || undefined} alt={viewingAuthor.name} />
                  <AvatarFallback className="text-2xl">{viewingAuthor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Biografia</p>
                    <p className="text-sm mt-1">{viewingAuthor.bio || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Tipo</p>
                  <p className="text-sm mt-1">{viewingAuthor.author_type || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Telefone</p>
                  <p className="text-sm mt-1">{viewingAuthor.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Cidade</p>
                  <p className="text-sm mt-1">{viewingAuthor.residence_city || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Província</p>
                  <p className="text-sm mt-1">{viewingAuthor.province || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Data de Nascimento</p>
                  <p className="text-sm mt-1">{viewingAuthor.birth_date ? formatDate(viewingAuthor.birth_date) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Perfil Vinculado</p>
                  <p className="text-sm mt-1">{viewingAuthor.profile_id ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
                  <p className="text-sm mt-1">{viewingAuthor.featured ? 'Sim' : 'Não'}</p>
                </div>
              </div>
              
              {viewingAuthor.featured_video && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Vídeo em Destaque</p>
                  <a 
                    href={viewingAuthor.featured_video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 block"
                  >
                    {viewingAuthor.featured_video}
                  </a>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleEdit(viewingAuthor);
                  }}
                >
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleDelete(viewingAuthor.id);
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
        if (!open) setEditingAuthor(null);
      }}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>{editingAuthor ? 'Editar Autor' : 'Adicionar Autor'}</SheetTitle>
            <SheetDescription>
              Crie um perfil de autor com informações detalhadas.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="name" 
                  name="name"
                  placeholder="Nome do autor" 
                  required 
                  defaultValue={editingAuthor?.name || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="authorType">Tipo de Autor</Label>
                  <Select name="authorType" defaultValue={editingAuthor?.author_type || ''}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="writer">Escritor</SelectItem>
                      <SelectItem value="poet">Poeta</SelectItem>
                      <SelectItem value="researcher">Investigador</SelectItem>
                      <SelectItem value="journalist">Jornalista</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    name="phone"
                    placeholder="+258 84 123 4567" 
                    defaultValue={editingAuthor?.phone || ''}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="bio">Biografia</Label>
                <Input
                  id="bio"
                  name="bio"
                  placeholder="Biografia do autor"
                  defaultValue={editingAuthor?.bio || ''}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input 
                  id="birthDate" 
                  name="birthDate"
                  type="date" 
                  defaultValue={editingAuthor?.birth_date || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="city">Cidade de Residência</Label>
                  <Input 
                    id="city" 
                    name="city"
                    placeholder="Nome da cidade" 
                    defaultValue={editingAuthor?.residence_city || ''}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="province">Província</Label>
                  <Input 
                    id="province" 
                    name="province"
                    placeholder="Nome da província" 
                    defaultValue={editingAuthor?.province || ''}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="videoUrl">URL do Vídeo em Destaque</Label>
                <Input 
                  id="videoUrl" 
                  name="videoUrl"
                  placeholder="https://youtube.com/watch?v=..." 
                  defaultValue={editingAuthor?.featured_video || ''}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="featured" 
                  name="featured"
                  defaultChecked={editingAuthor?.featured || false}
                  className="h-4 w-4"
                />
                <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                  Autor em destaque
                </Label>
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
                    setEditingAuthor(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingAuthor ? 'Guardar' : 'Criar Autor'}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
