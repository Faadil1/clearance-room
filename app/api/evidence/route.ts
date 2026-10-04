import {NextResponse} from 'next/server'
import {callContextMcp} from '../../../src/contextMcp'

export const dynamic = 'force-dynamic'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^{}()|[\]\\]/g, '\\$&')
}

function extractEvidence(raw: string, documentId: string) {
  const escaped = escapeRegExp(documentId)
  const section =
    raw.match(new RegExp(`##\\s+${escaped}[^\\n]*\\n[\\s\\S]*?(?=\\n---|\\n##\\s+rights-|$)`))?.[0] ||
    raw

  const title =
    section.match(new RegExp(`##\\s+${escaped}\\s+[—-]\\s+([^\\n]+)`))?.[1]?.trim() ||
    documentId

  const sourceClause =
    section.match(/>\s*"?([^"\n]+)"?/)?.[1]?.trim() ||
    'No source clause was extracted from the Knowledge Base entry.'

  const tableValue = (label: string) =>
    section.match(new RegExp(`\\|\\s*${label}\\s*\\|\\s*([^|\\n]+)\\|`, 'i'))?.[1]?.trim() || null

  return {
    documentId,
    title,
    kind: tableValue('Kind'),
    channels: tableValue('Allowed channels?'),
    territories: tableValue('Allowed territories?'),
    paidAdvertising: tableValue('Paid advertising'),
    validFrom: tableValue('Valid from'),
    validTo: tableValue('Valid to'),
    sourceClause,
    source: `${title} — Dataset`,
  }
}

export async function POST(request: Request) {
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
    const body = await request.json().catch(() => ({}))
    const documentId =
      typeof body?.documentId === 'string' ? body.documentId : 'rights-maya-2026'

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
      evidence: extractEvidence(raw, documentId),
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
