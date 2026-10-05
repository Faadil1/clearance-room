import {proofDocument} from './proof'
import {getUsageImpact} from './productSurface'
import {getServerSanity} from './serverSanity'

type RecoveryState =
  | 'ALREADY_COMPLETE'
  | 'NO_COMMITTED_WRITE_OBSERVED'
  | 'WRITE_STATE_CONFLICT'
  | 'WAIT_FOR_CONTEXT_VISIBILITY'
  | 'RECOVERED'

function mutationMatches(
  usage: Record<string, unknown>,
  field: string | undefined,
  value: string | undefined,
) {
  if (!field || value == null) return false
  if (field === 'isPaid') return String(Boolean(usage[field])) === value
  return String(usage[field] ?? '') === value
}

function recoveryProofId(baselineProofId: string) {
  return `proof-recovered-${baselineProofId}`.slice(0, 120)
}

export async function reconcileRemediationOutcome(
  usageRequestId: string,
  baselineProofId: string,
) {
  const client = getServerSanity()

  const [baseline, existingReplacement] = await Promise.all([
    client.getDocument<any>(baselineProofId),
    client.fetch<any | null>(
      '*[_type == "clearanceProof" && supersedes._ref == $baseline][0]{_id,_rev,status,isStale,"supersedes":supersedes._ref}',
      {baseline: baselineProofId},
    ),
  ])

  if (!baseline) {
    throw new Error('Baseline proof was not found')
  }

  if (baseline.usageRequest?._ref !== usageRequestId) {
    throw new Error('Baseline proof does not belong to this usage request')
  }

  if (existingReplacement) {
    return {
      state: 'ALREADY_COMPLETE' as RecoveryState,
      usageRequestId,
      baselineProofId,
      replacementProof: existingReplacement,
      observedAt: new Date().toISOString(),
    }
  }

  if (!baseline.isStale) {
    return {
      state: 'NO_COMMITTED_WRITE_OBSERVED' as RecoveryState,
      usageRequestId,
      baselineProofId,
      action: 'Re-open the impact and request a fresh human approval. Do not retry the previous request blindly.',
      observedAt: new Date().toISOString(),
    }
  }

  const usage = await client.getDocument<Record<string, unknown>>(usageRequestId)
  if (!usage) throw new Error('Usage request was not found')

  if (!mutationMatches(
    usage,
    baseline.approvedMutationField,
    baseline.approvedMutationValue,
  )) {
    return {
      state: 'WRITE_STATE_CONFLICT' as RecoveryState,
      usageRequestId,
      baselineProofId,
      expected: {
        field: baseline.approvedMutationField || null,
        value: baseline.approvedMutationValue || null,
      },
      observed: baseline.approvedMutationField
        ? usage[baseline.approvedMutationField] ?? null
        : null,
      action: 'Escalate for operator review. Do not auto-retry or fabricate a replacement proof.',
      observedAt: new Date().toISOString(),
    }
  }

  const impact = await getUsageImpact(usageRequestId, false, 'drafts')
  const contextUsage = impact.usage as unknown as Record<string, unknown>

  if (!mutationMatches(
    contextUsage,
    baseline.approvedMutationField,
    baseline.approvedMutationValue,
  )) {
    return {
      state: 'WAIT_FOR_CONTEXT_VISIBILITY' as RecoveryState,
      usageRequestId,
      baselineProofId,
      action: 'The Content Lake mutation is observed but Context MCP has not yet reflected it. Retry reconciliation after visibility catches up.',
      observedAt: new Date().toISOString(),
    }
  }

  const graph = await client.fetch<any>(
    `*[_type == "usageRequest" && _id == $id][0]{
      _id,_rev,title,territory,channel,isPaid,startDate,endDate,
      asset->{_id,_rev,title,rights[]->{_id,_rev,_originalId,title,kind,allowedTerritories,allowedChannels,paidAdvertisingAllowed,validFrom,validTo,sourceClause}}
    }`,
    {id: usageRequestId},
    {perspective: 'drafts'},
  )

  const id = recoveryProofId(baselineProofId)
  const replacement = await client.createIfNotExists(
    proofDocument(id, graph, impact.proposed, {
      perspective: 'drafts',
      supersedes: baselineProofId,
    }),
  )

  return {
    state: 'RECOVERED' as RecoveryState,
    usageRequestId,
    baselineProofId,
    approvedAction: baseline.approvedAction || null,
    recoveryKey: baseline.recoveryKey || null,
    replacementProof: {
      id: replacement._id,
      rev: replacement._rev,
      status: impact.proposed.status,
      stale: false,
      supersedes: baselineProofId,
    },
    truth: {
      businessMutation: 'observed',
      statusAuthority: 'deterministic-evaluator',
      recoveryAction: 'audit-proof-only',
    },
    observedAt: new Date().toISOString(),
  }
}
