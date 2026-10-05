import {generateText} from 'ai'
import {createContentAgent} from 'content-agent'
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
  aiNarrative: {
    status: 'generated' | 'not_configured' | 'rejected' | 'unavailable'
    text: string | null
    provider: 'sanity-content-agent'
  }
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
    aiNarrative: {
      status: 'not_configured',
      text: null,
      provider: 'sanity-content-agent',
    },
    observedAt: new Date().toISOString(),
  }
}


const STATUS_WORDS = ['CLEAR', 'BLOCK', 'REVIEW', 'UNKNOWN'] as const

export function aiNarrativeRespectsReceipt(
  narrative: string,
  current: Status,
  proposed: Status,
) {
  const allowed = new Set<Status>([current, proposed])
  const mentioned = STATUS_WORDS.filter((status) =>
    new RegExp(`\\b${status}\\b`, 'i').test(narrative),
  )
  return mentioned.every((status) => allowed.has(status))
}

async function generateSanityNarrative(
  brief: ClearanceAgentBrief,
): Promise<ClearanceAgentBrief['aiNarrative']> {
  const organizationId = process.env.SANITY_ORGANIZATION_ID
  const token = process.env.SANITY_API_TOKEN

  if (!organizationId || !token) {
    return {
      status: 'not_configured',
      text: null,
      provider: 'sanity-content-agent',
    }
  }

  try {
    const provider = createContentAgent({organizationId, token})
    const model = provider.agent(`clearance-room-${brief.usageRequestId}-${Date.now()}`, {
      config: {
        instruction: [
          'You are the explanation layer for Clearance Room.',
          'Use only the receipt and evidence included in the user prompt.',
          'The deterministic receipt is the sole authority for CLEAR, BLOCK, REVIEW, or UNKNOWN.',
          'Never invent another status.',
          'Never propose a repair that is absent from repairOptions.',
          'Never claim a mutation happened.',
          'If abstention.active is true, explain the missing evidence and stop.',
        ].join(' '),
        capabilities: {
          read: false,
          write: false,
        },
      },
    })

    const {text} = await generateText({
      model,
      prompt: JSON.stringify({
        statusReceipt: brief.statusReceipt,
        findings: brief.findings,
        evidence: brief.evidence,
        repairOptions: brief.repairOptions,
        abstention: brief.abstention,
      }),
    })

    const narrative = text?.trim()
    if (!narrative) {
      return {
        status: 'unavailable',
        text: null,
        provider: 'sanity-content-agent',
      }
    }

    if (!aiNarrativeRespectsReceipt(
      narrative,
      brief.statusReceipt.current,
      brief.statusReceipt.proposed,
    )) {
      return {
        status: 'rejected',
        text: null,
        provider: 'sanity-content-agent',
      }
    }

    return {
      status: 'generated',
      text: narrative,
      provider: 'sanity-content-agent',
    }
  } catch {
    return {
      status: 'unavailable',
      text: null,
      provider: 'sanity-content-agent',
    }
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

  const brief = composeAgentBrief(impact, evidence)
  const aiNarrative = await generateSanityNarrative(brief)
  return {
    ...brief,
    aiNarrative,
    toolTrace: [
      ...brief.toolTrace,
      {
        tool: 'Sanity Content Agent',
        purpose: 'operator-facing AI explanation of deterministic receipts',
        authority: 'explanation only; no status or write authority',
        result: aiNarrative.status === 'generated'
          ? 'ok'
          : aiNarrative.status === 'rejected'
            ? 'partial'
            : 'unavailable',
      },
    ],
  }
}
