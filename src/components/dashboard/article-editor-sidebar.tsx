import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Upload, Loader2, Languages } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { useTranslatePost } from "@/hooks/supabase/posts";
import { useUploadFile } from "@/hooks/supabase/upload";
import { Badge } from "@/components/ui/badge";
import { validateAndOptimizeImage } from "@/lib/imageOptimization";
import { toast } from "sonner";

interface ArticleEditorSidebarProps {
  postId?: string;
  status: string;
  setStatus: (value: string) => void;
  authorId: string | null;
  setAuthorId: (value: string | null) => void;
  authors: { id: string; name: string }[] | undefined;
  selectedCategories: string[];
  setSelectedCategories: (value: string[]) => void;
  categories: { id: string; name: string }[] | undefined;
  language: string;
  setLanguage: (value: string) => void;
  translationStatus: string | null;
  setTranslationStatus: (value: string | null) => void;
  excerpt: string;
  setExcerpt: (value: string) => void;
  featuredImageUrl: string | null;
  setFeaturedImageUrl: (value: string | null) => void;
  publishedAt: Date | null;
  setPublishedAt: (value: Date | null) => void;
  createdAt: string | null;
  updatedAt: string | null;
  translateMutation: ReturnType<typeof useTranslatePost>;
}

export function ArticleEditorSidebar({
  postId,
  status,
  setStatus,
  authorId,
  setAuthorId,
  authors,
  selectedCategories,
  setSelectedCategories,
  categories,
  language,
  setLanguage,
  translationStatus,
  setTranslationStatus,
  excerpt,
  setExcerpt,
  featuredImageUrl,
  setFeaturedImageUrl,
  publishedAt,
  setPublishedAt,
  createdAt,
  updatedAt,
  translateMutation,
}: ArticleEditorSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFile();
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState<{
    originalSizeMB: string;
    optimizedSizeMB: string;
  } | null>(null);
  
  const handleTranslate = async () => {
    if (!postId) return;
    try {
      await translateMutation.mutateAsync(postId);
      alert('Tradução iniciada. A tradução será criada como rascunho para revisão.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao traduzir';
      alert(message);
    }
  };
  
  const getTranslationStatusBadge = () => {
    if (!translationStatus) return null;
    switch (translationStatus) {
      case 'pending':
        return <Badge variant="outline" className="text-xs">Pendente</Badge>;
      case 'review':
        return <Badge className="bg-blue-500/15 text-blue-600 text-xs">Revisão</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500/15 text-emerald-600 text-xs">Completo</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{translationStatus}</Badge>;
    }
  };
  
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsOptimizingImage(true);
      setOptimizationStats(null);

      const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const optimizedFile = await validateAndOptimizeImage(file, 'postFeaturedImage');
      const optimizedSizeMB = (optimizedFile.size / 1024 / 1024).toFixed(2);

      const url = await uploadMutation.mutateAsync({ 
        file: optimizedFile,
        bucket: 'post-images',
        folder: ''
      });
      setFeaturedImageUrl(url);
      setOptimizationStats({ originalSizeMB, optimizedSizeMB });
      toast.success(`Imagem otimizada: ${originalSizeMB}MB -> ${optimizedSizeMB}MB`);
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(message);
    } finally {
      setIsOptimizingImage(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="w-80 border-l overflow-y-auto shrink-0 bg-muted/20">
      <div className="p-5 space-y-6">
        <div className="space-y-3">
          <Label>Imagem de Destaque</Label>
          <div className="border-2 border-dashed rounded-lg p-4 bg-background">
            {featuredImageUrl ? (
              <div className="space-y-2">
                <img
                  src={featuredImageUrl}
                  alt="Featured"
                  className="w-full h-32 object-cover rounded"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeaturedImageUrl(null)}
                  className="w-full text-destructive"
                >
                  Remover
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isOptimizingImage || uploadMutation.isPending}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOptimizingImage || uploadMutation.isPending}
                >
                  {isOptimizingImage || uploadMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Upload
                </Button>
                {isOptimizingImage ? (
                  <p className="text-xs text-muted-foreground">Otimizando imagem...</p>
                ) : optimizationStats ? (
                  <p className="text-xs text-emerald-600">
                    Otimizada: {optimizationStats.originalSizeMB}MB {'->'} {optimizationStats.optimizedSizeMB}MB
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">ou cole uma URL</p>
                )}
                <Input
                  placeholder="URL da imagem"
                  value={featuredImageUrl || ""}
                  onChange={(e) => setFeaturedImageUrl(e.target.value || null)}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="trash">Lixeira</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Autor</Label>
          <Select value={authorId || ""} onValueChange={(v) => setAuthorId(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar autor" />
            </SelectTrigger>
            <SelectContent>
              {authors?.map((author) => (
                <SelectItem key={author.id} value={author.id}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Categorias</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {categories?.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{category.name}</span>
              </label>
            ))}
            {categories?.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma categoria</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Idioma</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Estado da Tradução</Label>
          <div className="flex items-center gap-2">
            <Select 
              value={translationStatus || "none"} 
              onValueChange={(v) => setTranslationStatus(v === "none" ? null : v)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="review">Revisão</SelectItem>
                <SelectItem value="completed">Completo</SelectItem>
              </SelectContent>
            </Select>
            {getTranslationStatusBadge()}
          </div>
          {postId && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={handleTranslate}
              disabled={translateMutation.isPending}
            >
              {translateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Languages className="size-4" />
              )}
              Traduzir {language === 'pt' ? 'para Inglês' : 'para Português'}
            </Button>
          )}
          {!postId && (
            <p className="text-xs text-muted-foreground">
              Guarde o artigo primeiro para poder traduzir
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Excerto</Label>
          <Textarea
            placeholder="Breve descrição do artigo..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>

        <div className="space-y-3">
          <Label>Data de Publicação</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !publishedAt && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {publishedAt ? format(publishedAt, "PPP", { locale: pt }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={publishedAt || undefined}
                onSelect={(date) => setPublishedAt(date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {(createdAt || updatedAt) && (
          <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
            {createdAt && (
              <p>Criado: {format(new Date(createdAt), "PPp", { locale: pt })}</p>
            )}
            {updatedAt && (
              <p>Atualizado: {format(new Date(updatedAt), "PPp", { locale: pt })}</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
