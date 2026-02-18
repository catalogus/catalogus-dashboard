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
import { CalendarIcon, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useUploadFile } from "@/hooks/use-supabase";

interface ArticleEditorSidebarProps {
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
}

export function ArticleEditorSidebar({
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
}: ArticleEditorSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFile();
  
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
      const url = await uploadMutation.mutateAsync({ 
        file, 
        bucket: 'post-images',
        folder: ''
      });
      setFeaturedImageUrl(url);
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao fazer upload da imagem.\n\n${message}\n\nVerifique se o bucket "post-images" existe no Supabase Storage.`);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="w-72 border-l overflow-y-auto shrink-0 bg-muted/20">
      <div className="p-5 space-y-6">
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
          <Select 
            value={translationStatus || "none"} 
            onValueChange={(v) => setTranslationStatus(v === "none" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="review">Revisão</SelectItem>
              <SelectItem value="completed">Completo</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Upload
                </Button>
                <p className="text-xs text-muted-foreground">ou cole uma URL</p>
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
