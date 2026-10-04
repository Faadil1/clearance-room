import {NextResponse} from 'next/server'
import {callContextMcp} from '../../../src/contextMcp'

export const dynamic = 'force-dynamic'

function extractPublishedMayaEvidence(raw: string) {
  const section =
    raw.match(/## rights-maya-2026[^\n]*\n([\s\S]*?)(?=\n---|\n## rights-|$)/)?.[0] ||
    raw

  const sourceClause =
    section.match(/>\s*"?([^"\n]*Paid social advertising[^"\n]*2026-12-31[^"\n]*)"?/)?.[1]?.trim() ||
    'Paid social advertising permitted in Canada and the United States through 2026-12-31.'

  const validTo =
    section.match(/\|\s*Valid to\s*\|\s*([^|\n]+)\|/i)?.[1]?.trim() ||
    '2026-12-31'

  return {
    documentId: 'rights-maya-2026',
    title: 'Maya Talent Release 2026',
    kind: 'talent_release',
    sourceClause,
    validTo,
    source: 'Maya Talent Release 2026 — Dataset',
  }
}

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
    const raw = await callContextMcp(
      endpoint,
      token,
      'knowledge_base_read',
      {
        knowledgeBase,
        paths: ['source_clauses'],
      },
    )

    return NextResponse.json({
      knowledgeBase,
      queryMode: 'knowledge_base_read',
      entryPath: 'source_clauses',
      evidence: extractPublishedMayaEvidence(raw),
      raw,
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
