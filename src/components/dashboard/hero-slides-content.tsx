import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, MoreHorizontal, ArrowUpDown, Upload } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { heroSlides } from "@/mock-data/hero-slides";
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

export function HeroSlidesContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
              Slides do Hero
            </h1>
          </div>
          <Button 
            size="sm" 
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={() => setIsSheetOpen(true)}
          >
            <Plus className="size-4" />
            Novo Slide
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Thumbnail</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo de Conteúdo</TableHead>
                <TableHead>Conteúdo Vinculado</TableHead>
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
              {heroSlides.map((slide) => (
                <TableRow key={slide.id}>
                  <TableCell>
                    <img
                      src={slide.thumbnail}
                      alt={slide.title}
                      className="w-16 h-10 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{slide.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {slide.contentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                    {slide.linkedContent}
                  </TableCell>
                  <TableCell className="text-center">{slide.order}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {slide.isActive ? (
                        <Eye className="size-4 text-emerald-500" />
                      ) : (
                        <EyeOff className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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

      {/* New Hero Slide Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header - Fixed */}
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>Novo Hero Slide</SheetTitle>
            <SheetDescription>
              Crie e gerencie slides do hero para o carrossel da homepage.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form className="space-y-6">
              {/* Background Image */}
              <div className="space-y-3">
                <Label>Imagem de Fundo</Label>
                <div className="border-2 border-dashed rounded-lg p-6 bg-muted/50">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Button type="button" variant="outline" className="gap-2">
                      <Upload className="size-4" />
                      Escolher arquivo
                    </Button>
                    <p className="text-sm text-muted-foreground">Nenhum arquivo escolhido</p>
                    <p className="text-xs text-muted-foreground">JPG/PNG, até 50MB</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Faça upload de uma imagem landscape otimizada para exibição no hero (recomendado: 1920x1080)
                </p>
              </div>

              {/* Title */}
              <div className="space-y-3">
                <Label htmlFor="title">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Digite o título do slide"
                  required
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-3">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  placeholder="Digite o subtítulo (opcional)"
                />
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Breve descrição do slide"
                  rows={3}
                />
              </div>

              {/* CTA Text */}
              <div className="space-y-3">
                <Label htmlFor="ctaText">Texto do Botão</Label>
                <Input
                  id="ctaText"
                  placeholder="ex: Explorar, Ver Mais, Saber Mais"
                />
              </div>

              {/* CTA URL */}
              <div className="space-y-3">
                <Label htmlFor="ctaUrl">URL do Botão</Label>
                <Input
                  id="ctaUrl"
                  placeholder="/livros, /autores, https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Digite um caminho relativo (/livros) ou URL absoluta (https://exemplo.com)
                </p>
              </div>

              {/* Content Type */}
              <div className="space-y-3">
                <Label htmlFor="contentType">Tipo de Conteúdo</Label>
                <Select defaultValue="custom">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de conteúdo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Personalizado (slide standalone)</SelectItem>
                    <SelectItem value="article">Artigo</SelectItem>
                    <SelectItem value="book">Livro</SelectItem>
                    <SelectItem value="author">Autor</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione o que este slide deve destacar. Escolha "Personalizado" para slides standalone.
                </p>
              </div>

              {/* Order and Status Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Order Weight */}
                <div className="space-y-3">
                  <Label htmlFor="order">Peso da Ordem</Label>
                  <Input
                    id="order"
                    type="number"
                    defaultValue="0"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Números menores aparecem primeiro
                  </p>
                </div>

                {/* Status */}
                <div className="space-y-3">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="isActive" defaultChecked />
                    <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                      Ativo (visível na homepage)
                    </Label>
                  </div>
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
                Criar Slide
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
