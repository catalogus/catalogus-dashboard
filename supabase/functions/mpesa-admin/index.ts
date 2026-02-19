import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Action = 'status' | 'reverse'

type RequestBody = {
  action?: Action
  orderId?: string
  amount?: number
}

const textEncoder = new TextEncoder()

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const signPayload = async (payload: unknown, secret: string) => {
  const timestamp = new Date().toISOString()
  const body = JSON.stringify(payload)
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureRaw = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(`${timestamp}.${body}`),
  )

  return {
    timestamp,
    signature: toHex(signatureRaw),
    body,
  }
}

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const gatewayBaseUrl = Deno.env.get('MPESA_GATEWAY_URL')
  const gatewaySecret = Deno.env.get('MPESA_GATEWAY_SECRET')

  if (!supabaseUrl || !serviceRoleKey || !gatewayBaseUrl || !gatewaySecret) {
    return json(500, { success: false, message: 'Missing server configuration' })
  }

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return json(401, { success: false, message: 'Missing auth token' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return json(401, { success: false, message: 'Unauthorized' })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return json(403, { success: false, message: 'Forbidden' })
  }

  if (profile.role !== 'admin') {
    return json(403, { success: false, message: 'Only admins can manage M-Pesa operations' })
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return json(400, { success: false, message: 'Invalid JSON payload' })
  }

  const action = body.action
  const orderId = body.orderId

  if (!action || !['status', 'reverse'].includes(action)) {
    return json(400, { success: false, message: 'Invalid action' })
  }

  if (!orderId) {
    return json(400, { success: false, message: 'Missing orderId' })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, mpesa_transaction_id, mpesa_reference, total')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError || !order) {
    return json(404, { success: false, message: 'Order not found' })
  }

  const payload =
    action === 'status'
      ? {
          orderId: order.id,
          orderNumber: order.order_number,
          transactionId: order.mpesa_transaction_id,
          reference: order.mpesa_reference,
        }
      : {
          orderId: order.id,
          orderNumber: order.order_number,
          transactionId: order.mpesa_transaction_id,
          reference: order.mpesa_reference,
          amount:
            typeof body.amount === 'number' && Number.isFinite(body.amount)
              ? body.amount
              : Number(order.total),
        }

  const { timestamp, signature, body: signedBody } = await signPayload(payload, gatewaySecret)
  const endpoint = action === 'status' ? '/mpesa/status' : '/mpesa/reverse'

  const gatewayResponse = await fetch(`${gatewayBaseUrl.replace(/\/$/, '')}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gateway-Timestamp': timestamp,
      'X-Gateway-Signature': signature,
    },
    body: signedBody,
  })

  let gatewayData: unknown = null
  try {
    gatewayData = await gatewayResponse.json()
  } catch {
    gatewayData = null
  }

  if (!gatewayResponse.ok) {
    return json(502, {
      success: false,
      message:
        action === 'status'
          ? 'Falha ao actualizar estado M-Pesa'
          : 'Falha ao solicitar reversao M-Pesa',
      gateway: gatewayData,
    })
  }

  return json(200, {
    success: true,
    message:
      action === 'status'
        ? 'Estado M-Pesa actualizado com sucesso'
        : 'Pedido de reversao enviado com sucesso',
    gateway: gatewayData,
  })
})
