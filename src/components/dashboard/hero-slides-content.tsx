import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, MoreHorizontal, ArrowUpDown, Upload, ExternalLink, Loader2 } from "lucide-react";
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
import { 
  useHeroSlides, 
  useCreateHeroSlide, 
  useUpdateHeroSlide, 
  useDeleteHeroSlide,
  useUploadFile,
  useBooksForHero,
  useAuthorsForHero,
  usePostsForHero
} from "@/hooks/use-supabase";
import type { HeroSlide } from "@/lib/supabase";
import { validateAndOptimizeImage } from "@/lib/imageOptimization";
import { toast } from "sonner";

type ContentType = 'book' | 'author' | 'post' | 'custom'

export function HeroSlidesContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [viewingSlide, setViewingSlide] = useState<HeroSlide | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    cta_text: '',
    cta_url: '',
    background_image_url: '',
    background_image_path: '',
    accent_color: '',
    content_type: 'custom' as ContentType,
    content_id: '',
    order_weight: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState<{
    originalSizeMB: string;
    optimizedSizeMB: string;
  } | null>(null);
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: slides, isLoading } = useHeroSlides();
  const { data: books } = useBooksForHero();
  const { data: authors } = useAuthorsForHero();
  const { data: posts } = usePostsForHero();
  
  const createMutation = useCreateHeroSlide();
  const updateMutation = useUpdateHeroSlide();
  const deleteMutation = useDeleteHeroSlide();
  const uploadMutation = useUploadFile();

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      cta_text: '',
      cta_url: '',
      background_image_url: '',
      background_image_path: '',
      accent_color: '',
      content_type: 'custom',
      content_id: '',
      order_weight: 0,
      is_active: true,
    });
    setImageFile(null);
    setImagePreview(null);
    setIsOptimizingImage(false);
    setOptimizationStats(null);
    setPostSearchQuery("");
  };

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setImageFile(null);
      setImagePreview(null);
      setOptimizationStats(null);
      return;
    }

    setIsOptimizingImage(true);
    setOptimizationStats(null);

    try {
      const originalSizeMB = (selected.size / 1024 / 1024).toFixed(2);
      const optimizedFile = await validateAndOptimizeImage(selected, 'heroBackground');
      const optimizedSizeMB = (optimizedFile.size / 1024 / 1024).toFixed(2);

      setImageFile(optimizedFile);
      setImagePreview(URL.createObjectURL(optimizedFile));
      setOptimizationStats({ originalSizeMB, optimizedSizeMB });
      toast.success(`Imagem otimizada: ${originalSizeMB}MB -> ${optimizedSizeMB}MB`);
    } catch (error) {
      console.error('Image optimization error:', error);
      toast.error(error instanceof Error ? error.message : 'Falha ao otimizar imagem');
      setImageFile(null);
      setImagePreview(null);
      setOptimizationStats(null);
      e.target.value = '';
    } finally {
      setIsOptimizingImage(false);
    }
  };

  useEffect(() => {
    if (formData.content_type === 'custom' || !formData.content_id) return;
    
    let autoUrl = '';
    switch (formData.content_type) {
      case 'book':
        autoUrl = `/livro/${formData.content_id}`;
        break;
      case 'author':
        autoUrl = `/autor/${formData.content_id}`;
        break;
      case 'post':
        const selectedPost = posts?.find(p => p.id === formData.content_id);
        autoUrl = selectedPost?.slug ? `/noticias/${selectedPost.slug}` : '';
        break;
    }
    
    if (autoUrl && formData.cta_url !== autoUrl) {
      handleFieldChange('cta_url', autoUrl);
    }
  }, [formData.content_type, formData.content_id, posts]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    let background_image_url = formData.background_image_url;
    let background_image_path = formData.background_image_path;
    
    if (imageFile) {
      try {
        const path = `hero-backgrounds/${Date.now()}-${imageFile.name}`;
        const url = await uploadMutation.mutateAsync({ 
          file: imageFile, 
          bucket: 'hero-backgrounds',
          folder: ''
        });
        background_image_url = url;
        background_image_path = path;
      } catch (error) {
        alert('Erro ao fazer upload da imagem');
        return;
      }
    }
    
    const slideData = {
      title: formData.title,
      subtitle: formData.subtitle || null,
      description: formData.description || null,
      cta_text: formData.cta_text || null,
      cta_url: formData.cta_url || null,
      background_image_url,
      background_image_path,
      accent_color: formData.accent_color || null,
      content_type: formData.content_type,
      content_id: formData.content_id || null,
      order_weight: formData.order_weight,
      is_active: formData.is_active,
    };

    if (editingSlide) {
      await updateMutation.mutateAsync({ id: editingSlide.id, ...slideData });
    } else {
      await createMutation.mutateAsync(slideData);
    }
    
    setIsSheetOpen(false);
    setEditingSlide(null);
    resetForm();
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      cta_text: slide.cta_text || '',
      cta_url: slide.cta_url || '',
      background_image_url: slide.background_image_url || '',
      background_image_path: slide.background_image_path || '',
      accent_color: slide.accent_color || '',
      content_type: (slide.content_type as ContentType) || 'custom',
      content_id: slide.content_id || '',
      order_weight: slide.order_weight ?? 0,
      is_active: slide.is_active ?? true,
    });
    setImagePreview(slide.background_image_url);
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

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'book': return 'Livro';
      case 'author': return 'Autor';
      case 'post': return 'Artigo';
      default: return 'Personalizado';
    }
  };

  const getLinkedContentName = (slide: HeroSlide) => {
    if (slide.content_type === 'custom' || !slide.content_id) return '-';
    
    if (slide.content_type === 'book') {
      const book = books?.find(b => b.id === slide.content_id);
      return book?.title ?? 'Desconhecido';
    }
    if (slide.content_type === 'author') {
      const author = authors?.find(a => a.id === slide.content_id);
      return author?.name ?? 'Desconhecido';
    }
    if (slide.content_type === 'post') {
      const post = posts?.find(p => p.id === slide.content_id);
      return post?.title ?? 'Desconhecido';
    }
    return '-';
  };

  const getContentOptions = () => {
    switch (formData.content_type) {
      case 'book': return books ?? [];
      case 'author': return authors ?? [];
      case 'post': return posts ?? [];
      default: return [];
    }
  };

  const filteredPosts = (posts ?? []).filter((post) => {
    const query = postSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      post.title.toLowerCase().includes(query) ||
      (post.slug ?? "").toLowerCase().includes(query)
    );
  });

  const selectedPost = (posts ?? []).find((post) => post.id === formData.content_id);
  const searchablePostOptions =
    selectedPost && !filteredPosts.some((post) => post.id === selectedPost.id)
      ? [selectedPost, ...filteredPosts]
      : filteredPosts;

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
                <TableHead>Tipo</TableHead>
                <TableHead>Conteúdo Ligado</TableHead>
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
                      {getContentTypeLabel(slide.content_type || 'custom')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getLinkedContentName(slide)}
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
                  <p className="text-sm mt-1">{getContentTypeLabel(viewingSlide.content_type || 'custom')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Conteúdo Ligado</p>
                <p className="text-sm mt-1">{getLinkedContentName(viewingSlide)}</p>
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
              
              {viewingSlide.accent_color && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Cor de Destaque</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: viewingSlide.accent_color }}
                      />
                      <p className="text-sm">{viewingSlide.accent_color}</p>
                    </div>
                  </div>
                </div>
              )}
              
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
        if (!open) {
          setEditingSlide(null);
          resetForm();
        }
      }}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex h-full sm:h-screen flex-col overflow-hidden">
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>{editingSlide ? 'Editar Slide' : 'Novo Hero Slide'}</SheetTitle>
            <SheetDescription>
              Crie e gerencie slides do hero para o carrossel da homepage.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Image Upload */}
              <div className="space-y-3">
                <Label>Imagem de Fundo</Label>
                <div className="border-2 border-dashed rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={isOptimizingImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isOptimizingImage}
                    >
                      {isOptimizingImage ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      Escolher arquivo
                    </Button>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      <span className="font-medium">
                        {isOptimizingImage
                          ? 'Otimizando imagem...'
                          : imageFile?.name ?? (imagePreview ? 'Imagem carregada' : 'Nenhum arquivo')}
                      </span>
                      {optimizationStats ? (
                        <span className="text-xs text-emerald-600">
                          Otimizada: {optimizationStats.originalSizeMB}MB {'->'} {optimizationStats.optimizedSizeMB}MB
                        </span>
                      ) : (
                        <span className="text-xs">JPG/PNG/WebP, até 50MB</span>
                      )}
                    </div>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-12 w-20 rounded border object-cover ml-auto"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="title">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Digite o título do slide"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                  placeholder="Digite o subtítulo (opcional)"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Breve descrição do slide"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="cta_text">Texto do Botão</Label>
                <Input
                  id="cta_text"
                  value={formData.cta_text}
                  onChange={(e) => handleFieldChange('cta_text', e.target.value)}
                  placeholder="ex: Explorar, Ver Mais, Saber Mais"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="cta_url">URL do Botão</Label>
                <Input
                  id="cta_url"
                  value={formData.cta_url}
                  onChange={(e) => handleFieldChange('cta_url', e.target.value)}
                  placeholder="/livros, /autores, https://..."
                  disabled={formData.content_type !== 'custom' && !!formData.content_id}
                />
                {formData.content_type !== 'custom' && formData.content_id && (
                  <p className="text-xs text-blue-600">
                    Preenchido automaticamente. Mude para "Personalizado" para editar manualmente.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="content_type">Tipo de Conteúdo</Label>
                <Select 
                  value={formData.content_type} 
                  onValueChange={(v) => {
                    handleFieldChange('content_type', v);
                    handleFieldChange('content_id', '');
                    setPostSearchQuery('');
                    if (v !== 'author' && v !== 'book') {
                      handleFieldChange('accent_color', '');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Personalizado</SelectItem>
                    <SelectItem value="book">Destaque de Livro</SelectItem>
                    <SelectItem value="author">Destaque de Autor</SelectItem>
                    <SelectItem value="post">Destaque de Artigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.content_type !== 'custom' && (
                <div className="space-y-3">
                  <Label>
                    Selecionar {formData.content_type === 'book' ? 'Livro' : formData.content_type === 'author' ? 'Autor' : 'Artigo'}
                  </Label>
                  {formData.content_type === 'post' && (
                    <Input
                      value={postSearchQuery}
                      onChange={(e) => setPostSearchQuery(e.target.value)}
                      placeholder="Pesquisar artigo por titulo ou slug..."
                    />
                  )}
                  <Select
                    value={formData.content_id}
                    onValueChange={(v) => handleFieldChange('content_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Selecione um ${formData.content_type === 'book' ? 'livro' : formData.content_type === 'author' ? 'autor' : 'artigo'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.content_type === 'post'
                        ? searchablePostOptions.map((post) => (
                            <SelectItem key={post.id} value={post.id}>
                              {post.title}
                            </SelectItem>
                          ))
                        : getContentOptions().map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {'name' in item ? item.name : item.title}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  {formData.content_type === 'post' && postSearchQuery.trim() && (
                    <p className="text-xs text-muted-foreground">
                      {searchablePostOptions.length} artigo(s) encontrado(s)
                    </p>
                  )}
                  {(formData.content_type === 'post' ? searchablePostOptions.length : getContentOptions().length) === 0 && (
                    <p className="text-xs text-amber-600">
                      Nenhum {formData.content_type === 'book' ? 'livro' : formData.content_type === 'author' ? 'autor em destaque' : 'artigo publicado'} disponível.
                    </p>
                  )}
                </div>
              )}

              {(formData.content_type === 'author' || formData.content_type === 'book') && (
                <div className="space-y-3">
                  <Label>Cor de Destaque</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(formData.accent_color) ? formData.accent_color : '#4b5563'}
                      onChange={(e) => handleFieldChange('accent_color', e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border bg-background"
                    />
                    <Input
                      value={formData.accent_color}
                      onChange={(e) => handleFieldChange('accent_color', e.target.value)}
                      placeholder="#4b5563"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usada como fundo para slides de destaque.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="order_weight">Peso da Ordem</Label>
                  <Input
                    id="order_weight"
                    type="number"
                    value={formData.order_weight}
                    onChange={(e) => handleFieldChange('order_weight', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Números menores aparecem primeiro
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleFieldChange('is_active', checked === true)}
                    />
                    <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                      Ativo (visível na homepage)
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
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending || isOptimizingImage}
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : null}
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
