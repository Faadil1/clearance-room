import {getRightsEvidence} from './evidenceService'
import type {ContentPerspective} from './contextGraph'
import {getUsageImpact} from './productSurface'
import type {Status} from './types'

type ImpactLike = Awaited<ReturnType<typeof getUsageImpact>>

export type AgentEvidenceItem = {
  requestedDocumentId: string
  kbStatus: 'indexed' | 'not_indexed' | 'unavailable'
  sourceStatus: 'available' | 'missing'
  sourceClause: string | null
  source: string | null
}

export type ClearanceAgentBrief = {
  mode: 'bounded-tool-agent'
  usageRequestId: string
  statusReceipt: {
    current: Status
    proposed: Status
    authority: 'deterministic-evaluator'
  }
  summary: string
  findings: ImpactLike['proposed']['findings']
  evidence: AgentEvidenceItem[]
  repairOptions: ImpactLike['repairs']
  abstention: {
    active: boolean
    reason: string | null
  }
  nextAction: string
  toolTrace: Array<{
    tool: string
    purpose: string
    authority: string
    result: 'ok' | 'partial' | 'unavailable'
  }>
  writeAuthority: 'NONE'
  observedAt: string
}

export function composeAgentBrief(
  impact: ImpactLike,
  evidence: AgentEvidenceItem[],
): ClearanceAgentBrief {
  const proposed = impact.proposed.status
  const nonClear = impact.proposed.findings.filter((finding) => finding.status !== 'CLEAR')

  const abstain = proposed === 'UNKNOWN'
  const summary =
    proposed === 'CLEAR'
      ? 'The proposed rights state does not create a clearance issue for this usage.'
      : proposed === 'BLOCK'
        ? `The proposed rights state blocks this usage on ${nonClear.map((finding) => finding.axis).join(', ')}.`
        : proposed === 'REVIEW'
          ? `The proposed rights state requires review on ${nonClear.map((finding) => finding.axis).join(', ')}.`
          : 'Clearance cannot be determined because required structured evidence is missing.'

  const nextAction =
    abstain
      ? 'Complete the missing structured rights evidence, then recompile. Do not infer permission.'
      : impact.repairs.length
        ? 'Review the supported remediation options. Any consequential mutation still requires explicit human approval.'
        : proposed === 'CLEAR'
          ? 'No remediation is required. Continue monitoring the rights graph for later invalidation.'
          : 'Escalate for human review; the bounded agent has no supported structured remediation for this finding.'

  return {
    mode: 'bounded-tool-agent',
    usageRequestId: impact.usage.id,
    statusReceipt: {
      current: impact.current.status,
      proposed: impact.proposed.status,
      authority: 'deterministic-evaluator',
    },
    summary,
    findings: impact.proposed.findings,
    evidence,
    repairOptions: impact.repairs,
    abstention: {
      active: abstain,
      reason: abstain ? 'Required structured evidence is missing. The agent must not guess.' : null,
    },
    nextAction,
    toolTrace: [
      {
        tool: 'Sanity Context MCP',
        purpose: 'published/drafts rights graph retrieval',
        authority: 'read-only evidence input',
        result: 'ok',
      },
      {
        tool: 'Deterministic Clearance Evaluator',
        purpose: 'CLEAR/BLOCK/REVIEW/UNKNOWN computation',
        authority: 'sole status authority',
        result: 'ok',
      },
      {
        tool: 'Sanity Context Knowledge Base',
        purpose: 'source-clause grounding',
        authority: 'evidence only',
        result: evidence.some((item) => item.kbStatus === 'unavailable')
          ? 'unavailable'
          : evidence.some((item) => item.kbStatus !== 'indexed')
            ? 'partial'
            : 'ok',
      },
      {
        tool: 'Remediation Registry',
        purpose: 'supported repair derivation',
        authority: 'proposal only; no write authority',
        result: 'ok',
      },
    ],
    writeAuthority: 'NONE',
    observedAt: new Date().toISOString(),
  }
}

export async function investigateUsageWithAgent(
  usageRequestId: string,
  proposedPerspective: ContentPerspective = 'drafts',
): Promise<ClearanceAgentBrief> {
  const impact = await getUsageImpact(usageRequestId, false, proposedPerspective)
  const causalIds = [...new Set(impact.causalRights.map((right) => right.id))]

  const evidence = await Promise.all(
    causalIds.map(async (rightId): Promise<AgentEvidenceItem> => {
      try {
        const result = await getRightsEvidence(rightId)
        const source = result.kb.evidence || result.structured.evidence
        return {
          requestedDocumentId: rightId,
          kbStatus: result.kb.status,
          sourceStatus: result.structured.status,
          sourceClause: source?.sourceClause || null,
          source: source?.source || null,
        }
      } catch {
        return {
          requestedDocumentId: rightId,
          kbStatus: 'unavailable',
          sourceStatus: 'missing',
          sourceClause: null,
          source: null,
        }
      }
    }),
  )

  return composeAgentBrief(impact, evidence)
}
