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

type UmamiStatsRaw = {
  pageviews: number
  visitors: number
  visits: number
  bounces: number
  totaltime: number
  comparison?: {
    pageviews?: number
    visitors?: number
    visits?: number
    bounces?: number
    totaltime?: number
  }
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

function calculateChange(current: number, previous?: number): number {
  if (previous === undefined || previous === null) return 0
  if (previous === 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

async function fetchUmamiStats(startDate: Date, endDate: Date): Promise<UmamiStats> {
  const raw = await fetchUmami<UmamiStatsRaw>('/stats', {
    startAt: dateToTimestamp(startDate),
    endAt: dateToTimestamp(endDate),
  })

  const comparison = raw.comparison || {}

  return {
    pageviews: {
      value: raw.pageviews ?? 0,
      change: calculateChange(raw.pageviews ?? 0, comparison.pageviews),
    },
    visitors: {
      value: raw.visitors ?? 0,
      change: calculateChange(raw.visitors ?? 0, comparison.visitors),
    },
    visits: {
      value: raw.visits ?? 0,
      change: calculateChange(raw.visits ?? 0, comparison.visits),
    },
    bounces: {
      value: raw.bounces ?? 0,
      change: calculateChange(raw.bounces ?? 0, comparison.bounces),
    },
    totaltime: {
      value: raw.totaltime ?? 0,
      change: calculateChange(raw.totaltime ?? 0, comparison.totaltime),
    },
  }
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
    queryFn: () => fetchUmamiStats(startDate, endDate),
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
