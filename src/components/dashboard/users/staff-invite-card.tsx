import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type StaffInviteCardProps = {
  inviteName: string
  inviteEmail: string
  inviteAdminLevel: "super_admin" | "content_admin"
  superAdminCount: number
  submitting: boolean
  onInviteNameChange: (value: string) => void
  onInviteEmailChange: (value: string) => void
  onInviteAdminLevelChange: (value: "super_admin" | "content_admin") => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function StaffInviteCard({
  inviteName,
  inviteEmail,
  inviteAdminLevel,
  superAdminCount,
  submitting,
  onInviteNameChange,
  onInviteEmailChange,
  onInviteAdminLevelChange,
  onSubmit,
}: StaffInviteCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Convidar staff admin</h2>
          <p className="text-xs text-muted-foreground">
            Criação por convite por email. O utilizador terá de definir a senha antes do primeiro acesso ao painel.
          </p>
        </div>
        <Badge variant="outline">Super Admin: {superAdminCount}/2</Badge>
      </div>
      <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={onSubmit}>
        <Input placeholder="Nome completo" value={inviteName} onChange={(e) => onInviteNameChange(e.target.value)} required />
        <Input type="email" placeholder="admin@catalogus.co.mz" value={inviteEmail} onChange={(e) => onInviteEmailChange(e.target.value)} required />
        <Select value={inviteAdminLevel} onValueChange={(value) => onInviteAdminLevelChange(value as "super_admin" | "content_admin")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="content_admin">Content Admin</SelectItem>
            <SelectItem value="super_admin" disabled={superAdminCount >= 2}>Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={submitting}>
          {submitting ? "A enviar..." : "Enviar convite"}
        </Button>
      </form>
    </div>
  )
}
