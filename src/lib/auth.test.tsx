import { act, render, screen, waitFor } from '@testing-library/react'
import type { Session, User } from '@supabase/supabase-js'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { AuthProvider } from '@/lib/auth'
import { useAuth, type Profile } from '@/lib/auth-context'
import { createQueryClientWrapper, createTestQueryClient } from '@/test/utils'

const authMockState = vi.hoisted(() => {
  const getSession = vi.fn()
  const onAuthStateChange = vi.fn()
  const signOut = vi.fn()
  const signInWithPassword = vi.fn()
  const resetPasswordForEmail = vi.fn()
  const updateUser = vi.fn()
  const maybeSingle = vi.fn()
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    })),
  }))
  return {
    getSession,
    onAuthStateChange,
    signOut,
    signInWithPassword,
    resetPasswordForEmail,
    updateUser,
    maybeSingle,
    from,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: authMockState.getSession,
      onAuthStateChange: authMockState.onAuthStateChange,
      signOut: authMockState.signOut,
      signInWithPassword: authMockState.signInWithPassword,
      resetPasswordForEmail: authMockState.resetPasswordForEmail,
      updateUser: authMockState.updateUser,
    },
    from: authMockState.from,
  },
}))

function Probe() {
  const { loading, user, profile } = useAuth()
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="user-id">{user?.id ?? 'none'}</span>
      <span data-testid="profile-id">{profile?.id ?? 'none'}</span>
    </div>
  )
}

describe('AuthProvider idle-session resilience', () => {
  let authStateHandler: ((event: string, session: Session | null) => void) | null = null

  const baseUser = { id: 'u-1', email: 'admin@test.com' } as User
  const baseSession = { user: baseUser } as Session
  const baseProfile = { id: 'u-1', role: 'admin', name: 'Admin' } as unknown as Profile

  beforeEach(() => {
    vi.clearAllMocks()
    authStateHandler = null

    authMockState.getSession.mockResolvedValue({ data: { session: baseSession } })
    authMockState.maybeSingle.mockResolvedValue({ data: baseProfile, error: null })
    authMockState.onAuthStateChange.mockImplementation((cb: (event: string, session: Session | null) => void) => {
      authStateHandler = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
  })

  it('boots with session and profile data', async () => {
    const queryClient = createTestQueryClient()
    const Wrapper = createQueryClientWrapper(queryClient)

    render(
      <Wrapper>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </Wrapper>,
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'))
    expect(screen.getByTestId('user-id')).toHaveTextContent('u-1')
    expect(screen.getByTestId('profile-id')).toHaveTextContent('u-1')
  })

  it('rechecks session on visibility change', async () => {
    const queryClient = createTestQueryClient()
    const Wrapper = createQueryClientWrapper(queryClient)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })

    render(
      <Wrapper>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </Wrapper>,
    )

    await waitFor(() => expect(authMockState.getSession).toHaveBeenCalledTimes(1))

    document.dispatchEvent(new Event('visibilitychange'))

    await waitFor(() => expect(authMockState.getSession).toHaveBeenCalledTimes(2))
  })

  it('clears cached auth-profile data on SIGNED_OUT', async () => {
    const queryClient = createTestQueryClient()
    const Wrapper = createQueryClientWrapper(queryClient)

    render(
      <Wrapper>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </Wrapper>,
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'))

    queryClient.setQueryData(queryKeys.auth.profile('u-1'), { id: 'u-1' })
    expect(queryClient.getQueryData(queryKeys.auth.profile('u-1'))).toEqual({ id: 'u-1' })

    act(() => {
      authStateHandler?.('SIGNED_OUT', null)
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.auth.profile('u-1'))).toBeUndefined()
    })
  })
})
