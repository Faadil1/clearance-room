import {callContextMcpJson} from './contextMcp'

export type ContentPerspective = string

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export function normalizePerspective(value?: string | null): ContentPerspective {
  const perspective = (value || 'drafts').trim()
  if (!perspective) return 'drafts'
  if (!/^[A-Za-z0-9._,-]+$/.test(perspective)) {
    throw new Error('Invalid Sanity perspective')
  }
  return perspective
}

function endpointForPerspective(perspective: ContentPerspective) {
  const endpoint = new URL(requiredEnv('SANITY_CONTEXT_MCP_URL'))
  endpoint.searchParams.set('perspective', normalizePerspective(perspective))
  return endpoint.toString()
}

export async function queryRightsGraph<T>(
  perspective: ContentPerspective,
  query: string,
): Promise<T> {
  const token = requiredEnv('SANITY_ORGANIZATION_TOKEN')

  return callContextMcpJson<T>(
    endpointForPerspective(perspective),
    token,
    'groq_query',
    {query},
  )
}
