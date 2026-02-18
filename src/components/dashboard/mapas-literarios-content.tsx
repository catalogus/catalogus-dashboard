import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, FileEdit, Trash2, Cloud, ExternalLink, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublications, usePublicationStats, useCreatePublication, useUpdatePublication, useDeletePublication } from "@/hooks/use-supabase";
import type { Publication } from "@/lib/supabase";

export function MapasLiterariosContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [viewingPublication, setViewingPublication] = useState<Publication | null>(null);
  const { data: publications, isLoading } = usePublications();
  const { data: stats } = usePublicationStats();
  const createMutation = useCreatePublication();
  const updateMutation = useUpdatePublication();
  const deleteMutation = useDeletePublication();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const publicationData = {
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string || null,
      display_mode: formData.get('displayMode') as 'single' | 'double',
      page_width: parseInt(formData.get('width') as string) || 400,
      page_height: parseInt(formData.get('height') as string) || 600,
      publish_date: formData.get('publishDate') as string || null,
      is_active: formData.get('active') === 'on',
      is_featured: formData.get('featured') === 'on',
      pdf_path: 'placeholder.pdf',
    };

    if (editingPublication) {
      await updateMutation.mutateAsync({ id: editingPublication.id, ...publicationData });
    } else {
      await createMutation.mutateAsync(publicationData);
    }
    
    setIsSheetOpen(false);
    setEditingPublication(null);
  };

  const handleEdit = (pub: Publication) => {
    setEditingPublication(pub);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta publicação?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleRowClick = (pub: Publication) => {
    setViewingPublication(pub);
    setIsDetailOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando publicações...</p>
      </div>
    );
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
              Mapas Literários
            </h1>
          </div>
          <Button 
            size="sm" 
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={() => {
              setEditingPublication(null);
              setIsSheetOpen(true);
            }}
          >
            <Plus className="size-4" />
            Adicionar publicação
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
            <p className="text-xs text-muted-foreground mt-1">Visível para leitores</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
            <p className="text-3xl font-bold mt-1">{stats?.featured || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Destacado</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Processado</p>
            <p className="text-3xl font-bold mt-1">{stats?.processed || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Contagem de páginas &gt; 0</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[80px]">Capa</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="w-[100px]">Páginas</TableHead>
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead className="w-[100px]">Estado</TableHead>
                <TableHead className="w-[80px]">Acções</TableHead>
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
                      <img
                        src={pub.cover_url}
                        alt={pub.title}
                        className="w-14 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-14 h-20 bg-muted rounded flex items-center justify-center">
                        <FileText className="size-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{pub.title}</span>
                  </TableCell>
                  <TableCell className="text-center">{pub.page_count || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {pub.publish_date ? formatDate(pub.publish_date) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {pub.is_active && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 w-fit">Activo</Badge>
                      )}
                      {pub.is_featured && (
                        <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 w-fit">Destaque</Badge>
                      )}
                      {!pub.is_active && !pub.is_featured && (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
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
                        <DropdownMenuItem onClick={() => handleEdit(pub)}>
                          <FileEdit className="size-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(pub.id)}
                        >
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
                    Nenhuma publicação encontrada. Clique em "Adicionar publicação" para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingPublication?.title}</DialogTitle>
            <DialogDescription>
              Detalhes da publicação
            </DialogDescription>
          </DialogHeader>
          
          {viewingPublication && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {viewingPublication.cover_url ? (
                  <img 
                    src={viewingPublication.cover_url} 
                    alt={viewingPublication.title}
                    className="w-32 h-44 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-44 bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="size-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Descrição</p>
                    <p className="text-sm mt-1">{viewingPublication.description || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Páginas</p>
                  <p className="text-sm mt-1">{viewingPublication.page_count || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Tamanho</p>
                  <p className="text-sm mt-1">{formatFileSize(viewingPublication.file_size_bytes)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Modo de Exibição</p>
                  <p className="text-sm mt-1">{viewingPublication.display_mode === 'double' ? 'Página dupla' : 'Página única'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Dimensões</p>
                  <p className="text-sm mt-1">{viewingPublication.page_width} × {viewingPublication.page_height}px</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={viewingPublication.is_active ? "default" : "secondary"}>
                      {viewingPublication.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {viewingPublication.is_featured && (
                      <Badge className="bg-amber-500/15 text-amber-600">Destaque</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Data de Publicação</p>
                  <p className="text-sm mt-1">{viewingPublication.publish_date ? formatDate(viewingPublication.publish_date) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Criado em</p>
                  <p className="text-sm mt-1">{formatDateTime(viewingPublication.created_at)}</p>
                </div>
              </div>
              
              {viewingPublication.pdf_url && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Ficheiro PDF</p>
                  <a 
                    href={viewingPublication.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    Ver PDF
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleEdit(viewingPublication);
                  }}
                >
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleDelete(viewingPublication.id);
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
        if (!open) setEditingPublication(null);
      }}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>{editingPublication ? 'Editar publicação' : 'Nova publicação'}</SheetTitle>
            <SheetDescription>
              Carregue um PDF e configure as opções de visualização.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div className="space-y-3">
                <Label>Ficheiro PDF</Label>
                <div className="border-2 border-dashed rounded-lg p-8 bg-muted/50">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Cloud className="size-10 text-muted-foreground" />
                    <p className="text-sm text-center">
                      Arraste um ficheiro PDF ou{" "}
                      <span className="text-primary cursor-pointer hover:underline">
                        seleccione do computador
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">PDF até 50MB</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="title">
                    Título <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Nome da publicação"
                    required
                    defaultValue={editingPublication?.title || ''}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="slug">
                    Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="url-amigavel"
                    required
                    defaultValue={editingPublication?.slug || ''}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Breve descrição da publicação"
                  rows={3}
                  defaultValue={editingPublication?.description || ''}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                  <Label>Modo de exibição</Label>
                  <Select name="displayMode" defaultValue={editingPublication?.display_mode || 'double'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="double">Página dupla</SelectItem>
                      <SelectItem value="single">Página única</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="width">Largura (px)</Label>
                  <Input
                    id="width"
                    name="width"
                    type="number"
                    defaultValue={editingPublication?.page_width || 400}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="height">Altura (px)</Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    defaultValue={editingPublication?.page_height || 600}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="publishDate">Data de publicação</Label>
                  <Input
                    id="publishDate"
                    name="publishDate"
                    type="date"
                    defaultValue={editingPublication?.publish_date || ''}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Estado</Label>
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="active" 
                        name="active"
                        defaultChecked={editingPublication?.is_active ?? true}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="active" className="text-sm font-normal cursor-pointer">
                        Activo
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="featured" 
                        name="featured"
                        defaultChecked={editingPublication?.is_featured ?? false}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                        Destaque
                      </Label>
                    </div>
                  </div>
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
                    setEditingPublication(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingPublication ? 'Guardar' : 'Criar publicação'}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
