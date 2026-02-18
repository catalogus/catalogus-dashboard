import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, FileEdit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { livros, livrosStats } from "@/mock-data/livros";

export function LivrosContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Catálogo
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Livros
            </h1>
          </div>
          <Button 
            size="sm" 
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={() => setIsSheetOpen(true)}
          >
            <Plus className="size-4" />
            Adicionar livro
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Livros</p>
            <p className="text-3xl font-bold mt-1">{livrosStats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Activo</p>
            <p className="text-3xl font-bold mt-1">{livrosStats.active}</p>
            <p className="text-xs text-muted-foreground mt-1">Disponível na loja</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
            <p className="text-3xl font-bold mt-1">{livrosStats.featured}</p>
            <p className="text-xs text-muted-foreground mt-1">Destaques homepage</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Digital</p>
            <p className="text-3xl font-bold mt-1">{livrosStats.digital}</p>
            <p className="text-xs text-muted-foreground mt-1">Catálogo digital</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Stock Baixo</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{livrosStats.lowStock}</p>
            <p className="text-xs text-muted-foreground mt-1">Físico &lt;= 5</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Título</TableHead>
                <TableHead className="w-[150px]">Autores</TableHead>
                <TableHead className="w-[120px]">Categoria</TableHead>
                <TableHead className="w-[80px]">Idioma</TableHead>
                <TableHead className="w-[100px]">Preço</TableHead>
                <TableHead className="w-[80px]">Stock</TableHead>
                <TableHead className="w-[80px]">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {livros.map((livro) => (
                <TableRow key={livro.id}>
                  <TableCell className="font-medium">{livro.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {livro.authors.length > 0 ? livro.authors.join(", ") : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {livro.category || "—"}
                  </TableCell>
                  <TableCell>{livro.language}</TableCell>
                  <TableCell>{livro.price} MTn</TableCell>
                  <TableCell>{livro.stock}</TableCell>
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

      {/* Add Book Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header - Fixed */}
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>Adicionar livro</SheetTitle>
            <SheetDescription>
              Gerencie título, slug, preço, stock e visibilidade.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form className="space-y-6">
              {/* Title */}
              <div className="space-y-3">
                <Label htmlFor="title">Título</Label>
                <Input id="title" placeholder="Digite o título do livro" />
              </div>

              {/* Authors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Autores</Label>
                  <Button type="button" variant="link" size="sm" className="h-auto p-0">
                    Selecionar autores
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecione do catálogo ou adicione um novo autor.
                </p>
                <p className="text-xs text-muted-foreground">
                  Nenhum autor selecionado ainda.
                </p>
                <div className="flex gap-2">
                  <Input placeholder="Nome do novo autor" className="flex-1" />
                  <Button type="button" className="bg-amber-600 hover:bg-amber-700">
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-3">
                <Label>Imagem da capa</Label>
                <div className="border-2 border-dashed rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline">
                      Escolher arquivo
                    </Button>
                    <div>
                      <p className="text-sm text-muted-foreground">Nenhum arquivo selecionado</p>
                      <p className="text-xs text-muted-foreground">JPG/PNG, até 50MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Digite a descrição do livro"
                  rows={4}
                />
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="price">Preço (MZN)</Label>
                  <Input
                    id="price"
                    type="number"
                    defaultValue="0"
                    min="0"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    defaultValue="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Promo Type and Promo Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Tipo de promoção</Label>
                  <Select defaultValue="no-promo">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-promo">Sem promoção</SelectItem>
                      <SelectItem value="percentage">Percentual</SelectItem>
                      <SelectItem value="fixed">Valor fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="promoPrice">Preço promocional (MZN)</Label>
                  <Input
                    id="promoPrice"
                    type="number"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Promo Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="promoStart">Data início promo</Label>
                  <Input
                    id="promoStart"
                    type="date"
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="promoEnd">Data fim promo</Label>
                  <Input
                    id="promoEnd"
                    type="date"
                    placeholder="dd/mm/aaaa"
                  />
                </div>
              </div>

              {/* Digital Book Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox id="digital" />
                <Label htmlFor="digital" className="text-sm font-normal cursor-pointer">
                  Livro digital
                </Label>
              </div>

              {/* ISBN and Publisher */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input id="isbn" placeholder="ISBN" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="publisher">Editora</Label>
                  <Input id="publisher" placeholder="Editora" />
                </div>
              </div>

              {/* Category and Language */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="category">Categoria</Label>
                  <Input id="category" placeholder="Categoria" />
                </div>
                <div className="space-y-3">
                  <Label>Idioma</Label>
                  <Select defaultValue="pt">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Featured and Active Checkboxes */}
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="featured" />
                  <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                    Destaque
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="active" defaultChecked />
                  <Label htmlFor="active" className="text-sm font-normal cursor-pointer">
                    Activo
                  </Label>
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
                Guardar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
