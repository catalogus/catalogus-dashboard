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
import { articles, articleStats, categories, languages, sortOptions } from "@/mock-data/artigos";
import { cn } from "@/lib/utils";

type TabStatus = "all" | "published" | "drafts" | "trash";

export function ArtigosContent() {
  const [activeTab, setActiveTab] = useState<TabStatus>("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("published");
  const [selectedLanguage, setSelectedLanguage] = useState("Português");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");

  const filteredArticles = articles.filter((article) => {
    if (activeTab !== "all" && article.status !== activeTab) return false;
    if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== "all" && !article.categories.includes(selectedCategory)) return false;
    return true;
  });

  const tabs = [
    { id: "published" as TabStatus, label: "Publicados", count: articleStats.published },
    { id: "drafts" as TabStatus, label: "Rascunhos", count: articleStats.drafts },
    { id: "trash" as TabStatus, label: "Lixeira", count: articleStats.trash },
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
        return null;
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
        return null;
    }
  };

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        {/* Header */}
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

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Publicados</p>
            <p className="text-3xl font-bold mt-1">{articleStats.published}</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Rascunhos</p>
            <p className="text-3xl font-bold mt-1">{articleStats.drafts}</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Lixeira</p>
            <p className="text-3xl font-bold mt-1">{articleStats.trash}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.filter(c => c !== "Todos").map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="w-[100px]">Autor</TableHead>
                <TableHead className="w-[150px]">Categorias</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Tradução</TableHead>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead className="w-[60px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.author}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {article.categories.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(article.status)}</TableCell>
                  <TableCell>{getTranslationBadge(article.translationStatus)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {article.date}
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
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
