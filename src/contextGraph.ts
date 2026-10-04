import {callContextMcpJson} from './contextMcp'

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function endpointForPerspective(perspective: 'published' | 'drafts') {
  const endpoint = new URL(requiredEnv('SANITY_CONTEXT_MCP_URL'))
  endpoint.searchParams.set('perspective', perspective)
  return endpoint.toString()
}

export async function queryRightsGraph<T>(
  perspective: 'published' | 'drafts',
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
