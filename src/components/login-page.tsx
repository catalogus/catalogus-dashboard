import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth-context'
import { buildBridgeTransferUrl, resolveReturnBridgeUrl } from '@/lib/cross-site-auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError('Email ou senha inválidos')
      setLoading(false)
    } else {
      const returnToRaw =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('return_to')
          : null
      const returnBridgeUrl = resolveReturnBridgeUrl(returnToRaw)

      if (returnBridgeUrl) {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          window.location.replace(
            buildBridgeTransferUrl(returnBridgeUrl, session, window.location.origin)
          )
          return
        }
      }

      navigate({ to: '/' })
    }
  }

  const returnToRaw =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('return_to')
      : null
  const signUpHref = returnToRaw
    ? `/auth/author-sign-up?return_to=${encodeURIComponent(returnToRaw)}`
    : '/auth/author-sign-up'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Catalogus CMS
          </CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@catalogus.co.mz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <Link
              to="/auth/forgot-password"
              className="block text-center text-sm underline text-muted-foreground hover:text-foreground"
            >
              Esqueceu a senha?
            </Link>

            <a
              href={signUpHref}
              className="block text-center text-sm underline text-amber-700 hover:text-amber-800"
            >
              Registar como autor
            </a>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
