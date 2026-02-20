import { act, renderHook } from '@testing-library/react'
import { useLongLoading } from '@/hooks/use-long-loading'

describe('useLongLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('switches to long-loading after delay', () => {
    const { result } = renderHook(({ isLoading }) => useLongLoading(isLoading, 1000), {
      initialProps: { isLoading: true },
    })

    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current).toBe(true)
  })

  it('resets when loading ends', () => {
    const { result, rerender } = renderHook(({ isLoading }) => useLongLoading(isLoading, 1000), {
      initialProps: { isLoading: true },
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current).toBe(true)

    rerender({ isLoading: false })

    expect(result.current).toBe(false)
  })
})
