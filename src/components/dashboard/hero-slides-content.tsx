import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, MoreHorizontal, ArrowUpDown, Upload, ExternalLink } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide } from "@/hooks/use-supabase";
import type { HeroSlide } from "@/lib/supabase";

export function HeroSlidesContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [viewingSlide, setViewingSlide] = useState<HeroSlide | null>(null);
  const { data: slides, isLoading } = useHeroSlides();
  const createMutation = useCreateHeroSlide();
  const updateMutation = useUpdateHeroSlide();
  const deleteMutation = useDeleteHeroSlide();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const slideData = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string || null,
      description: formData.get('description') as string || null,
      cta_text: formData.get('ctaText') as string || null,
      cta_url: formData.get('ctaUrl') as string || null,
      content_type: formData.get('contentType') as string || 'custom',
      order_weight: parseInt(formData.get('order') as string) || 0,
      is_active: formData.get('isActive') === 'on',
      background_image_url: 'https://placehold.co/1920x1080',
    };

    if (editingSlide) {
      await updateMutation.mutateAsync({ id: editingSlide.id, ...slideData });
    } else {
      await createMutation.mutateAsync(slideData);
    }
    
    setIsSheetOpen(false);
    setEditingSlide(null);
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este slide?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    await updateMutation.mutateAsync({ 
      id: slide.id, 
      is_active: !slide.is_active 
    });
  };

  const handleRowClick = (slide: HeroSlide) => {
    setViewingSlide(slide);
    setIsDetailOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando slides...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Conteúdo
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Slides do Hero
            </h1>
          </div>
          <Button 
            size="sm" 
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={() => {
              setEditingSlide(null);
              setIsSheetOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo Slide
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Thumbnail</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo de Conteúdo</TableHead>
                <TableHead>CTA</TableHead>
                <TableHead className="w-[80px]">
                  <div className="flex items-center gap-1">
                    Ordem
                    <ArrowUpDown className="size-3" />
                  </div>
                </TableHead>
                <TableHead className="w-[80px]">Ativo</TableHead>
                <TableHead className="w-[60px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides?.map((slide) => (
                <TableRow 
                  key={slide.id} 
                  className="cursor-pointer"
                  onClick={() => handleRowClick(slide)}
                >
                  <TableCell>
                    {slide.background_image_url ? (
                      <img
                        src={slide.background_image_url}
                        alt={slide.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-muted rounded" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{slide.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {slide.content_type || 'custom'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {slide.cta_text || '-'}
                  </TableCell>
                  <TableCell className="text-center">{slide.order_weight ?? 0}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleToggleActive(slide)}
                      className="flex justify-center w-full cursor-pointer"
                    >
                      {slide.is_active ? (
                        <Eye className="size-4 text-emerald-500" />
                      ) : (
                        <EyeOff className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(slide)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(slide.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {slides?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum slide encontrado. Clique em "Novo Slide" para adicionar.
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
            <DialogTitle>{viewingSlide?.title}</DialogTitle>
            <DialogDescription>
              Detalhes do slide
            </DialogDescription>
          </DialogHeader>
          
          {viewingSlide && (
            <div className="space-y-4">
              {viewingSlide.background_image_url && (
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={viewingSlide.background_image_url} 
                    alt={viewingSlide.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Subtítulo</p>
                  <p className="text-sm mt-1">{viewingSlide.subtitle || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Tipo de Conteúdo</p>
                  <p className="text-sm mt-1">{viewingSlide.content_type || 'custom'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Descrição</p>
                <p className="text-sm mt-1">{viewingSlide.description || '-'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Texto do Botão</p>
                  <p className="text-sm mt-1">{viewingSlide.cta_text || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">URL do Botão</p>
                  {viewingSlide.cta_url ? (
                    <a 
                      href={viewingSlide.cta_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      {viewingSlide.cta_url}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <p className="text-sm mt-1">-</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Ordem</p>
                  <p className="text-sm mt-1">{viewingSlide.order_weight ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <Badge variant={viewingSlide.is_active ? "default" : "secondary"} className="mt-1">
                    {viewingSlide.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Criado em</p>
                  <p className="text-sm mt-1">{formatDate(viewingSlide.created_at)}</p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleEdit(viewingSlide);
                  }}
                >
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleDelete(viewingSlide.id);
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
        if (!open) setEditingSlide(null);
      }}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>{editingSlide ? 'Editar Slide' : 'Novo Hero Slide'}</SheetTitle>
            <SheetDescription>
              Crie e gerencie slides do hero para o carrossel da homepage.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div className="space-y-3">
                <Label>Imagem de Fundo</Label>
                <div className="border-2 border-dashed rounded-lg p-6 bg-muted/50">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Button type="button" variant="outline" className="gap-2">
                      <Upload className="size-4" />
                      Escolher arquivo
                    </Button>
                    <p className="text-sm text-muted-foreground">Nenhum arquivo escolhido</p>
                    <p className="text-xs text-muted-foreground">JPG/PNG, até 50MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="title">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Digite o título do slide"
                  required
                  defaultValue={editingSlide?.title || ''}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  name="subtitle"
                  placeholder="Digite o subtítulo (opcional)"
                  defaultValue={editingSlide?.subtitle || ''}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Breve descrição do slide"
                  rows={3}
                  defaultValue={editingSlide?.description || ''}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="ctaText">Texto do Botão</Label>
                <Input
                  id="ctaText"
                  name="ctaText"
                  placeholder="ex: Explorar, Ver Mais, Saber Mais"
                  defaultValue={editingSlide?.cta_text || ''}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="ctaUrl">URL do Botão</Label>
                <Input
                  id="ctaUrl"
                  name="ctaUrl"
                  placeholder="/livros, /autores, https://..."
                  defaultValue={editingSlide?.cta_url || ''}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="contentType">Tipo de Conteúdo</Label>
                <Select name="contentType" defaultValue={editingSlide?.content_type || 'custom'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de conteúdo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Personalizado</SelectItem>
                    <SelectItem value="article">Artigo</SelectItem>
                    <SelectItem value="book">Livro</SelectItem>
                    <SelectItem value="author">Autor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="order">Peso da Ordem</Label>
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    defaultValue={editingSlide?.order_weight ?? 0}
                    min="0"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="isActive" 
                      name="isActive"
                      defaultChecked={editingSlide?.is_active ?? true}
                    />
                    <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                      Ativo
                    </Label>
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
                    setEditingSlide(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingSlide ? 'Guardar' : 'Criar Slide'}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
