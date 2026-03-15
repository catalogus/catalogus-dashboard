const UMAMI_BASE_URL = process.env.UMAMI_API_CLIENT_ENDPOINT || 'https://api.umami.is/v1'
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID || '20a42f0d-d00b-47b2-8597-0564396b24bc'
const ALLOWED_ENDPOINTS = new Set(['stats', 'pageviews', 'metrics', 'active'])
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 120
const requestLog = new Map()

function getEndpoint(request) {
  const endpoint = request.query?.endpoint
  if (Array.isArray(endpoint)) return endpoint[0]
  return endpoint
}

function setCacheHeaders(response, endpoint) {
  if (endpoint === 'active') {
    response.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return
  }

  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
}

function getClientKey(request) {
  const forwardedFor = request.headers['x-forwarded-for']
  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0] || 'unknown'
  }

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim()
  }

  return request.socket?.remoteAddress || 'unknown'
}

function isRateLimited(request) {
  const now = Date.now()
  const clientKey = getClientKey(request)
  const recentRequests = (requestLog.get(clientKey) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  )

  recentRequests.push(now)
  requestLog.set(clientKey, recentRequests)

  return recentRequests.length > RATE_LIMIT_MAX_REQUESTS
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).send('Method not allowed')
    return
  }

  const token = process.env.UMAMI_API_TOKEN
  if (!token) {
    response.setHeader('Cache-Control', 'no-store')
    response.status(503).send('Umami server token is not configured')
    return
  }

  const endpoint = getEndpoint(request)
  if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
    response.status(404).send('Unknown Umami endpoint')
    return
  }

  if (isRateLimited(request)) {
    response.setHeader('Cache-Control', 'no-store')
    response.status(429).send('Too many analytics requests')
    return
  }

  const url = new URL(`${UMAMI_BASE_URL}/api/websites/${UMAMI_WEBSITE_ID}/${endpoint}`)

  for (const [key, value] of Object.entries(request.query || {})) {
    if (key === 'endpoint') continue
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, item)
      }
      continue
    }
    if (value != null) {
      url.searchParams.set(key, String(value))
    }
  }

  try {
    const upstreamResponse = await fetch(url, {
      headers: {
        'x-umami-api-key': token,
        Accept: 'application/json',
      },
    })

    const text = await upstreamResponse.text()
    response.setHeader('Content-Type', upstreamResponse.headers.get('content-type') || 'application/json')
    setCacheHeaders(response, endpoint)
    response.status(upstreamResponse.status).send(text)
  } catch {
    response.setHeader('Cache-Control', 'no-store')
    response.status(502).send('Failed to reach Umami upstream')
  }
}
