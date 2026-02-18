import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, FileEdit, Trash2, Cloud } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mapasLiterarios, mapasStats } from "@/mock-data/mapas-literarios";

export function MapasLiterariosContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">Activo</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactivo</Badge>;
      case "featured":
        return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">Destacado</Badge>;
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
              Biblioteca Digital
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Mapas Literários
            </h1>
          </div>
          <Button 
            size="sm" 
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={() => setIsSheetOpen(true)}
          >
            <Plus className="size-4" />
            Adicionar publicação
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total</p>
            <p className="text-3xl font-bold mt-1">{mapasStats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Activo</p>
            <p className="text-3xl font-bold mt-1">{mapasStats.active}</p>
            <p className="text-xs text-muted-foreground mt-1">Visível para leitores</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
            <p className="text-3xl font-bold mt-1">{mapasStats.featured}</p>
            <p className="text-xs text-muted-foreground mt-1">Destacado</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Processado</p>
            <p className="text-3xl font-bold mt-1">{mapasStats.processed}</p>
            <p className="text-xs text-muted-foreground mt-1">Contagem de páginas &gt; 0</p>
          </div>
        </div>

        {/* Table */}
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
              {mapasLiterarios.map((mapa) => (
                <TableRow key={mapa.id}>
                  <TableCell>
                    <img
                      src={mapa.cover}
                      alt={mapa.title}
                      className="w-14 h-20 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{mapa.title}</span>
                      <span className="text-xs text-muted-foreground">{mapa.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{mapa.pages}</TableCell>
                  <TableCell className="text-muted-foreground">{mapa.date}</TableCell>
                  <TableCell>{getStatusBadge(mapa.status)}</TableCell>
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

      {/* Nova publicação Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header - Fixed */}
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>Nova publicação</SheetTitle>
            <SheetDescription>
              Carregue um PDF e configure as opções de visualização.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form className="space-y-6">
              {/* PDF File Upload */}
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

              {/* Title and Slug Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="title">
                    Título <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Nome da publicação"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="slug">
                    Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    placeholder="url-amigavel"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Breve descrição da publicação"
                  rows={3}
                />
              </div>

              {/* Display Settings Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                  <Label>Modo de exibição</Label>
                  <Select defaultValue="double">
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
                    type="number"
                    defaultValue="400"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="height">Altura (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    defaultValue="600"
                  />
                </div>
              </div>

              {/* Publication Date and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="publishDate">Data de publicação</Label>
                  <div className="relative">
                    <Input
                      id="publishDate"
                      type="date"
                      defaultValue="2026-02-17"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Estado</Label>
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="active" defaultChecked />
                      <Label htmlFor="active" className="text-sm font-normal cursor-pointer">
                        Activo
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="featured" />
                      <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                        Destaque
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Index Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Índice (opcional)</Label>
                  <Button type="button" variant="outline" size="sm">
                    Adicionar item
                  </Button>
                </div>
              </div>

              {/* Spacer for footer */}
              <div className="h-4" />
            </form>
          </div>

          {/* Footer - Sticky */}
          <div className="px-6 py-4 border-t bg-background shrink-0">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsSheetOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Criar publicação
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
