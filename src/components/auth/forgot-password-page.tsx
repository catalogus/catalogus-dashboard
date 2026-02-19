import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const { requestPasswordReset } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await requestPasswordReset(email)
    if (error) {
      setError('Não foi possível enviar o e-mail agora. Tente novamente.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Recuperar senha</CardTitle>
          <CardDescription className="text-center">
            Disponível apenas para contas de administrador e autor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <p className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                Se o e-mail existir e estiver elegível, enviaremos instruções de recuperação.
              </p>
              <p className="text-xs text-muted-foreground">
                Verifique a caixa de entrada e spam. O link abre a página de redefinição no CMS.
              </p>
              <Link to="/auth/login" className="text-sm underline text-amber-700 hover:text-amber-800">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="autor@catalogus.co.mz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
                {loading ? 'A enviar...' : 'Enviar link de recuperação'}
              </Button>

              <Link to="/auth/login" className="block text-center text-sm underline text-muted-foreground hover:text-foreground">
                Voltar ao login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
