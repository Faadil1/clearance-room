import {NextResponse} from 'next/server'
import {callContextMcp} from '../../../src/contextMcp'
import {queryRightsGraph} from '../../../src/contextGraph'
import type {Right} from '../../../src/types'

export const dynamic = 'force-dynamic'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^{}()|[\]\\]/g, '\\$&')
}

function canonicalDocumentId(value: string) {
  return value.startsWith('drafts.') ? value.slice('drafts.'.length) : value
}

function extractKnowledgeBaseEvidence(raw: string, documentId: string) {
  const escaped = escapeRegExp(documentId)
  const match = raw.match(
    new RegExp(`##\\s+${escaped}[^\\n]*\\n[\\s\\S]*?(?=\\n---|\\n##\\s+rights-|$)`),
  )

  if (!match) return null

  const section = match[0]
  const title =
    section.match(new RegExp(`##\\s+${escaped}\\s+[—-]\\s+([^\\n]+)`))?.[1]?.trim() ||
    documentId

  const sourceClause =
    section.match(/>\s*"?([^"\n]+)"?/)?.[1]?.trim() ||
    'No source clause was extracted from this Knowledge Base entry.'

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
    source: `${title} — Knowledge Base / Dataset`,
  }
}

async function getPublishedStructuredEvidence(documentId: string) {
  const query = `*[_type == "rightsDocument" && _id == ${JSON.stringify(documentId)}][0]{
    _id,
    _rev,
    title,
    kind,
    allowedTerritories,
    allowedChannels,
    paidAdvertisingAllowed,
    validFrom,
    validTo,
    sourceClause
  }`

  const right = await queryRightsGraph<Right | null>('published', query)
  if (!right) return null

  return {
    documentId: right._id,
    title: right.title,
    kind: right.kind,
    channels: right.allowedChannels?.join(', ') || null,
    territories: right.allowedTerritories?.join(', ') || null,
    paidAdvertising:
      typeof right.paidAdvertisingAllowed === 'boolean'
        ? right.paidAdvertisingAllowed ? 'Permitted' : 'Not permitted'
        : null,
    validFrom: right.validFrom || null,
    validTo: right.validTo || null,
    sourceClause: right.sourceClause || 'No structured source clause is present.',
    source: `${right.title} — live published rights graph`,
    revision: right._rev || null,
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
    const requestedId =
      typeof body?.documentId === 'string' ? body.documentId : 'rights-maya-2026'
    const documentId = canonicalDocumentId(requestedId)

    const [raw, structured] = await Promise.all([
      callContextMcp(
        endpoint,
        token,
        'knowledge_base_read',
        {
          knowledgeBase,
          paths: ['source_clauses'],
        },
      ),
      getPublishedStructuredEvidence(documentId),
    ])

    const kbEvidence = extractKnowledgeBaseEvidence(raw, documentId)

    return NextResponse.json({
      knowledgeBase,
      queryMode: 'knowledge_base_read',
      entryPath: 'source_clauses',
      requestedDocumentId: requestedId,
      canonicalDocumentId: documentId,
      kb: kbEvidence
        ? {
            status: 'indexed',
            evidence: kbEvidence,
          }
        : {
            status: 'not_indexed',
            evidence: null,
            reason: 'This rights document is not present in the current Knowledge Base build. No unrelated KB entry will be substituted.',
          },
      structured: structured
        ? {
            status: 'available',
            evidence: structured,
          }
        : {
            status: 'missing',
            evidence: null,
          },
      authority: {
        knowledgeBase: 'evidence-only',
        structuredGraph: 'source-data-only',
        clearanceStatus: 'deterministic-evaluator-only',
      },
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
