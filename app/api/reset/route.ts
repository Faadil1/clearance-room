import {NextResponse} from 'next/server'
import {
  HERO_BASELINE_PROOF_ID,
  HERO_REMEDIATED_PROOF_ID,
  HERO_USAGE_ID,
} from '../../../src/heroScenario'
import {impactProofId, replacementProofId} from '../../../src/productSurface'
import {getServerSanity} from '../../../src/serverSanity'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const serverSanity = getServerSanity()
  const body = await request.json().catch(() => ({}))
  if (body?.approved !== true) {
    return NextResponse.json(
      {error: 'Explicit approval is required to reset the seeded reproducibility harness'},
      {status: 400},
    )
  }

  try {
    await serverSanity
      .transaction()
      .patch(HERO_USAGE_ID, (patch) => patch.set({isPaid: true}))
      .delete(HERO_BASELINE_PROOF_ID)
      .delete(HERO_REMEDIATED_PROOF_ID)
      .delete(impactProofId(HERO_USAGE_ID))
      .delete(replacementProofId(HERO_USAGE_ID))
      .commit()

    return NextResponse.json({
      reset: true,
      mode: 'seeded-reproducibility-harness',
      restored: {
        usageRequestId: HERO_USAGE_ID,
        isPaid: true,
      },
      observedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Seeded harness reset failed'},
      {status: 500},
    )
  }
}
