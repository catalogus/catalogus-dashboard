import { useEffect, useState } from 'react'

export function useLongLoading(isLoading: boolean, delayMs: number = 8000) {
  const [isLongLoading, setIsLongLoading] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setIsLongLoading(false)
      return
    }

    const timeout = setTimeout(() => {
      setIsLongLoading(true)
    }, delayMs)

    return () => clearTimeout(timeout)
  }, [isLoading, delayMs])

  return isLongLoading
}
