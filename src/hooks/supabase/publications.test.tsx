import { act, renderHook } from '@testing-library/react'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { useCreatePublication } from '@/hooks/supabase/publications'
import { createQueryClientWrapper, createTestQueryClient } from '@/test/utils'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

describe('publications hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates publication queries after create mutation', async () => {
    const mutationBuilder = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    }

    mutationBuilder.insert.mockReturnValue(mutationBuilder)
    mutationBuilder.select.mockReturnValue(mutationBuilder)
    mutationBuilder.single.mockResolvedValue({ data: { id: 'pub-1' }, error: null })

    fromMock.mockReturnValue(mutationBuilder)

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = createQueryClientWrapper(queryClient)

    const { result } = renderHook(() => useCreatePublication(), { wrapper })

    type CreatePublicationInput = Parameters<typeof result.current.mutateAsync>[0]

    await act(async () => {
      await result.current.mutateAsync({ title: 'Mapa teste' } as CreatePublicationInput)
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.publications.all() })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.publications.stats() })
  })
})
