import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/richtext-editor";
import { ArticleEditorHeader } from "./article-editor-header";
import { ArticleEditorSidebar } from "./article-editor-sidebar";
import { 
  usePost, 
  usePostCategoriesMap, 
  useAuthorsList, 
  usePostCategories, 
  useCreatePost, 
  useUpdatePost 
} from "@/hooks/use-supabase";

interface ArticleEditorProps {
  postId?: string;
}

export function ArticleEditor({ postId }: ArticleEditorProps) {
  const navigate = useNavigate();
  const isNew = !postId;
  
  const { data: post } = usePost(postId);
  const { data: existingCategories } = usePostCategoriesMap(postId);
  const { data: authors } = useAuthorsList();
  const { data: categories } = usePostCategories();
  
  const createMutation = useCreatePost();
  const updateMutation = useUpdatePost();
  
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
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto py-8 px-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="sr-only">Título</Label>
              <Input
                id="title"
                placeholder="Título"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  handleChange();
                }}
                className="text-3xl font-bold border-0 px-0 focus-visible:ring-0 h-auto py-1 bg-transparent"
              />
            </div>
            
            <RichTextEditor
              content={body}
              onChange={(content) => {
                setBody(content);
                handleChange();
              }}
              placeholder="Comece a escrever..."
              className="border-0"
            />
          </div>
        </main>
        
        <ArticleEditorSidebar
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
        />
      </div>
    </div>
  );
}
