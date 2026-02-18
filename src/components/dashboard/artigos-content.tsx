import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, Trash2, FileEdit } from "lucide-react";
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
import { usePosts, usePostStats, usePostCategories } from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";

type TabStatus = "all" | "published" | "draft" | "trash";

const PAGE_SIZE = 10;

export function ArtigosContent() {
  const [activeTab, setActiveTab] = useState<TabStatus>("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);

  const { data: postsData, isLoading } = usePosts(activeTab, page, PAGE_SIZE, debouncedSearch);
  const { data: stats } = usePostStats();
  const { data: categories } = usePostCategories();

  const posts = postsData?.data || [];
  const totalPages = postsData?.totalPages || 1;
  const totalCount = postsData?.totalCount || 0;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const tabs = [
    { id: "published" as TabStatus, label: "Publicados", count: stats?.published || 0 },
    { id: "draft" as TabStatus, label: "Rascunhos", count: stats?.draft || 0 },
    { id: "trash" as TabStatus, label: "Lixeira", count: stats?.trash || 0 },
  ];

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
          <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700">
            <Plus className="size-4" />
            Novo Artigo
          </Button>
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
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
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
        </div>

        <div className="text-sm text-muted-foreground">
          {totalCount} artigos encontrados
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px]">
                  <Checkbox />
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
                <TableRow key={post.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{(post.profiles as any)?.name || '-'}</TableCell>
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
                        <DropdownMenuItem>
                          <FileEdit className="size-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="size-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
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
