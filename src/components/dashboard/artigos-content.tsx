import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, Trash2, FileEdit, X, Check, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  usePosts,
  usePostStats,
  usePostStatusCountsWithFilters,
  usePostCategories,
  useBulkUpdatePosts,
  useMovePostsToTrash,
  useRestorePostsFromTrash,
  useDeletePostsPermanently,
} from "@/hooks/use-supabase";
import type { Database } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TabStatus = "all" | "published" | "draft" | "trash";

type PostListItem = Pick<Database["public"]["Tables"]["posts"]["Row"],
  "id" | "title" | "status" | "translation_status" | "created_at"> & {
  profiles?: { name: string | null } | null;
};

const PAGE_SIZE = 10;

export function ArtigosContent() {
  const [activeTab, setActiveTab] = useState<TabStatus>("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState<"all" | "pt" | "en">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title_asc" | "title_desc" | "featured">("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: postsData, isLoading } = usePosts({
    status: activeTab,
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    categoryId: selectedCategory,
    language: selectedLanguage,
    sortBy,
  });
  const { data: stats } = usePostStats();
  const { data: filteredStatusCounts } = usePostStatusCountsWithFilters({
    search: debouncedSearch,
    categoryId: selectedCategory,
    language: selectedLanguage,
  });
  const { data: categories } = usePostCategories();
  const bulkUpdateMutation = useBulkUpdatePosts();
  const moveToTrashMutation = useMovePostsToTrash();
  const restoreMutation = useRestorePostsFromTrash();
  const deletePermanentlyMutation = useDeletePostsPermanently();

  const posts = (postsData?.data || []) as PostListItem[];
  const totalPages = postsData?.totalPages || 1;
  const totalCount = postsData?.totalCount || 0;
  
  const allSelected = posts.length > 0 && posts.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const tabs = [
    { id: "published" as TabStatus, label: "Publicados", count: filteredStatusCounts?.published ?? stats?.published ?? 0 },
    { id: "draft" as TabStatus, label: "Rascunhos", count: filteredStatusCounts?.draft ?? stats?.draft ?? 0 },
    { id: "trash" as TabStatus, label: "Lixeira", count: filteredStatusCounts?.trash ?? stats?.trash ?? 0 },
  ];

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== "all" ||
    selectedLanguage !== "all" ||
    sortBy !== "newest";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">published</Badge>;
      case "draft":
        return <Badge variant="secondary">draft</Badge>;
      case "trash":
        return <Badge variant="destructive">trash</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTranslationBadge = (status: string | null) => {
    if (!status) return <span className="text-muted-foreground">-</span>;
    switch (status) {
      case "review":
        return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/20">review</Badge>;
      case "completed":
        return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">completed</Badge>;
      case "pending":
        return <Badge variant="outline">pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getVisiblePages = () => {
    const visible = [];
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
  
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    }
  };
  
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };
  
  const handleBulkPublish = async () => {
    await bulkUpdateMutation.mutateAsync({
      ids: Array.from(selectedIds),
      updates: { status: 'published', published_at: new Date().toISOString() }
    });
    setSelectedIds(new Set());
    toast.success('Artigos publicados');
  };
  
  const handleBulkFeature = async () => {
    await bulkUpdateMutation.mutateAsync({
      ids: Array.from(selectedIds),
      updates: { featured: true }
    });
    setSelectedIds(new Set());
    toast.success('Artigos destacados');
  };

  const handleBulkMoveToTrash = async () => {
    await moveToTrashMutation.mutateAsync({
      ids: Array.from(selectedIds),
      fromStatus: activeTab,
    });
    setSelectedIds(new Set());
    toast.success('Artigos movidos para lixeira');
  };

  const handleBulkRestore = async () => {
    await restoreMutation.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
    toast.success('Artigos restaurados');
  };

  const handleBulkDeletePermanently = async () => {
    if (!confirm('Tem certeza que deseja excluir permanentemente os artigos selecionados?')) return;
    await deletePermanentlyMutation.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
    toast.success('Artigos excluidos permanentemente');
  };

  const handleSingleMoveToTrash = async (postId: string) => {
    await moveToTrashMutation.mutateAsync({ ids: [postId], fromStatus: activeTab });
    toast.success('Artigo movido para lixeira');
  };

  const handleSingleRestore = async (postId: string) => {
    await restoreMutation.mutateAsync([postId]);
    toast.success('Artigo restaurado');
  };

  const handleSingleDeletePermanently = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este artigo?')) return;
    await deletePermanentlyMutation.mutateAsync([postId]);
    toast.success('Artigo excluido permanentemente');
  };
  
  const clearSelection = () => setSelectedIds(new Set());

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSelectedLanguage("all");
    setSortBy("newest");
    setPage(1);
    setSelectedIds(new Set());
  };

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Conteúdo
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Artigos
            </h1>
          </div>
          <Link to="/artigos/novo">
            <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700">
              <Plus className="size-4" />
              Novo Artigo
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
                setSelectedIds(new Set());
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-input"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  activeTab === tab.id
                    ? "bg-primary-foreground/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Publicados</p>
            <p className="text-3xl font-bold mt-1">{stats?.published || 0}</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Rascunhos</p>
            <p className="text-3xl font-bold mt-1">{stats?.draft || 0}</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Lixeira</p>
            <p className="text-3xl font-bold mt-1">{stats?.trash || 0}</p>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-sm text-amber-800">Filtros aplicados na listagem e contagens por estado.</p>
            <Button size="sm" variant="outline" onClick={clearFilters} className="h-8">
              Limpar filtros
            </Button>
          </div>
        )}

        {someSelected && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-sm font-medium text-amber-800">
              {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkPublish}
              disabled={bulkUpdateMutation.isPending || activeTab === 'trash'}
              className="h-8 gap-1.5"
            >
              <Check className="size-3.5" />
              Publicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkFeature}
              disabled={bulkUpdateMutation.isPending || activeTab === 'trash'}
              className="h-8 gap-1.5"
            >
              <Star className="size-3.5" />
              Destacar
            </Button>
            {activeTab !== 'trash' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMoveToTrash}
                disabled={moveToTrashMutation.isPending}
                className="h-8 gap-1.5"
              >
                <Trash2 className="size-3.5" />
                Lixeira
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkRestore}
                  disabled={restoreMutation.isPending}
                  className="h-8 gap-1.5"
                >
                  <Check className="size-3.5" />
                  Restaurar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDeletePermanently}
                  disabled={deletePermanentlyMutation.isPending}
                  className="h-8 gap-1.5 text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Excluir permanente
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="h-8"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLanguage} onValueChange={(v) => { setSelectedLanguage(v as "all" | "pt" | "en"); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Idiomas</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as "newest" | "oldest" | "title_asc" | "title_desc" | "featured"); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
              <SelectItem value="title_asc">Titulo A-Z</SelectItem>
              <SelectItem value="title_desc">Titulo Z-A</SelectItem>
              <SelectItem value="featured">Destaque primeiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {totalCount} artigos encontrados
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="w-[100px]">Autor</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Tradução</TableHead>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead className="w-[60px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : posts?.map((post) => (
                <TableRow 
                  key={post.id}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(post.id)}
                      onCheckedChange={() => toggleSelect(post.id)}
                      aria-label={`Selecionar ${post.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link to="/artigos/$id/editar" params={{ id: post.id }} className="hover:underline">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>{post.profiles?.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>{getTranslationBadge(post.translation_status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(post.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to="/artigos/$id/editar" params={{ id: post.id }}>
                            <FileEdit className="size-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        {activeTab !== 'trash' ? (
                          <DropdownMenuItem onClick={() => handleSingleMoveToTrash(post.id)}>
                            <Trash2 className="size-4 mr-2" />
                            Mover para lixeira
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleSingleRestore(post.id)}>
                              <Check className="size-4 mr-2" />
                              Restaurar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleSingleDeletePermanently(post.id)}>
                              <Trash2 className="size-4 mr-2" />
                              Excluir permanente
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && posts?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum artigo encontrado.
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
                      onClick={() => setPage(p as number)}
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
    </div>
  );
}
