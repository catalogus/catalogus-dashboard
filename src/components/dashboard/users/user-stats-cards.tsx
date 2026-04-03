type UserStatsCardsProps = {
  total: number
  admins: number
  authors: number
  pending: number
  pendingSetup: number
}

export function UserStatsCards({ total, admins, authors, pending, pendingSetup }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground uppercase">Total Utilizadores</p>
        <p className="text-3xl font-bold mt-1">{total}</p>
        <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
      </div>
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground uppercase">Admins</p>
        <p className="text-3xl font-bold mt-1">{admins}</p>
        <p className="text-xs text-muted-foreground mt-1">Admins activos</p>
      </div>
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground uppercase">Autores</p>
        <p className="text-3xl font-bold mt-1">{authors}</p>
        <p className="text-xs text-muted-foreground mt-1">Perfis com papel de autor</p>
      </div>
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground uppercase">Aprovações Pendentes</p>
        <p className="text-3xl font-bold mt-1 text-amber-600">{pending}</p>
        <p className="text-xs text-muted-foreground mt-1">Status de autor pendente</p>
      </div>
      <div className="border rounded-lg p-4 bg-card col-span-2 lg:col-span-1">
        <p className="text-xs font-medium text-muted-foreground uppercase">Setup de Staff</p>
        <p className="text-3xl font-bold mt-1 text-sky-700">{pendingSetup}</p>
        <p className="text-xs text-muted-foreground mt-1">Admins convidados que ainda precisam definir senha</p>
      </div>
    </div>
  )
}
