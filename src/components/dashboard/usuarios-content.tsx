import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, FileEdit, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { usuarios, usuariosStats, userRoles, userStatuses } from "@/mock-data/usuarios";

export function UsuariosContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/20">admin</Badge>;
      case "author":
        return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">author</Badge>;
      case "user":
        return <Badge variant="secondary">user</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <span className="text-muted-foreground">—</span>;
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">approved</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">rejected</Badge>;
      default:
        return null;
    }
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    if (selectedRole !== "all" && usuario.role !== selectedRole) return false;
    if (selectedStatus !== "all" && usuario.status !== selectedStatus) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        usuario.name.toLowerCase().includes(searchLower) ||
        usuario.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
              Usuários
            </h1>
          </div>
          <Button 
            size="sm" 
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={() => setIsSheetOpen(true)}
          >
            <Plus className="size-4" />
            Adicionar usuário
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Utilizadores</p>
            <p className="text-3xl font-bold mt-1">{usuariosStats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Admins</p>
            <p className="text-3xl font-bold mt-1">{usuariosStats.admins}</p>
            <p className="text-xs text-muted-foreground mt-1">Admins activos</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Autores</p>
            <p className="text-3xl font-bold mt-1">{usuariosStats.authors}</p>
            <p className="text-xs text-muted-foreground mt-1">Perfis com papel de autor</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Aprovações Pendentes</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{usuariosStats.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Status de autor pendente</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os papéis" />
            </SelectTrigger>
            <SelectContent>
              {userRoles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent>
              {userStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
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
                <TableHead>Nome</TableHead>
                <TableHead className="w-[250px]">Email</TableHead>
                <TableHead className="w-[100px]">Papel</TableHead>
                <TableHead className="w-[100px]">Estado</TableHead>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead className="w-[80px]">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.name}</TableCell>
                  <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell>{getRoleBadge(usuario.role)}</TableCell>
                  <TableCell>{getStatusBadge(usuario.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{usuario.date}</TableCell>
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

      {/* Novo Usuário Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header - Fixed */}
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>Novo Usuário</SheetTitle>
            <SheetDescription>
              Crie uma conta de admin, autor ou cliente.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form className="space-y-6">
              {/* Name */}
              <div className="space-y-3">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Nome completo" />
              </div>

              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="nome@exemplo.com" />
              </div>

              {/* Password */}
              <div className="space-y-3">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="Pelo menos 8 caracteres" />
              </div>

              {/* Role and Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Papel</Label>
                  <Select defaultValue="author">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="author">Autor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">Utilizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Estado</Label>
                  <Select defaultValue="pending">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
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
                Criar Usuário
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
