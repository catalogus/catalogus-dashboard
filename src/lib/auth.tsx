import { useCallback, useEffect, useMemo, useState, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { EmailOtpType, Session, User } from '@supabase/supabase-js'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { AuthContext, type Profile } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const cmsUrl = import.meta.env.VITE_CMS_URL?.replace(/\/$/, '')

type AuthRedirectContext = {
  type: string | null
  code: string | null
  tokenHash: string | null
  accessToken: string | null
  refreshToken: string | null
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function getAuthRedirectContext(): AuthRedirectContext {
  if (typeof window === 'undefined') {
    return {
      type: null,
      code: null,
      tokenHash: null,
      accessToken: null,
      refreshToken: null,
    }
  }

  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  return {
    type: search.get('type') ?? hash.get('type'),
    code: search.get('code'),
    tokenHash: search.get('token_hash'),
    accessToken: hash.get('access_token'),
    refreshToken: hash.get('refresh_token'),
  }
}

function clearAuthRedirectParams() {
  if (typeof window === 'undefined') return
  window.history.replaceState({}, document.title, window.location.pathname)
}

async function consumeAuthRedirectIfPresent() {
  const { type, code, tokenHash, accessToken, refreshToken } = getAuthRedirectContext()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    clearAuthRedirectParams()
    return type
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })
    if (error) throw error
    clearAuthRedirectParams()
    return type
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error) throw error
    clearAuthRedirectParams()
    return type
  }

  return type
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [authBootstrapped, setAuthBootstrapped] = useState(false)
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: queryKeys.auth.profile(user?.id),
    enabled: !!user?.id,
    staleTime: 30_000,
    retry: 1,
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await withTimeout(
        Promise.resolve(
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(),
        ),
        10_000,
        'Timed out while loading profile',
      )

      if (error) throw error
      return (data ?? null) as Profile | null
    },
  })

  const profile = profileQuery.data ?? null
  const mustSetPassword = profile?.must_set_password === true

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(user.id) })
    await profileQuery.refetch()
  }, [user?.id, queryClient, profileQuery])

  useEffect(() => {
    let mounted = true

    if (typeof window !== 'undefined') {
      const initialAuthRedirect = getAuthRedirectContext()
      setRecoveryMode(initialAuthRedirect.type === 'recovery')
    }

    const init = async () => {
      try {
        const authRedirectType = await consumeAuthRedirectIfPresent()

        if (!mounted) return

        if (authRedirectType === 'recovery') {
          setRecoveryMode(true)
        }

        const {
          data: { session: initialSession },
        } = await withTimeout(
          supabase.auth.getSession(),
          10_000,
          'Timed out while reading auth session',
        )

        if (!mounted) return
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
      } finally {
        if (mounted) setAuthBootstrapped(true)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      }

      if (event === 'SIGNED_OUT') {
        setRecoveryMode(false)
      }

      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setAuthBootstrapped(true)

      if (event === 'SIGNED_OUT') {
        queryClient.removeQueries({ queryKey: queryKeys.auth.profileRoot() })
      }
    })

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return

      const {
        data: { session: visibleSession },
      } = await supabase.auth.getSession()

      if (!mounted) return
      setSession(visibleSession)
      setUser(visibleSession?.user ?? null)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [queryClient])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    queryClient.removeQueries({ queryKey: queryKeys.auth.profileRoot() })
    setRecoveryMode(false)
  }, [queryClient])

  const requestPasswordReset = useCallback(async (email: string) => {
    const redirectBase = cmsUrl || window.location.origin
    const redirectTo = `${redirectBase}/auth/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return { error }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) {
      setRecoveryMode(false)
    }
    return { error }
  }, [])

  const completeInviteSetup = useCallback(async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()

    if (!currentSession?.access_token) {
      return { error: new Error('Missing session while completing invite setup.') }
    }

    const { data, error } = await supabase.functions.invoke('complete-invite-setup', {
      headers: {
        Authorization: `Bearer ${currentSession.access_token}`,
      },
    })

    if (error) return { error }
    if (data?.error) return { error: new Error(String(data.error)) }

    await refreshProfile()
    return { error: null }
  }, [refreshProfile])

  const loading =
    !authBootstrapped || (Boolean(user?.id) && profileQuery.status === 'pending')

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      role: profile?.role ?? null,
      mustSetPassword,
      recoveryMode,
      loading,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
      completeInviteSetup,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      mustSetPassword,
      recoveryMode,
      loading,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
      completeInviteSetup,
      refreshProfile,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
