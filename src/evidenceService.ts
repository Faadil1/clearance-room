import {callContextMcp} from './contextMcp'
import {queryRightsGraph} from './contextGraph'
import type {Right} from './types'

export type EvidenceRecord = {
  documentId: string
  title: string
  kind: string | null
  channels: string | null
  territories: string | null
  paidAdvertising: string | null
  validFrom: string | null
  validTo: string | null
  sourceClause: string
  source: string
  revision?: string | null
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^{}()|[\]\\]/g, '\\$&')
}

export function canonicalDocumentId(value: string) {
  if (value.startsWith('drafts.')) return value.slice('drafts.'.length)
  return value.replace(/^versions\.[^.]+\./, '')
}

function extractKnowledgeBaseEvidence(raw: string, documentId: string): EvidenceRecord | null {
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

async function getPublishedStructuredEvidence(documentId: string): Promise<EvidenceRecord | null> {
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

export async function getRightsEvidence(requestedDocumentId: string) {
  const endpoint = requiredEnv('SANITY_EVIDENCE_MCP_URL')
  const token = requiredEnv('SANITY_ORGANIZATION_TOKEN')
  const knowledgeBase = process.env.SANITY_KNOWLEDGE_BASE_ID || 'kbjKMGM1H2uf'
  const documentId = canonicalDocumentId(requestedDocumentId)

  const structuredPromise = getPublishedStructuredEvidence(documentId)

  let raw: string | null = null
  let kbError: string | null = null

  try {
    raw = await callContextMcp(endpoint, token, 'knowledge_base_read', {
      knowledgeBase,
      paths: ['source_clauses'],
    })
  } catch (error) {
    kbError = error instanceof Error ? error.message : 'Knowledge Base unavailable'
  }

  const structured = await structuredPromise
  const kbEvidence = raw ? extractKnowledgeBaseEvidence(raw, documentId) : null

  return {
    knowledgeBase,
    requestedDocumentId,
    canonicalDocumentId: documentId,
    kb: kbError
      ? {
          status: 'unavailable' as const,
          evidence: null,
          reason: kbError,
        }
      : kbEvidence
        ? {
            status: 'indexed' as const,
            evidence: kbEvidence,
          }
        : {
            status: 'not_indexed' as const,
            evidence: null,
            reason: 'This rights document is not present in the current Knowledge Base build. No unrelated KB entry will be substituted.',
          },
    structured: structured
      ? {
          status: 'available' as const,
          evidence: structured,
        }
      : {
          status: 'missing' as const,
          evidence: null,
        },
    authority: {
      knowledgeBase: 'evidence-only',
      structuredGraph: 'source-data-only',
      clearanceStatus: 'deterministic-evaluator-only',
    },
    observedAt: new Date().toISOString(),
  }
}
