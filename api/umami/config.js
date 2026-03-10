const REQUIRED_ENV_KEYS = ['UMAMI_API_TOKEN']

export default async function handler(_request, response) {
  const configured = REQUIRED_ENV_KEYS.every((key) => Boolean(process.env[key]))

  response.setHeader('Cache-Control', 'no-store')
  response.status(200).json({ configured })
}
