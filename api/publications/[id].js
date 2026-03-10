import { createClient } from '@supabase/supabase-js'

function getPublicationId(request) {
  const value = request.query?.id
  if (Array.isArray(value)) return value[0]
  return value
}

async function getAuthenticatedProfile(request, supabaseUrl, supabaseAnonKey, serviceClient) {
  const authorization = request.headers.authorization || request.headers.Authorization
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return { error: 'Missing bearer token', status: 401 }
  }

  const accessToken = authorization.slice('Bearer '.length)
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })

  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken)
  if (userError || !userData.user) {
    return { error: 'Invalid auth token', status: 401 }
  }

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('id, role')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError || !profile || !['admin', 'author'].includes(profile.role)) {
    return { error: 'Insufficient permissions', status: 403 }
  }

  return { profile }
}

async function removeFolderFiles(serviceClient, folderPath) {
  const { data: files, error } = await serviceClient.storage.from('publications').list(folderPath)
  if (error || !files?.length) return

  await serviceClient.storage
    .from('publications')
    .remove(files.map((file) => `${folderPath}/${file.name}`))
}

export default async function handler(request, response) {
  if (request.method !== 'DELETE') {
    response.setHeader('Allow', 'DELETE')
    response.status(405).send('Method not allowed')
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    response.status(503).send('Publication delete API is not configured')
    return
  }

  const publicationId = getPublicationId(request)
  if (!publicationId) {
    response.status(400).send('Missing publication id')
    return
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey)
  const authResult = await getAuthenticatedProfile(request, supabaseUrl, supabaseAnonKey, serviceClient)

  if ('error' in authResult) {
    response.status(authResult.status).send(authResult.error)
    return
  }

  try {
    await Promise.all([
      removeFolderFiles(serviceClient, `${publicationId}/pages`),
      removeFolderFiles(serviceClient, `${publicationId}/thumbnails`),
    ])

    await serviceClient.storage.from('publications').remove([`${publicationId}/original.pdf`])

    const { error } = await serviceClient.from('publications').delete().eq('id', publicationId)
    if (error) throw error

    response.status(200).json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete publication'
    response.status(500).send(message)
  }
}
