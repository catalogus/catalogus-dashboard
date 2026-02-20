import type { Session } from '@supabase/supabase-js'

const DEFAULT_STOREFRONT_URL = 'https://catalogus.co.mz'
const DEFAULT_CMS_URL = 'https://admin.catalogus.co.mz'

export const STOREFRONT_URL =
  import.meta.env.VITE_STOREFRONT_URL || DEFAULT_STOREFRONT_URL
export const CMS_URL = import.meta.env.VITE_CMS_URL || DEFAULT_CMS_URL

const localOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174']

const allowedOrigins = new Set(
  [STOREFRONT_URL, CMS_URL, ...localOrigins]
    .map((value) => {
      try {
        return new URL(value).origin
      } catch {
        return null
      }
    })
    .filter((value): value is string => Boolean(value))
)

export function isAllowedOrigin(origin: string) {
  return allowedOrigins.has(origin)
}

export function sanitizeInternalPath(path: string | null | undefined, fallback = '/') {
  if (!path) return fallback
  if (!path.startsWith('/')) return fallback
  if (path.startsWith('//')) return fallback
  return path
}

export function resolveReturnBridgeUrl(raw: string | null) {
  if (!raw) return null

  try {
    const url = new URL(raw)
    if (!isAllowedOrigin(url.origin)) return null
    if (!url.pathname.startsWith('/auth/bridge')) return null
    return url
  } catch {
    return null
  }
}

export function buildBridgeTransferUrl(target: URL, session: Session, fromOrigin: string) {
  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    from: fromOrigin,
  })
  return `${target.toString()}#${hash.toString()}`
}
