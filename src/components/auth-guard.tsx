import { ReactNode } from 'react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth-context'
import { LoginPage } from '@/components/login-page'
import { Button } from '@/components/ui/button'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, role, loading, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const pathname = location.pathname
  const isAuthRoute = pathname.startsWith('/auth/')
  const isResetPasswordRoute = pathname === '/auth/reset-password'

  const effectiveRole = role ?? ((user?.user_metadata?.role as string | undefined) ?? null)

  const defaultRoute: '/' | '/perfil' = effectiveRole === 'author' ? '/perfil' : '/'

  const isAllowedForRole = () => {
    if (!effectiveRole) return true
    if (effectiveRole === 'admin') return true
    if (effectiveRole === 'author') {
      return pathname === '/perfil' || pathname === '/perfil/reivindicar' || pathname.startsWith('/conta')
    }
    if (effectiveRole === 'customer') return false
    return false
  }

  const customerBlocked = !!user && !loading && effectiveRole === 'customer'
  const unauthorized = !!user && !loading && !isAuthRoute && !isAllowedForRole()

  useEffect(() => {
    if (!loading && !user && pathname === '/auth/login') return

    if (!loading && !user && isAuthRoute) return

    if (!loading && user && isAuthRoute && !isResetPasswordRoute) {
      navigate({ to: defaultRoute, replace: true })
      return
    }

    if (!unauthorized) return
    navigate({ to: defaultRoute, replace: true })
  }, [
    unauthorized,
    navigate,
    defaultRoute,
    loading,
    user,
    isAuthRoute,
    pathname,
    isResetPasswordRoute,
  ])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!user) {
    if (isAuthRoute) {
      return <>{children}</>
    }
    return <LoginPage />
  }

  if (isAuthRoute && !isResetPasswordRoute) {
    return null
  }

  if (customerBlocked && !isAuthRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold">Acesso temporariamente indisponível</h1>
          <p className="text-sm text-muted-foreground">
            O fluxo de cliente no CMS ainda não está ativo. Use uma conta de autor ou administrador.
          </p>
          <Button onClick={signOut} className="bg-amber-600 hover:bg-amber-700">
            Sair
          </Button>
        </div>
      </div>
    )
  }

  if (unauthorized) {
    return null
  }

  return <>{children}</>
}
