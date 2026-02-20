import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { isAllowedOrigin, sanitizeInternalPath } from '@/lib/cross-site-auth'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/auth/bridge')({
  component: CmsBridgePage,
})

function CmsBridgePage() {
  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

      const nextPath = sanitizeInternalPath(params.get('next'), '/perfil')
      const logout = params.get('logout') === '1'

      if (logout) {
        await supabase.auth.signOut()
        window.location.replace(nextPath)
        return
      }

      const fromOrigin = hash.get('from')
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')

      if (fromOrigin && !isAllowedOrigin(fromOrigin)) {
        window.location.replace('/auth/login')
        return
      }

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
      }

      const cleanUrl = new URL(window.location.pathname, window.location.origin)
      cleanUrl.searchParams.set('next', nextPath)
      window.history.replaceState({}, document.title, `${cleanUrl.pathname}${cleanUrl.search}`)
      window.location.replace(nextPath)
    }

    void run()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">A validar sessão...</p>
    </div>
  )
}
