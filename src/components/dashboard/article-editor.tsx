import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { RichTextEditor, EditorRef } from "@/components/ui/richtext-editor";
import { ArticleEditorHeader } from "./article-editor-header";
import { ArticleEditorSidebar } from "./article-editor-sidebar";
import { 
  usePost, 
  usePostCategoriesMap, 
  useAuthorsList, 
  usePostCategories, 
  useCreatePost, 
  useUpdatePost,
  useUploadFile,
  useTranslatePost
} from "@/hooks/use-supabase";
import { 
  Bold, Italic, Underline,
  List, ListOrdered, Quote, Link, 
  Image, Heading1, Heading2, Heading3,
  Undo, Redo, Loader2
} from "lucide-react";
import { validateAndOptimizeImage } from "@/lib/imageOptimization";
import { toast } from "sonner";

interface ArticleEditorProps {
  postId?: string;
}

export function ArticleEditor({ postId }: ArticleEditorProps) {
  const navigate = useNavigate();
  const isNew = !postId;
  const editorRef = useRef<EditorRef>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFile();
  
  const { data: post } = usePost(postId);
  const { data: existingCategories } = usePostCategoriesMap(postId);
  const { data: authors } = useAuthorsList();
  const { data: categories } = usePostCategories();
  
  const createMutation = useCreatePost();
  const updateMutation = useUpdatePost();
  const translateMutation = useTranslatePost();
  
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("draft");
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [language, setLanguage] = useState("pt");
  const [translationStatus, setTranslationStatus] = useState<string | null>(null);
  const [excerpt, setExcerpt] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const isSaving = createMutation.isPending || updateMutation.isPending;
  
  useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setBody(post.body || "");
      setStatus(post.status || "draft");
      setAuthorId(post.author_id || null);
      setLanguage(post.language || "pt");
      setTranslationStatus(post.translation_status || null);
      setExcerpt(post.excerpt || "");
      setFeaturedImageUrl(post.featured_image_url || null);
      setPublishedAt(post.published_at ? new Date(post.published_at) : null);
    }
  }, [post]);
  
  useEffect(() => {
    if (existingCategories) {
      setSelectedCategories(existingCategories);
    }
  }, [existingCategories]);
  
  const handleChange = useCallback(() => {
    setHasChanges(true);
  }, []);
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);
  
  const handleSave = async () => {
    const postData = {
      title,
      slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      body,
      status: status as any,
      author_id: authorId,
      language: language as 'pt' | 'en',
      translation_status: translationStatus as any,
      excerpt: excerpt || null,
      featured_image_url: featuredImageUrl,
      published_at: publishedAt?.toISOString() || null,
    };
    
    try {
      if (isNew) {
        const result = await createMutation.mutateAsync({ 
          post: postData, 
          categories: selectedCategories 
        });
        setHasChanges(false);
        navigate({ to: '/artigos/$id/editar', params: { id: result.id } });
      } else {
        await updateMutation.mutateAsync({ 
          id: postId!, 
          post: postData, 
          categories: selectedCategories 
        });
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Erro ao guardar o artigo");
    }
  };
  
  const handlePublish = async () => {
    const postData = {
      title,
      slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      body,
      status: 'published' as const,
      author_id: authorId,
      language: language as 'pt' | 'en',
      translation_status: translationStatus as any,
      excerpt: excerpt || null,
      featured_image_url: featuredImageUrl,
      published_at: publishedAt?.toISOString() || new Date().toISOString(),
    };
    
    try {
      if (isNew) {
        const result = await createMutation.mutateAsync({ 
          post: postData, 
          categories: selectedCategories 
        });
        setHasChanges(false);
        navigate({ to: '/artigos/$id/editar', params: { id: result.id } });
      } else {
        await updateMutation.mutateAsync({ 
          id: postId!, 
          post: postData, 
          categories: selectedCategories 
        });
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error publishing:", error);
      alert("Erro ao publicar o artigo");
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <ArticleEditorHeader
        isSaving={isSaving}
        hasChanges={hasChanges}
        onSave={handleSave}
        onPublish={handlePublish}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b bg-background px-6 py-2 flex items-center gap-0.5 shrink-0">
            <Toggle
              size="sm"
              onPressedChange={() => editorRef.current?.toggleHeading(1)}
              title="Título 1"
              className="border-0 bg-transparent hover:bg-muted"
            >
              <Heading1 className="size-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => editorRef.current?.toggleHeading(2)}
              title="Título 2"
              className="border-0 bg-transparent hover:bg-muted"
            >
              <Heading2 className="size-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => editorRef.current?.toggleHeading(3)}
              title="Título 3"
              className="border-0 bg-transparent hover:bg-muted"
            >
              <Heading3 className="size-4" />
            </Toggle>
            
            <div className="w-px h-5 bg-border mx-1" />
            
            <Toggle
              size="sm"
              onPressedChange={() => editorRef.current?.toggleBold()}
              title="Negrito"
              className="border-0 bg-transparent hover:bg-muted"
            >
              <Bold className="size-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => editorRef.current?.toggleItalic()}
              title="Itálico"
              className="border-0 bg-transparent hover:bg-muted"
            >
              <Italic className="size-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => editorRef.current?.toggleUnderline()}
              title="Sublinhado"
              className="border-0 bg-transparent hover:bg-muted"
            >
              <Underline className="size-4" />
            </Toggle>
            
            <div className="w-px h-5 bg-border mx-1" />
            
            <Toggle
              size="sm"
              onPressedChange={() => editorRef.current?.toggleBulletList()}
              title="Lista"
              className="border-0 bg-transparent hover:bg-muted"
            >
              <List className="size-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => editorRef.current?.toggleOrderedList()}
              title="Lista numerada"
              className="border-0 bg-transparent hover:bg-muted"
            >
              <ListOrdered className="size-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => editorRef.current?.toggleBlockquote()}
              title="Citação"
              className="border-0 bg-transparent hover:bg-muted"
            >
              <Quote className="size-4" />
            </Toggle>
            
            <div className="w-px h-5 bg-border mx-1" />
            
            <Toggle
              size="sm"
              onPressedChange={() => editorRef.current?.addLink()}
              title="Link"
              className="border-0 bg-transparent hover:bg-muted"
            >
              <Link className="size-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => imageInputRef.current?.click()}
              title="Imagem"
              className="border-0 bg-transparent hover:bg-muted"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Image className="size-4" />
              )}
            </Toggle>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
                  const optimizedFile = await validateAndOptimizeImage(file, 'postInlineImage');
                  const optimizedSizeMB = (optimizedFile.size / 1024 / 1024).toFixed(2);

                  const url = await uploadMutation.mutateAsync({ 
                    file: optimizedFile,
                    bucket: 'post-images',
                    folder: ''
                  });
                  editorRef.current?.setImage(url);
                  toast.success(`Imagem otimizada: ${originalSizeMB}MB -> ${optimizedSizeMB}MB`);
                } catch (error) {
                  console.error('Upload failed:', error);
                  const message = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem';
                  toast.error(message);
                }
                if (imageInputRef.current) {
                  imageInputRef.current.value = '';
                }
              }}
            />
            
            <div className="flex-1" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editorRef.current?.undo()}
              title="Desfazer"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <Undo className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editorRef.current?.redo()}
              title="Refazer"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <Redo className="size-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto py-8 px-6">
              <textarea
                placeholder="Título"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  handleChange();
                }}
                rows={1}
                className="w-full text-2xl font-bold border-0 px-0 py-1 bg-transparent focus:outline-none placeholder:text-muted-foreground leading-normal mb-6 resize-none overflow-hidden"
                style={{ height: 'auto', minHeight: '2.5rem' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              
              <RichTextEditor
                ref={editorRef}
                content={body}
                onChange={(content) => {
                  setBody(content);
                  handleChange();
                }}
                placeholder="Comece a escrever..."
                className="border-0"
              />
            </div>
          </div>
        </main>
        
        <ArticleEditorSidebar
          postId={postId}
          status={status}
          setStatus={(v) => { setStatus(v); handleChange(); }}
          authorId={authorId}
          setAuthorId={(v) => { setAuthorId(v); handleChange(); }}
          authors={authors}
          selectedCategories={selectedCategories}
          setSelectedCategories={(v) => { setSelectedCategories(v); handleChange(); }}
          categories={categories}
          language={language}
          setLanguage={(v) => { setLanguage(v); handleChange(); }}
          translationStatus={translationStatus}
          setTranslationStatus={(v) => { setTranslationStatus(v); handleChange(); }}
          excerpt={excerpt}
          setExcerpt={(v) => { setExcerpt(v); handleChange(); }}
          featuredImageUrl={featuredImageUrl}
          setFeaturedImageUrl={(v) => { setFeaturedImageUrl(v); handleChange(); }}
          publishedAt={publishedAt}
          setPublishedAt={(v) => { setPublishedAt(v); handleChange(); }}
          createdAt={post?.created_at || null}
          updatedAt={post?.updated_at || null}
          translateMutation={translateMutation}
        />
      </div>
    </div>
  );
}
