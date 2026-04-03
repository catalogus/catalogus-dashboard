import { Badge } from "@/components/ui/badge"

export type ProfileFormPayload = {
  name: string
  email: string
  phone: string | null
  role: "admin" | "author" | "customer"
  admin_level?: "super_admin" | "content_admin" | null
  status: "pending" | "approved" | "rejected"
  gender?: "male" | "female" | null
  author_type?: string | null
  bio?: string | null
  birth_date?: string | null
  residence_city?: string | null
  province?: string | null
  featured?: boolean
}

export type ProfileStats = {
  total: number
  admins: number
  authors: number
  pending: number
  pendingSetup: number
}

export function getRoleBadge(role: string, adminLevel?: string | null) {
  switch (role) {
    case "admin":
      return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/20">{adminLevel === "super_admin" ? "admin (super)" : "admin (content)"}</Badge>
    case "author":
      return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">author</Badge>
    case "customer":
      return <Badge variant="secondary">customer</Badge>
    default:
      return <Badge variant="outline">{role}</Badge>
  }
}

export function getStatusBadge(status: string | null, mustSetPassword?: boolean) {
  if (mustSetPassword) {
    return <Badge className="bg-sky-500/15 text-sky-700 hover:bg-sky-500/20">setup pendente</Badge>
  }

  if (!status) return <span className="text-muted-foreground">—</span>

  switch (status) {
    case "approved":
      return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">approved</Badge>
    case "pending":
      return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">pending</Badge>
    case "rejected":
      return <Badge variant="destructive">rejected</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function formatProfileDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
