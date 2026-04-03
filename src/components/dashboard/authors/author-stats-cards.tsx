type AuthorStatsCardsProps = {
  total: number
  featured: number
  linkedProfiles: number
  pendingClaims: number
}

export function AuthorStatsCards({
  total,
  featured,
  linkedProfiles,
  pendingClaims,
}: AuthorStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground uppercase">Total Autores</p>
        <p className="text-3xl font-bold mt-1">{total}</p>
        <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
      </div>
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground uppercase">Destaque</p>
        <p className="text-3xl font-bold mt-1">{featured}</p>
        <p className="text-xs text-muted-foreground mt-1">Perfis destacados</p>
      </div>
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground uppercase">Perfis Vinculados</p>
        <p className="text-3xl font-bold mt-1">{linkedProfiles}</p>
        <p className="text-xs text-muted-foreground mt-1">Conectados a utilizadores</p>
      </div>
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground uppercase">Reivindicações Pendentes</p>
        <p className="text-3xl font-bold mt-1 text-amber-600">{pendingClaims}</p>
        <p className="text-xs text-muted-foreground mt-1">Aguardando revisão</p>
      </div>
    </div>
  )
}
