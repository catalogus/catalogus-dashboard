import { useQuery } from '@tanstack/react-query'

const UMAMI_BASE_URL = 'https://cloud.umami.is'
const WEBSITE_ID = '20a42f0d-d00b-47b2-8597-0564396b24bc'

function getApiToken() {
  return import.meta.env.VITE_UMAMI_API_TOKEN
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

async function fetchUmami<T>(endpoint: string, params: Record<string, string | number>): Promise<T> {
  const token = getApiToken()
  if (!token) {
    throw new Error('VITE_UMAMI_API_TOKEN is not configured')
  }

  const url = new URL(`${UMAMI_BASE_URL}/api/websites/${WEBSITE_ID}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value))
  })

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Umami API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function useUmamiStats(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['umami-stats', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => fetchUmami<UmamiStats>('/stats', {
      startAt: dateToTimestamp(startDate),
      endAt: dateToTimestamp(endDate),
    }),
    staleTime: 60_000,
    enabled: !!getApiToken(),
  })
}

export function useUmamiPageviews(startDate: Date, endDate: Date, unit: 'hour' | 'day' = 'day') {
  return useQuery({
    queryKey: ['umami-pageviews', startDate.toISOString(), endDate.toISOString(), unit],
    queryFn: () => fetchUmami<UmamiPageviews>('/pageviews', {
      startAt: dateToTimestamp(startDate),
      endAt: dateToTimestamp(endDate),
      unit,
    }),
    staleTime: 60_000,
    enabled: !!getApiToken(),
  })
}

export function useUmamiMetrics(startDate: Date, endDate: Date, type: keyof UmamiMetrics, limit: number = 10) {
  return useQuery({
    queryKey: ['umami-metrics', startDate.toISOString(), endDate.toISOString(), type, limit],
    queryFn: () => fetchUmami<UmamiMetricItem[]>(`/metrics`, {
      startAt: dateToTimestamp(startDate),
      endAt: dateToTimestamp(endDate),
      type,
      limit,
    }),
    staleTime: 60_000,
    enabled: !!getApiToken(),
  })
}

export function useUmamiActive() {
  return useQuery({
    queryKey: ['umami-active'],
    queryFn: () => fetchUmami<UmamiActive>('/active', {}),
    staleTime: 10_000,
    refetchInterval: 30_000,
    enabled: !!getApiToken(),
  })
}

export function useUmamiConfigured() {
  return !!getApiToken()
}

export type { UmamiStats, UmamiPageviews, UmamiMetricItem, UmamiMetrics }
