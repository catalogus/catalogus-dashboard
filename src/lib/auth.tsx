import { useEffect, useState, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session, User } from '@supabase/supabase-js'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { AuthContext, type Profile } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

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

  const refreshProfile = async () => {
    if (!user?.id) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(user.id) })
    await profileQuery.refetch()
  }

  useEffect(() => {
    let mounted = true

    if (typeof window !== 'undefined') {
      setRecoveryMode(window.location.hash.includes('type=recovery'))
    }

    const init = async () => {
      try {
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    queryClient.removeQueries({ queryKey: queryKeys.auth.profileRoot() })
    setRecoveryMode(false)
  }

  const requestPasswordReset = async (email: string) => {
    const redirectTo = `${window.location.origin}/auth/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return { error }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) {
      setRecoveryMode(false)
    }
    return { error }
  }

  const loading =
    !authBootstrapped || (Boolean(user?.id) && profileQuery.status === 'pending')

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role: profile?.role ?? null,
        recoveryMode,
        loading,
        signIn,
        signOut,
        requestPasswordReset,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
