type JsonRpcEnvelope = {
  result?: {
    content?: Array<{type?: string; text?: string}>
    structuredContent?: {result?: unknown} | unknown
  }
  error?: unknown
}

function parseEnvelope(raw: string): JsonRpcEnvelope {
  const dataLines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter(Boolean)

  return JSON.parse(dataLines.length ? dataLines[dataLines.length - 1] : raw)
}

async function requestContextMcp(
  endpoint: string,
  token: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<JsonRpcEnvelope> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
    cache: 'no-store',
  })

  const raw = await response.text()
  if (!response.ok) {
    throw new Error(`Context MCP HTTP ${response.status}: ${raw}`)
  }

  const envelope = parseEnvelope(raw)
  if (envelope.error) {
    throw new Error(`Context MCP error: ${JSON.stringify(envelope.error)}`)
  }

  return envelope
}

export async function callContextMcp(
  endpoint: string,
  token: string,
  toolName: string,
  args: Record<string, unknown>,
) {
  const envelope = await requestContextMcp(endpoint, token, toolName, args)

  const text = envelope.result?.content
    ?.filter((item) => item.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('\n\n')

  if (!text) throw new Error('Context MCP returned no readable text content')
  return text
}

export async function callContextMcpJson<T>(
  endpoint: string,
  token: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<T> {
  const envelope = await requestContextMcp(endpoint, token, toolName, args)

  const structured = envelope.result?.structuredContent
  if (
    structured &&
    typeof structured === 'object' &&
    'result' in structured &&
    (structured as {result?: unknown}).result !== undefined
  ) {
    return (structured as {result: T}).result
  }

  const blocks = envelope.result?.content || []
  for (const block of blocks) {
    if (block.type !== 'text' || typeof block.text !== 'string') continue
    try {
      const parsed = JSON.parse(block.text)
      if (parsed && typeof parsed === 'object' && 'result' in parsed) {
        return parsed.result as T
      }
      return parsed as T
    } catch {
      // Keep looking for a JSON content block.
    }
  }

  throw new Error('Context MCP returned no structured JSON result')
}
