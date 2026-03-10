import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type RuleState = {
  label: string
  ok: boolean
}

function validatePassword(value: string): RuleState[] {
  return [
    { label: 'Pelo menos 10 caracteres', ok: value.length >= 10 },
    { label: 'Uma letra maiúscula', ok: /[A-Z]/.test(value) },
    { label: 'Uma letra minúscula', ok: /[a-z]/.test(value) },
    { label: 'Um numero', ok: /\d/.test(value) },
    { label: 'Um caractere especial', ok: /[^A-Za-z0-9]/.test(value) },
  ]
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const {
    user,
    role,
    mustSetPassword,
    loading: authLoading,
    recoveryMode,
    updatePassword,
    completeInviteSetup,
    signOut,
  } = useAuth()
  const navigate = useNavigate()

  const rules = useMemo(() => validatePassword(password), [password])
  const passwordStrong = rules.every((rule) => rule.ok)
  const allowedRole = role === 'admin' || role === 'author'
  const isInviteSetupFlow = role === 'admin' && mustSetPassword

  const invalidRecoveryContext = !authLoading && (!user || (!recoveryMode && !isInviteSetupFlow))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!allowedRole) {
      setError('Esta recuperação está disponível apenas para admin e autor.')
      return
    }

    if (!passwordStrong) {
      setError('A senha não cumpre os requisitos de segurança.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)

    if (error) {
      setError(error.message || 'Falha ao redefinir a senha.')
      setLoading(false)
      return
    }

    if (isInviteSetupFlow) {
      const { error: completionError } = await completeInviteSetup()
      if (completionError) {
        setError(completionError.message || 'Falha ao activar a conta de staff.')
        setLoading(false)
        return
      }
    }

    setDone(true)
    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (invalidRecoveryContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido ou expirado</CardTitle>
            <CardDescription>
              Este link de recuperação não é mais válido. Solicite um novo link para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth/forgot-password" className="text-sm underline text-amber-700 hover:text-amber-800">
              Solicitar novo link
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!allowedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Recuperação indisponível</CardTitle>
            <CardDescription>
              Este fluxo está habilitado apenas para contas de administrador e autor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={async () => {
                await signOut()
                navigate({ to: '/auth/login' })
              }}
            >
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isInviteSetupFlow ? 'Activar conta de staff' : 'Nova senha'}
          </CardTitle>
          <CardDescription className="text-center">
            {isInviteSetupFlow
              ? 'Defina uma senha forte para concluir a activação antes de aceder ao painel.'
              : 'Defina uma senha forte para a sua conta.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <p className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                {isInviteSetupFlow
                  ? 'Conta activada com sucesso. Entre novamente para aceder ao painel.'
                  : 'Senha actualizada com sucesso.'}
              </p>
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={async () => {
                  await signOut()
                  navigate({ to: '/auth/login' })
                }}
              >
                Ir para login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
              )}

              {isInviteSetupFlow && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Está a concluir a activação da sua conta de staff. O acesso ao painel só será liberado depois desta etapa.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  showLabel="Mostrar confirmação da senha"
                  hideLabel="Ocultar confirmação da senha"
                  required
                />
              </div>

              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs font-medium mb-2">Requisitos de segurança</p>
                <ul className="space-y-1">
                  {rules.map((rule) => (
                    <li key={rule.label} className={`text-xs ${rule.ok ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                      {rule.ok ? 'OK' : '...'} {rule.label}
                    </li>
                  ))}
                </ul>
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
                {loading
                  ? isInviteSetupFlow
                    ? 'A activar conta...'
                    : 'A actualizar...'
                  : isInviteSetupFlow
                    ? 'Activar conta'
                    : 'Actualizar senha'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
