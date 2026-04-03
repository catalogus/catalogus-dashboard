import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getGenderedAuthorType, getAuthorNoun, normalizeAuthorGender, type AuthorGender } from '@/components/dashboard/authors/author-type'
import {
  buildBridgeTransferUrl,
  resolveReturnBridgeUrl,
} from '@/lib/cross-site-auth'
import { supabase } from '@/lib/supabase'

export function AuthorSignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<AuthorGender | ''>('')
  const [authorType, setAuthorType] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const returnToRaw = useMemo(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('return_to')
  }, [])

  const loginHref = useMemo(() => {
    if (!returnToRaw) return '/auth/login'
    return `/auth/login?return_to=${encodeURIComponent(returnToRaw)}`
  }, [returnToRaw])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!normalizeAuthorGender(gender)) {
      setError('Selecione o género do autor')
      return
    }

    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        role: 'author',
        gender: normalizeAuthorGender(gender),
      },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const createdUser = authData.user
    if (createdUser?.id) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: createdUser.id,
        role: 'author',
        status: 'pending',
        name,
        email,
        phone: phone || null,
        gender: normalizeAuthorGender(gender),
        author_type: authorType || null,
      })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }
    }

    const returnBridgeUrl = resolveReturnBridgeUrl(returnToRaw)
    const session = authData.session
    if (session && returnBridgeUrl) {
      window.location.replace(
        buildBridgeTransferUrl(returnBridgeUrl, session, window.location.origin)
      )
      return
    }

    setDone(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Registo de {getAuthorNoun(gender)}</CardTitle>
          <CardDescription className="text-center">
            {`Crie a sua conta de ${getAuthorNoun(gender).toLowerCase()} para gerir perfil e conteúdos.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <p className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                Conta criada com sucesso. Se necessário, confirme o email para concluir o acesso.
              </p>
              <a href={loginHref} className="text-sm underline text-amber-700 hover:text-amber-800">
                Ir para login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={10}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Género (opcional)</Label>
                  <Select value={gender || '__empty'} onValueChange={(value) => setGender(value === '__empty' ? '' : value as AuthorGender)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty">Não definido</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{`Tipo de ${getAuthorNoun(gender).toLowerCase()} (opcional)`}</Label>
                  <Select value={authorType || '__empty'} onValueChange={(value) => setAuthorType(value === '__empty' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty">Não definido</SelectItem>
                      <SelectItem value="Escritor">{getGenderedAuthorType('Escritor', gender)}</SelectItem>
                      <SelectItem value="Poeta">Poeta</SelectItem>
                      <SelectItem value="Investigador">{getGenderedAuthorType('Investigador', gender)}</SelectItem>
                      <SelectItem value="Jornalista">Jornalista</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
                {loading ? 'A criar conta...' : `Criar conta de ${getAuthorNoun(gender).toLowerCase()}`}
              </Button>

              <a href={loginHref} className="block text-center text-sm underline text-muted-foreground hover:text-foreground">
                Já tenho conta
              </a>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
