import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, FileEdit, Trash2, User } from "lucide-react";
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
import { useProfiles, useProfileStats, useCreateProfile, useUpdateProfile, useDeleteProfile } from "@/hooks/use-supabase";
import type { Profile, ProfileInsert } from "@/lib/supabase";

type ProfileFormPayload = {
  name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'author' | 'customer';
  status: 'pending' | 'approved' | 'rejected';
  author_type?: string | null;
  bio?: string | null;
  birth_date?: string | null;
  residence_city?: string | null;
  province?: string | null;
  featured?: boolean;
};

export function UsuariosContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [selectedFormRole, setSelectedFormRole] = useState<string>("customer");
  
  const { data: profiles, isLoading } = useProfiles();
  const { data: stats } = useProfileStats();
  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile();
  const deleteMutation = useDeleteProfile();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/20">admin</Badge>;
      case "author":
        return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">author</Badge>;
      case "customer":
        return <Badge variant="secondary">customer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const role = formData.get('role') as 'admin' | 'author' | 'customer';
    
    const profileData: ProfileFormPayload = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || null,
      role,
      status: formData.get('status') as 'pending' | 'approved' | 'rejected',
    };

    if (role === 'author') {
      profileData.author_type = formData.get('authorType') as string || null;
      profileData.bio = formData.get('bio') as string || null;
      profileData.birth_date = formData.get('birthDate') as string || null;
      profileData.residence_city = formData.get('city') as string || null;
      profileData.province = formData.get('province') as string || null;
      profileData.featured = formData.get('featured') === 'on';
    }

    if (editingProfile) {
      await updateMutation.mutateAsync({ id: editingProfile.id, ...profileData });
    } else {
      const password = formData.get('password') as string;
      if (!password) {
        alert('Senha é obrigatória para novos usuários');
        return;
      }
      await createMutation.mutateAsync({ profile: profileData as unknown as ProfileInsert, password });
    }
    
    setIsSheetOpen(false);
    setEditingProfile(null);
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setSelectedFormRole(profile.role);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const filteredProfiles = profiles?.filter((profile) => {
    if (selectedRole !== "all" && profile.role !== selectedRole) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        profile.name.toLowerCase().includes(searchLower) ||
        (profile.email?.toLowerCase().includes(searchLower) ?? false)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
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
            onClick={() => {
              setEditingProfile(null);
              setSelectedFormRole("customer");
              setIsSheetOpen(true);
            }}
          >
            <Plus className="size-4" />
            Adicionar usuário
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Utilizadores</p>
            <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Admins</p>
            <p className="text-3xl font-bold mt-1">{stats?.admins || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Admins activos</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Autores</p>
            <p className="text-3xl font-bold mt-1">{stats?.authors || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Perfis com papel de autor</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Aprovações Pendentes</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{stats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Status de autor pendente</p>
          </div>
        </div>

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
              <SelectItem value="all">Todos os papéis</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="author">Autor</SelectItem>
              <SelectItem value="customer">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
              {filteredProfiles?.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {profile.photo_url ? (
                        <img src={profile.photo_url} alt={profile.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p>{profile.name}</p>
                        {profile.featured && profile.role === 'author' && (
                          <span className="text-xs text-amber-600">Destaque</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{profile.email || '—'}</TableCell>
                  <TableCell>{getRoleBadge(profile.role)}</TableCell>
                  <TableCell>{getStatusBadge(profile.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(profile.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(profile)}>
                          <FileEdit className="size-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(profile.id)}>
                          <Trash2 className="size-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProfiles?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        setIsSheetOpen(open);
        if (!open) setEditingProfile(null);
      }}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
            <SheetTitle>{editingProfile ? 'Editar Usuário' : 'Novo Usuário'}</SheetTitle>
            <SheetDescription>
              {selectedFormRole === 'author' ? 'Criar perfil de autor.' : 'Criar conta de usuário.'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name">Nome *</Label>
                <Input 
                  id="name" 
                  name="name"
                  placeholder="Nome completo" 
                  required
                  defaultValue={editingProfile?.name || ''}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email"
                  placeholder="email@exemplo.com" 
                  required
                  defaultValue={editingProfile?.email || ''}
                />
              </div>

              {!editingProfile && (
                <div className="space-y-3">
                  <Label htmlFor="password">Senha *</Label>
                  <Input 
                    id="password" 
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres" 
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  name="phone"
                  placeholder="+258 84 123 4567" 
                  defaultValue={editingProfile?.phone || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Papel</Label>
                  <Select 
                    name="role" 
                    defaultValue={editingProfile?.role || 'customer'}
                    onValueChange={setSelectedFormRole}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="author">Autor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Estado</Label>
                  <Select name="status" defaultValue={editingProfile?.status || 'pending'}>
                    <SelectTrigger>
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

              {selectedFormRole === 'author' && (
                <>
                  <div className="pt-4 border-t">
                    <h3 className="font-medium text-sm text-muted-foreground mb-4">Informações de Autor</h3>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="authorType">Tipo de Autor</Label>
                    <Select name="authorType" defaultValue={editingProfile?.author_type || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
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
                    <Label htmlFor="bio">Biografia</Label>
                    <Input
                      id="bio"
                      name="bio"
                      placeholder="Breve biografia"
                      defaultValue={editingProfile?.bio || ''}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input 
                      id="birthDate" 
                      name="birthDate"
                      type="date" 
                      defaultValue={editingProfile?.birth_date || ''}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="city">Cidade</Label>
                      <Input 
                        id="city" 
                        name="city"
                        placeholder="Cidade" 
                        defaultValue={editingProfile?.residence_city || ''}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="province">Província</Label>
                      <Input 
                        id="province" 
                        name="province"
                        placeholder="Província" 
                        defaultValue={editingProfile?.province || ''}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="featured" 
                      name="featured"
                      defaultChecked={editingProfile?.featured || false}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                      Autor em destaque
                    </Label>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-background shrink-0">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsSheetOpen(false);
                    setEditingProfile(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingProfile ? 'Guardar' : 'Criar Usuário'}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
