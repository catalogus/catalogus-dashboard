import { useQuery } from '@tanstack/react-query'

const UMAMI_PROXY_BASE_URL = '/api/umami'

function buildProxyUrl(endpoint: string, params: Record<string, string | number>) {
  const normalizedEndpoint = endpoint.replace(/^\//, '')
  const url = new URL(`${UMAMI_PROXY_BASE_URL}/${normalizedEndpoint}`, window.location.origin)

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

function dateToTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000) * 1000
}

type UmamiStats = {
  pageviews: { value: number; change: number }
  visitors: { value: number; change: number }
  visits: { value: number; change: number }
  bounces: { value: number; change: number }
  totaltime: { value: number; change: number }
}

type UmamiPageviews = {
  pageviews: Array<{ x: string; y: number }>
  sessions: Array<{ x: string; y: number }>
}

type UmamiMetricItem = { x: string; y: number }

type UmamiMetrics = {
  url: UmamiMetricItem[]
  referrer: UmamiMetricItem[]
  browser: UmamiMetricItem[]
  os: UmamiMetricItem[]
  device: UmamiMetricItem[]
  country: UmamiMetricItem[]
}

type UmamiActive = number
type UmamiActiveResponse = { visitors?: number }

async function fetchUmami<T>(endpoint: string, params: Record<string, string | number>): Promise<T> {
  const response = await fetch(buildProxyUrl(endpoint, params), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Umami API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

type UmamiConfig = {
  configured: boolean
}

async function fetchUmamiConfig(): Promise<UmamiConfig> {
  const response = await fetch(`${UMAMI_PROXY_BASE_URL}/config`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Umami config error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function useUmamiConfig(initialData?: UmamiConfig) {
  return useQuery({
    queryKey: ['umami-config'],
    queryFn: fetchUmamiConfig,
    initialData,
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useUmamiStats(startDate: Date, endDate: Date, enabled: boolean) {
  return useQuery({
    queryKey: ['umami-stats', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => fetchUmami<UmamiStats>('/stats', {
      startAt: dateToTimestamp(startDate),
      endAt: dateToTimestamp(endDate),
    }),
    staleTime: 60_000,
    enabled,
  })
}

export function useUmamiPageviews(
  startDate: Date,
  endDate: Date,
  unit: 'hour' | 'day' = 'day',
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['umami-pageviews', startDate.toISOString(), endDate.toISOString(), unit],
    queryFn: () => fetchUmami<UmamiPageviews>('/pageviews', {
      startAt: dateToTimestamp(startDate),
      endAt: dateToTimestamp(endDate),
      unit,
    }),
    staleTime: 60_000,
    enabled,
  })
}

export function useUmamiMetrics(
  startDate: Date,
  endDate: Date,
  type: keyof UmamiMetrics,
  limit: number = 10,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['umami-metrics', startDate.toISOString(), endDate.toISOString(), type, limit],
    queryFn: () => fetchUmami<UmamiMetricItem[]>(`/metrics`, {
      startAt: dateToTimestamp(startDate),
      endAt: dateToTimestamp(endDate),
      type,
      limit,
    }),
    staleTime: 60_000,
    enabled,
  })
}

export function useUmamiActive(enabled: boolean) {
  return useQuery({
    queryKey: ['umami-active'],
    queryFn: async () => {
      const data = await fetchUmami<UmamiActive | UmamiActiveResponse>('/active', {})
      if (typeof data === 'number') return data
      return data?.visitors ?? 0
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
    enabled,
  })
}

export function useUmamiConfigured() {
  const configQuery = useUmamiConfig()
  return configQuery.data?.configured ?? false
}

export type { UmamiStats, UmamiPageviews, UmamiMetricItem, UmamiMetrics, UmamiConfig }
