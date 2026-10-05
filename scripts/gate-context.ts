import assert from 'node:assert/strict'
import {compileClearance} from '../src/compiler.js'
import {diffProofs} from '../src/diff.js'
import {usageGraphQueryFor} from '../src/query.js'
import type {UsageGraph} from '../src/types.js'

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

const baseUrl = requiredEnv('SANITY_CONTEXT_MCP_URL')
const token = requiredEnv('SANITY_ORGANIZATION_TOKEN')

function endpointFor(perspective: 'published' | 'drafts') {
  const url = new URL(baseUrl)
  url.searchParams.set('perspective', perspective)
  return url.toString()
}

async function callGroq(perspective: 'published' | 'drafts'): Promise<UsageGraph> {
  const response = await fetch(endpointFor(perspective), {
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
        name: 'groq_query',
        arguments: {
          query: usageGraphQueryFor('usage-winter-ca'),
        },
      },
    }),
  })

  const raw = await response.text()
  if (!response.ok) {
    throw new Error(`Context MCP HTTP ${response.status}: ${raw}`)
  }

  const payloads = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter(Boolean)

  const envelope = payloads.length
    ? JSON.parse(payloads[payloads.length - 1])
    : JSON.parse(raw)

  if (envelope.error) {
    throw new Error(`Context MCP JSON-RPC error: ${JSON.stringify(envelope.error)}`)
  }

  const result = envelope.result
  if (!result) throw new Error('Context MCP returned no result')

  // Prefer structuredContent when present.
  if (result.structuredContent?.result) {
    return result.structuredContent.result as UsageGraph
  }

  // Otherwise parse the first JSON-looking text content block.
  const blocks = Array.isArray(result.content) ? result.content : []
  for (const block of blocks) {
    if (block?.type !== 'text' || typeof block.text !== 'string') continue
    try {
      const parsed = JSON.parse(block.text)
      if (parsed?.result) return parsed.result as UsageGraph
      if (parsed?._id) return parsed as UsageGraph
    } catch {
      // Ignore non-JSON explanatory text blocks.
    }
  }

  throw new Error(`Could not extract GROQ result from MCP response: ${raw}`)
}

const published = await callGroq('published')
const drafts = await callGroq('drafts')

const current = compileClearance(published)
const proposed = compileClearance(drafts)
const diff = diffProofs(current, proposed)

assert.equal(current.status, 'CLEAR', 'published Context perspective must compile to CLEAR')
assert.equal(proposed.status, 'BLOCK', 'drafts Context perspective must compile to BLOCK')
assert.equal(diff.from, 'CLEAR')
assert.equal(diff.to, 'BLOCK')
assert.equal(diff.changed, true)

const paid = proposed.findings.find((finding) => finding.axis === 'paid')
assert.equal(paid?.status, 'BLOCK')
assert.ok(
  paid?.causedBy.some((id) => id.includes('rights-maya-2026')),
  'BLOCK must be caused by the Maya rights document',
)

console.log(JSON.stringify({
  gate: 'SANITY_CONTEXT_MCP_PERSPECTIVE',
  current,
  proposed,
  diff,
  result: 'PASS',
}, null, 2))
