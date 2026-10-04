import {NextResponse} from 'next/server'
import {callContextMcp} from '../../../src/contextMcp.js'

export const dynamic = 'force-dynamic'

export async function POST() {
  const endpoint = process.env.SANITY_EVIDENCE_MCP_URL
  const token = process.env.SANITY_ORGANIZATION_TOKEN
  const knowledgeBase = process.env.SANITY_KNOWLEDGE_BASE_ID || 'kbjKMGM1H2uf'

  if (!endpoint || !token) {
    return NextResponse.json(
      {error: 'Evidence endpoint is not configured on the server'},
      {status: 500},
    )
  }

  try {
    const text = await callContextMcp(
      endpoint,
      token,
      'knowledge_base_search',
      {
        knowledgeBase,
        query: 'rights-maya-2026 paid social advertising Canada United States 2026-12-31',
        return: 'entries',
        limit: 3,
      },
    )

    return NextResponse.json({
      knowledgeBase,
      queryMode: 'knowledge_base_search',
      evidence: text,
      authority: 'evidence-only',
      observedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Evidence retrieval failed',
      },
      {status: 500},
    )
  }
}
