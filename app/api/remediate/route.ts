import {NextResponse} from 'next/server'
import {compileClearance} from '../../../src/compiler.js'
import {
  getHeroGraphs,
  HERO_BASELINE_PROOF_ID,
  HERO_REMEDIATED_PROOF_ID,
  HERO_USAGE_ID,
} from '../../../src/heroScenario.js'
import {proofDocument} from '../../../src/proof.js'
import {serverSanity} from '../../../src/serverSanity.js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (body?.approved !== true) {
      return NextResponse.json(
        {error: 'Explicit human approval is required before mutation'},
        {status: 400},
      )
    }

    const baseline = await serverSanity.getDocument<any>(HERO_BASELINE_PROOF_ID)
    if (!baseline) {
      return NextResponse.json(
        {error: 'Run impact analysis before approving remediation'},
        {status: 409},
      )
    }

    if (baseline.isStale) {
      return NextResponse.json(
        {error: 'The baseline proof is already stale. Reset the demo before replaying.'},
        {status: 409},
      )
    }

    const {drafts: beforeGraph} = await getHeroGraphs()
    const before = compileClearance(beforeGraph)

    if (before.status !== 'BLOCK') {
      return NextResponse.json(
        {
          error: `Expected BLOCK before remediation, observed ${before.status}. Reset the hero scenario first.`,
        },
        {status: 409},
      )
    }

    await serverSanity
      .transaction()
      .patch(HERO_BASELINE_PROOF_ID, (patch) =>
        patch.set({
          isStale: true,
          staleReason: 'HUMAN_APPROVED_USAGE_REQUEST_MUTATION',
        }),
      )
      .patch(HERO_USAGE_ID, (patch) => patch.set({isPaid: false}))
      .commit()

    const {drafts: afterGraph} = await getHeroGraphs()
    const after = compileClearance(afterGraph)

    if (after.status !== 'CLEAR') {
      throw new Error(`Post-mutation recompile expected CLEAR, observed ${after.status}`)
    }

    const replacement = await serverSanity.createOrReplace(
      proofDocument(HERO_REMEDIATED_PROOF_ID, afterGraph, after, {
        perspective: 'drafts',
        supersedes: HERO_BASELINE_PROOF_ID,
      }),
    )

    return NextResponse.json({
      action: 'switch_campaign_to_organic',
      approved: true,
      mutation: {
        usageRequestId: HERO_USAGE_ID,
        field: 'isPaid',
        from: true,
        to: false,
      },
      previousProof: {
        id: HERO_BASELINE_PROOF_ID,
        status: before.status,
        stale: true,
      },
      newProof: {
        id: replacement._id,
        rev: replacement._rev,
        status: after.status,
        stale: false,
        supersedes: HERO_BASELINE_PROOF_ID,
      },
      recompiled: after,
      observedAt: new Date().toISOString(),
      truth: {
        mutationBoundary: 'explicit-human-approval',
        statusAuthority: 'deterministic-evaluator',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Remediation failed',
      },
      {status: 500},
    )
  }
}
