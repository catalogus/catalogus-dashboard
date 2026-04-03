import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateProfile, useDeleteProfile, useInviteStaffUser, useProfileStats, useProfiles, useUpdateProfile } from "@/hooks/supabase/profiles"
import type { Profile, ProfileInsert } from "@/lib/supabase"
import { toast } from "sonner"
import { StaffInviteCard } from "./users/staff-invite-card"
import { UserDeleteDialog } from "./users/user-delete-dialog"
import { UserFormSheet } from "./users/user-form-sheet"
import { UserListTable } from "./users/user-list-table"
import { UserStatsCards } from "./users/user-stats-cards"
import type { ProfileFormPayload, ProfileStats } from "./users/user-types"

type UserFormSubmitPayload = {
  profile: ProfileFormPayload
  password: string
}

export function UsuariosContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [pendingDeleteProfile, setPendingDeleteProfile] = useState<Profile | null>(null)
  const [selectedFormRole, setSelectedFormRole] = useState<string>("customer")
  const [selectedAdminLevel, setSelectedAdminLevel] = useState<"super_admin" | "content_admin">("content_admin")
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteAdminLevel, setInviteAdminLevel] = useState<"super_admin" | "content_admin">("content_admin")

  const { data: profiles, isLoading } = useProfiles()
  const { data: stats } = useProfileStats() as { data: ProfileStats | undefined }
  const createMutation = useCreateProfile()
  const inviteMutation = useInviteStaffUser()
  const updateMutation = useUpdateProfile()
  const deleteMutation = useDeleteProfile()

  const superAdminCount = useMemo(
    () => (profiles ?? []).filter((profile) => profile.role === "admin" && profile.admin_level === "super_admin").length,
    [profiles],
  )

  const filteredProfiles = useMemo(() => {
    return (profiles ?? []).filter((profile) => {
      if (selectedRole !== "all" && profile.role !== selectedRole) return false
      if (!searchQuery) return true
      const searchLower = searchQuery.toLowerCase()
      return profile.name.toLowerCase().includes(searchLower) || (profile.email?.toLowerCase().includes(searchLower) ?? false)
    })
  }, [profiles, searchQuery, selectedRole])

  const resetSheetState = () => {
    setIsSheetOpen(false)
    setEditingProfile(null)
  }

  const handleCreate = () => {
    setEditingProfile(null)
    setSelectedFormRole("customer")
    setSelectedAdminLevel("content_admin")
    setIsSheetOpen(true)
  }

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile)
    setSelectedFormRole(profile.role)
    setSelectedAdminLevel(profile.admin_level ?? "content_admin")
    setIsSheetOpen(true)
  }

  const handleSubmit = async ({ profile, password }: UserFormSubmitPayload) => {
    if (editingProfile) {
      await updateMutation.mutateAsync({ id: editingProfile.id, ...profile })
      resetSheetState()
      return
    }

    if (profile.role === "admin") {
      const invitePromise = inviteMutation.mutateAsync({
        name: profile.name,
        email: profile.email,
        adminLevel: profile.admin_level ?? "content_admin",
      })

      toast.promise(invitePromise, {
        loading: "A enviar convite de admin...",
        success: "Convite enviado com sucesso",
        error: "Falha ao enviar convite",
      })

      await invitePromise
      resetSheetState()
      return
    }

    await createMutation.mutateAsync({ profile: profile as unknown as ProfileInsert, password })
    resetSheetState()
  }

  const handleInviteQuick = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const promise = inviteMutation.mutateAsync({
      name: inviteName,
      email: inviteEmail,
      adminLevel: inviteAdminLevel,
    })

    toast.promise(promise, {
      loading: "A enviar convite de staff...",
      success: "Convite enviado. O utilizador terá de definir uma senha antes do primeiro acesso.",
      error: "Falha ao enviar convite",
    })

    await promise
    setInviteName("")
    setInviteEmail("")
    setInviteAdminLevel("content_admin")
  }

  const handleMakeAdmin = async (profile: Profile, adminLevel: "super_admin" | "content_admin") => {
    const promise = updateMutation.mutateAsync({ id: profile.id, role: "admin", admin_level: adminLevel })
    toast.promise(promise, {
      loading: "A actualizar nivel de admin...",
      success: "Nivel de admin actualizado",
      error: "Falha ao actualizar nivel de admin",
    })
    await promise
  }

  const handleRemoveAdmin = async (profile: Profile) => {
    const promise = updateMutation.mutateAsync({ id: profile.id, role: "customer", admin_level: null })
    toast.promise(promise, {
      loading: "A remover acesso admin...",
      success: "Acesso admin removido",
      error: "Falha ao remover acesso admin",
    })
    await promise
  }

  const handleDelete = async (profile: Profile) => {
    const promise = deleteMutation.mutateAsync(profile.id)
    toast.promise(promise, {
      loading: "A excluir usuário...",
      success: "Usuário excluido com sucesso",
      error: "Falha ao excluir usuário",
    })
    await promise
    setPendingDeleteProfile(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando usuários...</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Comunidade</p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Usuários</h1>
          </div>
          <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700" onClick={handleCreate}>
            <Plus className="size-4" />
            Adicionar usuário
          </Button>
        </div>

        <UserStatsCards
          total={stats?.total || 0}
          admins={stats?.admins || 0}
          authors={stats?.authors || 0}
          pending={stats?.pending || 0}
          pendingSetup={stats?.pendingSetup || 0}
        />

        <StaffInviteCard
          inviteName={inviteName}
          inviteEmail={inviteEmail}
          inviteAdminLevel={inviteAdminLevel}
          superAdminCount={superAdminCount}
          submitting={inviteMutation.isPending}
          onInviteNameChange={setInviteName}
          onInviteEmailChange={setInviteEmail}
          onInviteAdminLevelChange={setInviteAdminLevel}
          onSubmit={handleInviteQuick}
        />

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Buscar usuários..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
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

        <UserListTable
          profiles={filteredProfiles}
          superAdminCount={superAdminCount}
          onEdit={handleEdit}
          onDelete={setPendingDeleteProfile}
          onMakeAdmin={handleMakeAdmin}
          onRemoveAdmin={handleRemoveAdmin}
        />
      </div>

      <UserFormSheet
        open={isSheetOpen}
        editingProfile={editingProfile}
        selectedFormRole={selectedFormRole}
        selectedAdminLevel={selectedAdminLevel}
        superAdminCount={superAdminCount}
        submitting={createMutation.isPending || updateMutation.isPending || inviteMutation.isPending}
        onOpenChange={(open) => (open ? setIsSheetOpen(true) : resetSheetState())}
        onSelectedFormRoleChange={setSelectedFormRole}
        onSelectedAdminLevelChange={setSelectedAdminLevel}
        onSubmit={handleSubmit}
      />

      <UserDeleteDialog
        profile={pendingDeleteProfile}
        open={!!pendingDeleteProfile}
        deleting={deleteMutation.isPending}
        onOpenChange={(open) => !open && setPendingDeleteProfile(null)}
        onConfirm={(profile) => void handleDelete(profile)}
      />
    </div>
  )
}
