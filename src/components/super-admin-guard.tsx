import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth-context'

interface SuperAdminGuardProps {
  children: ReactNode
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const { loading, role, profile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  const isSuperAdmin = role === 'admin' && profile?.admin_level === 'super_admin'

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Esta area esta disponivel apenas para Super Admin.
          </p>
          <Link
            to="/"
            className="inline-flex h-9 items-center rounded-md bg-amber-600 px-4 text-sm font-medium text-white hover:bg-amber-700"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
