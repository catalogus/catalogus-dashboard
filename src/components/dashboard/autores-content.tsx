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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { autores, autoresStats } from "@/mock-data/autores";

export function AutoresContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Comunidade
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Autores ({autoresStats.total})
            </h1>
          </div>
          <Button 
            size="sm" 
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={() => setIsSheetOpen(true)}
          >
            <Plus className="size-4" />
            Adicionar autor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Autores</p>
            <p className="text-3xl font-bold mt-1">{autoresStats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
            <p className="text-3xl font-bold mt-1">{autoresStats.featured}</p>
            <p className="text-xs text-muted-foreground mt-1">Perfis destacados</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Perfis Vinculados</p>
            <p className="text-3xl font-bold mt-1">{autoresStats.linkedProfiles}</p>
            <p className="text-xs text-muted-foreground mt-1">Conectados a utilizadores</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Reivindicações Pendentes</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{autoresStats.pendingClaims}</p>
            <p className="text-xs text-muted-foreground mt-1">Aguardando revisão</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Autor</TableHead>
                <TableHead className="w-[150px]">Telefone</TableHead>
                <TableHead className="w-[150px]">Tipo de Autor</TableHead>
                <TableHead className="w-[150px]">Perfil Vinculado</TableHead>
                <TableHead className="w-[200px]">WordPress</TableHead>
                <TableHead className="w-[100px]">Destaque</TableHead>
                <TableHead className="w-[80px]">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {autores.map((autor) => (
                <TableRow key={autor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={autor.photo} alt={autor.name} />
                        <AvatarFallback>{autor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{autor.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {autor.phone || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {autor.authorType || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {autor.linkedProfile ? (
                      <span className="text-emerald-600">{autor.linkedProfile}</span>
                    ) : (
                      <span className="text-muted-foreground">Not linked</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {autor.wordpressSlug}
                  </TableCell>
                  <TableCell>
                    {autor.featured ? (
                      <span className="text-emerald-600 font-medium">Sim</span>
                    ) : (
                      <span className="text-muted-foreground">Não</span>
                    )}
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

      {/* Add Author Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header - Fixed */}
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>Adicionar Autor</SheetTitle>
            <SheetDescription>
              Crie um perfil de autor com informações detalhadas.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form className="space-y-6">
              {/* Name */}
              <div className="space-y-3">
                <Label htmlFor="name">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input id="name" placeholder="Nome do autor" required />
              </div>

              {/* Author Type and Phone Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="authorType">
                    Tipo de Autor <span className="text-destructive">*</span>
                  </Label>
                  <Select required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="writer">Escritor</SelectItem>
                      <SelectItem value="poet">Poeta</SelectItem>
                      <SelectItem value="researcher">Investigador</SelectItem>
                      <SelectItem value="journalist">Jornalista</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="+258 84 123 4567" />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-3">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  placeholder="Biografia do autor (máx 500 caracteres)"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">0/500 caracteres</p>
              </div>

              {/* Profile Photo */}
              <div className="space-y-3">
                <Label>Foto de Perfil</Label>
                <div className="border rounded-lg p-3 bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm">
                      Browse...
                    </Button>
                    <span className="text-sm text-muted-foreground">No file selected.</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Max 50MB. Formatos suportados: JPG, PNG, WEBP, GIF
                </p>
              </div>

              {/* Birth Date */}
              <div className="space-y-3">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" type="date" placeholder="dd/mm/aaaa" />
              </div>

              {/* Residence City and Province Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="city">Cidade de Residência</Label>
                  <Input id="city" placeholder="Nome da cidade" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="province">Província</Label>
                  <Input id="province" placeholder="Nome da província" />
                </div>
              </div>

              {/* Featured Video URL */}
              <div className="space-y-3">
                <Label htmlFor="videoUrl">URL do Vídeo em Destaque</Label>
                <Input id="videoUrl" placeholder="https://youtube.com/watch?v=..." />
                <p className="text-xs text-muted-foreground">URL do vídeo YouTube ou Vimeo</p>
              </div>

              {/* Social Links Section */}
              <div className="space-y-4 pt-2 border-t">
                <h3 className="font-medium text-sm">Links Sociais</h3>
                
                <div className="space-y-3">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" placeholder="https://exemplo.com" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input id="linkedin" placeholder="https://linkedin.com/in/username" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input id="facebook" placeholder="https://facebook.com/username" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" placeholder="https://instagram.com/username" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input id="twitter" placeholder="https://twitter.com/username" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input id="youtube" placeholder="https://youtube.com/@username" />
                </div>
              </div>

              {/* Published Works Section */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Obras Publicadas (Published Works)</h3>
                  <Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="size-4 mr-1" />
                    Add Work
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma obra publicada adicionada ainda</p>
              </div>

              {/* Author Gallery Section */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Galeria do Autor (Author Gallery)</h3>
                  <Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="size-4 mr-1" />
                    Add Image
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Adicione URLs de imagens para a galeria do autor</p>
                <p className="text-sm text-muted-foreground">Nenhuma imagem de galeria adicionada ainda</p>
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
                Criar Autor
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
