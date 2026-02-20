import { act, renderHook, waitFor } from '@testing-library/react'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { useOrders, useUpdateOrder } from '@/hooks/supabase/orders'
import { createQueryClientWrapper, createTestQueryClient } from '@/test/utils'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}))

vi.mock('@/lib/audit', () => ({
  logAuditEvent: vi.fn(),
}))

describe('orders hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated orders shape from useOrders', async () => {
    const queryBuilder = {
      select: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      eq: vi.fn(),
      or: vi.fn(),
      then: vi.fn(),
    }

    queryBuilder.select.mockReturnValue(queryBuilder)
    queryBuilder.order.mockReturnValue(queryBuilder)
    queryBuilder.range.mockReturnValue(queryBuilder)
    queryBuilder.eq.mockReturnValue(queryBuilder)
    queryBuilder.or.mockReturnValue(queryBuilder)
    queryBuilder.then.mockImplementation((resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
      return Promise.resolve({
        data: [{ id: 'order-1', status: 'paid' }],
        error: null,
        count: 1,
      }).then(resolve, reject)
    })

    fromMock.mockReturnValue(queryBuilder)

    const queryClient = createTestQueryClient()
    const wrapper = createQueryClientWrapper(queryClient)

    const { result } = renderHook(() => useOrders('all', 1, 10, ''), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      data: [{ id: 'order-1', status: 'paid' }],
      totalCount: 1,
      totalPages: 1,
    })
  })

  it('invalidates order queries after update mutation', async () => {
    const mutationBuilder = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    }

    mutationBuilder.update.mockReturnValue(mutationBuilder)
    mutationBuilder.eq.mockReturnValue(mutationBuilder)
    mutationBuilder.select.mockReturnValue(mutationBuilder)
    mutationBuilder.single.mockResolvedValue({ data: { id: 'order-1' }, error: null })

    fromMock.mockReturnValue(mutationBuilder)

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = createQueryClientWrapper(queryClient)

    const { result } = renderHook(() => useUpdateOrder(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ id: 'order-1', status: 'paid' })
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.orders.root() })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.orders.stats() })
  })
})
