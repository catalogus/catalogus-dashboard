import { proxyUmamiEndpoint } from './_proxy.js'

export default async function handler(request, response) {
  return proxyUmamiEndpoint(request, response, 'pageviews')
}
