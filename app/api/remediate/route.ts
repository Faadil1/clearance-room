import {NextResponse} from 'next/server'
import {proofDocument} from '../../../src/proof'
import {
  getUsageImpact,
  impactProofId,
  replacementProofId,
} from '../../../src/productSurface'
import {getServerSanity} from '../../../src/serverSanity'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let phase:
    | 'validation'
    | 'baseline'
    | 'transaction'
    | 'post_commit_recompile'
    | 'replacement_proof' = 'validation'
  let usageRequestId: string | null = null
  let effectiveBaselineId: string | null = null
  let recoveryKey: string | null = null

  try {
    const client = getServerSanity()
    const body = await request.json().catch(() => ({}))

    if (body?.approved !== true) {
      return NextResponse.json(
        {error: 'Explicit human approval is required before mutation'},
        {status: 400},
      )
    }

    usageRequestId =
      typeof body?.usageRequestId === 'string' ? body.usageRequestId : null
    const repairId =
      typeof body?.repairId === 'string' ? body.repairId : null
    const baselineId =
      typeof body?.baselineProofId === 'string' ? body.baselineProofId : null

    if (!usageRequestId || !repairId) {
      return NextResponse.json(
        {error: 'usageRequestId and repairId are required'},
        {status: 400},
      )
    }

    phase = 'baseline'
    effectiveBaselineId = baselineId
    let baseline = effectiveBaselineId
      ? await client.getDocument<any>(effectiveBaselineId)
      : null

    if (!baseline) {
      const snapshot = await getUsageImpact(usageRequestId, true, 'drafts')
      effectiveBaselineId = snapshot.persistedProof?.id || null
      baseline = effectiveBaselineId
        ? await client.getDocument<any>(effectiveBaselineId)
        : null
    }

    if (!baseline || !effectiveBaselineId) {
      return NextResponse.json(
        {error: 'Could not create the approval-time baseline proof snapshot'},
        {status: 409},
      )
    }

    if (baseline.usageRequest?._ref !== usageRequestId) {
      return NextResponse.json(
        {error: 'The supplied proof does not belong to this usage request'},
        {status: 409},
      )
    }

    if (baseline.isStale) {
      return NextResponse.json(
        {error: 'The baseline proof is already stale. Reconcile or reopen the impact before another repair.'},
        {status: 409},
      )
    }

    const before = await getUsageImpact(usageRequestId, false, 'drafts')
    const repair = before.repairs.find((option) => option.id === repairId)
    if (!repair) {
      return NextResponse.json(
        {error: 'That remediation is not justified by the currently observed findings'},
        {status: 409},
      )
    }

    recoveryKey = crypto.randomUUID()
    const approvedMutationValue = String(repair.mutation.value)

    phase = 'transaction'
    let transaction = client
      .transaction()
      .patch(effectiveBaselineId, (patch) =>
        patch.set({
          isStale: true,
          staleReason: 'HUMAN_APPROVED_USAGE_REQUEST_MUTATION',
          approvedAction: repair.id,
          approvedMutationField: repair.mutation.field,
          approvedMutationValue,
          approvedAt: new Date().toISOString(),
          recoveryKey,
        }),
      )

    if (repair.id === 'switch_to_organic') {
      transaction = transaction.patch(usageRequestId, (patch) => patch.set({isPaid: false}))
    } else if (repair.id === 'shorten_campaign') {
      transaction = transaction.patch(
        usageRequestId,
        (patch) => patch.set({endDate: repair.mutation.value}),
      )
    }

    await transaction.commit({visibility: 'sync'})

    phase = 'post_commit_recompile'
    const after = await getUsageImpact(usageRequestId, false, 'drafts')
    const replacementId = replacementProofId(usageRequestId)
    const graphClient = getServerSanity()
    const proposedGraph = await graphClient.fetch<any>(
      `*[_type == "usageRequest" && _id == $id][0]{
        _id,_rev,title,territory,channel,isPaid,startDate,endDate,
        asset->{_id,_rev,title,rights[]->{_id,_rev,_originalId,title,kind,allowedTerritories,allowedChannels,paidAdvertisingAllowed,validFrom,validTo,sourceClause}}
      }`,
      {id: usageRequestId},
      {perspective: 'drafts'},
    )

    phase = 'replacement_proof'
    const replacement = await client.create(
      proofDocument(replacementId, proposedGraph, after.proposed, {
        perspective: 'drafts',
        supersedes: effectiveBaselineId,
      }),
    )

    return NextResponse.json({
      action: repair.id,
      label: repair.label,
      approved: true,
      recoveryKey,
      usageRequestId,
      mutation: repair.mutation,
      previousProof: {
        id: effectiveBaselineId,
        status: before.proposed.status,
        stale: true,
      },
      newProof: {
        id: replacement._id,
        rev: replacement._rev,
        status: after.proposed.status,
        stale: false,
        supersedes: effectiveBaselineId,
      },
      recompiled: after.proposed,
      remainingRepairs: after.repairs,
      observedAt: new Date().toISOString(),
      truth: {
        mutationBoundary: 'explicit-human-approval',
        statusAuthority: 'deterministic-evaluator',
        writeProtocol: 'atomic-business-mutation_then_recompile_then_superseding-proof',
      },
    })
  } catch (error) {
    const postCommit = phase === 'post_commit_recompile' || phase === 'replacement_proof'
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Remediation failed',
        code: postCommit
          ? 'WRITE_COMMITTED_RECONCILIATION_REQUIRED'
          : phase === 'transaction'
            ? 'WRITE_OUTCOME_UNKNOWN'
            : 'REMEDIATION_FAILED',
        phase,
        usageRequestId,
        baselineProofId: effectiveBaselineId,
        recoveryKey,
        retrySafe: false,
        recovery: postCommit
          ? 'The business transaction completed before this failure. Reconcile the write outcome; do not repeat the mutation.'
          : phase === 'transaction'
            ? 'Do not retry blindly. Reconcile the baseline proof and usage state first.'
            : 'No consequential write was attempted.',
      },
      {status: 503},
    )
  }
}
