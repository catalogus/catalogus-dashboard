import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getAuthorNoun, getFeaturedAuthorLabel, getGenderedAuthorType, normalizeAuthorGender, type AuthorGender } from "@/components/dashboard/authors/author-type"
import type { Profile } from "@/lib/supabase"
import { toast } from "sonner"
import type { ProfileFormPayload } from "./user-types"

type UserFormSubmitPayload = {
  profile: ProfileFormPayload
  password: string
}

type UserFormSheetProps = {
  open: boolean
  editingProfile: Profile | null
  selectedFormRole: string
  selectedAdminLevel: "super_admin" | "content_admin"
  superAdminCount: number
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSelectedFormRoleChange: (value: string) => void
  onSelectedAdminLevelChange: (value: "super_admin" | "content_admin") => void
  onSubmit: (payload: UserFormSubmitPayload) => Promise<void>
}

export function UserFormSheet({
  open,
  editingProfile,
  selectedFormRole,
  selectedAdminLevel,
  superAdminCount,
  submitting,
  onOpenChange,
  onSelectedFormRoleChange,
  onSelectedAdminLevelChange,
  onSubmit,
}: UserFormSheetProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending")
  const [gender, setGender] = useState<AuthorGender | "">("")
  const [authorType, setAuthorType] = useState("")
  const [bio, setBio] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [featured, setFeatured] = useState(false)

  useEffect(() => {
    if (!open) return

    setName(editingProfile?.name || "")
    setEmail(editingProfile?.email || "")
    setPassword("")
    setPhone(editingProfile?.phone || "")
    onSelectedFormRoleChange(editingProfile?.role || "customer")
    setStatus((editingProfile?.status as "pending" | "approved" | "rejected") || "pending")
    setGender(normalizeAuthorGender(editingProfile?.gender) || "")
    setAuthorType(editingProfile?.author_type || "")
    setBio(editingProfile?.bio || "")
    setBirthDate(editingProfile?.birth_date || "")
    setCity(editingProfile?.residence_city || "")
    setProvince(editingProfile?.province || "")
    setFeatured(editingProfile?.featured || false)
    onSelectedAdminLevelChange(editingProfile?.admin_level ?? "content_admin")
  }, [editingProfile, open, onSelectedAdminLevelChange, onSelectedFormRoleChange])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingProfile && selectedFormRole !== "admin" && !password) {
      toast.error("Senha é obrigatória para novos usuários")
      return
    }

    if (selectedFormRole === "author" && !normalizeAuthorGender(gender)) {
      toast.error("Seleccione o género do autor")
      return
    }

    await onSubmit({
      profile: {
        name,
        email,
        phone: phone || null,
        role: selectedFormRole as "admin" | "author" | "customer",
        status,
        admin_level: selectedFormRole === "admin" ? selectedAdminLevel : null,
        gender: selectedFormRole === "author" ? normalizeAuthorGender(gender) : null,
        author_type: selectedFormRole === "author" ? authorType || null : null,
        bio: selectedFormRole === "author" ? bio || null : null,
        birth_date: selectedFormRole === "author" ? birthDate || null : null,
        residence_city: selectedFormRole === "author" ? city || null : null,
        province: selectedFormRole === "author" ? province || null : null,
        featured: selectedFormRole === "author" ? featured : false,
      },
      password,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="space-y-2.5 px-6 py-4 border-b shrink-0">
          <SheetTitle>{editingProfile ? "Editar Usuário" : "Novo Usuário"}</SheetTitle>
          <SheetDescription>{selectedFormRole === "author" ? `Criar perfil de ${getAuthorNoun(gender).toLowerCase()}.` : "Criar conta de usuário."}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" placeholder="Nome completo" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="email@exemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {!editingProfile && selectedFormRole !== "admin" && (
              <div className="space-y-3">
                <Label htmlFor="password">Senha *</Label>
                <PasswordInput id="password" placeholder="Mínimo 6 caracteres" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="+258 84 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Papel</Label>
                <Select value={selectedFormRole} onValueChange={onSelectedFormRoleChange}>
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
                <Select value={status} onValueChange={(value) => setStatus(value as "pending" | "approved" | "rejected")}>
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

            {selectedFormRole === "admin" && (
              <div className="space-y-3">
                <Label>Nivel de Admin</Label>
                <Select value={selectedAdminLevel} onValueChange={(value) => onSelectedAdminLevelChange(value as "super_admin" | "content_admin")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content_admin">Content Admin</SelectItem>
                    <SelectItem value="super_admin" disabled={superAdminCount >= 2 && selectedAdminLevel !== "super_admin"}>Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                {!editingProfile && <p className="text-xs text-muted-foreground">Contas admin novas sao criadas por convite no email.</p>}
              </div>
            )}

            {selectedFormRole === "author" && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="font-medium text-sm text-muted-foreground mb-4">{`Informações de ${getAuthorNoun(gender)}`}</h3>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="gender">Género</Label>
                  <Select value={gender} onValueChange={(value) => setGender(value as AuthorGender)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="authorType">{`Tipo de ${getAuthorNoun(gender)}`}</Label>
                  <Select value={authorType || "__empty"} onValueChange={(value) => setAuthorType(value === "__empty" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty">Sem tipo</SelectItem>
                      <SelectItem value="writer">{getGenderedAuthorType("Escritor", gender)}</SelectItem>
                      <SelectItem value="poet">Poeta</SelectItem>
                      <SelectItem value="researcher">{getGenderedAuthorType("Investigador", gender)}</SelectItem>
                      <SelectItem value="journalist">Jornalista</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="bio">Biografia</Label>
                  <Input id="bio" placeholder="Breve biografia" value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="province">Província</Label>
                    <Input id="province" placeholder="Província" value={province} onChange={(e) => setProvince(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4" />
                  <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">{getFeaturedAuthorLabel(gender)}</Label>
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t bg-background shrink-0">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={submitting}>
                {editingProfile ? "Guardar" : "Criar Usuário"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
