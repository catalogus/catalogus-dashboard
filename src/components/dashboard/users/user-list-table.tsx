import { MoreHorizontal, FileEdit, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Profile } from "@/lib/supabase"
import { formatProfileDate, getRoleBadge, getStatusBadge } from "./user-types"

type UserListTableProps = {
  profiles: Profile[]
  superAdminCount: number
  onEdit: (profile: Profile) => void
  onDelete: (profile: Profile) => void
  onMakeAdmin: (profile: Profile, adminLevel: "super_admin" | "content_admin") => void
  onRemoveAdmin: (profile: Profile) => void
}

export function UserListTable({
  profiles,
  superAdminCount,
  onEdit,
  onDelete,
  onMakeAdmin,
  onRemoveAdmin,
}: UserListTableProps) {
  return (
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
          {profiles.map((profile) => (
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
                    {profile.featured && profile.role === "author" && <span className="text-xs text-amber-600">Destaque</span>}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{profile.email || "—"}</TableCell>
              <TableCell>{getRoleBadge(profile.role, profile.admin_level)}</TableCell>
              <TableCell>{getStatusBadge(profile.status, profile.must_set_password)}</TableCell>
              <TableCell className="text-muted-foreground">{formatProfileDate(profile.created_at)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(profile)}>
                      <FileEdit className="size-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {profile.role === "admin" ? (
                      <>
                        <DropdownMenuItem onClick={() => onMakeAdmin(profile, "content_admin")}>Definir Content Admin</DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={superAdminCount >= 2 && profile.admin_level !== "super_admin"}
                          onClick={() => onMakeAdmin(profile, "super_admin")}
                        >
                          Definir Super Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRemoveAdmin(profile)}>Remover acesso admin</DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => onMakeAdmin(profile, "content_admin")}>Tornar Content Admin</DropdownMenuItem>
                        <DropdownMenuItem disabled={superAdminCount >= 2} onClick={() => onMakeAdmin(profile, "super_admin")}>
                          Tornar Super Admin
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(profile)}>
                      <Trash2 className="size-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {profiles.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
