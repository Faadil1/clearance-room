import {NextResponse} from 'next/server'
import {
  HERO_BASELINE_PROOF_ID,
  HERO_REMEDIATED_PROOF_ID,
  HERO_USAGE_ID,
} from '../../../src/heroScenario'
import {getServerSanity} from '../../../src/serverSanity'

export const dynamic = 'force-dynamic'

const HOLIDAY_USAGE_ID = 'usage-holiday-ca'
const DRAFT_MAYA_ID = 'drafts.rights-maya-2026'

export async function POST(request: Request) {
  const serverSanity = getServerSanity()
  const body = await request.json().catch(() => ({}))
  if (body?.approved !== true) {
    return NextResponse.json(
      {error: 'Explicit approval is required to restore the canonical seeded scenario'},
      {status: 400},
    )
  }

  try {
    const proofIds = await serverSanity.fetch<string[]>(
      `*[_type == "clearanceProof" && usageRequest._ref in $ids]._id`,
      {ids: [HERO_USAGE_ID, HOLIDAY_USAGE_ID]},
    )

    let transaction = serverSanity
      .transaction()
      .patch(HERO_USAGE_ID, (patch) =>
        patch.set({
          isPaid: true,
          startDate: '2026-10-15',
          endDate: '2026-11-30',
        }),
      )
      .patch(HOLIDAY_USAGE_ID, (patch) =>
        patch.set({
          isPaid: true,
          startDate: '2026-10-15',
          endDate: '2026-11-30',
        }),
      )
      .patch(DRAFT_MAYA_ID, (patch) =>
        patch.set({
          paidAdvertisingAllowed: false,
          allowedTerritories: ['CA', 'US'],
          allowedChannels: ['instagram_reels', 'organic_social'],
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          sourceClause: 'Draft amendment: organic social only. Paid amplification is not permitted.',
        }),
      )
      .delete(HERO_BASELINE_PROOF_ID)
      .delete(HERO_REMEDIATED_PROOF_ID)

    for (const proofId of proofIds) {
      transaction = transaction.delete(proofId)
    }

    await transaction.commit()

    return NextResponse.json({
      reset: true,
      mode: 'canonical-seeded-reproducibility-harness',
      restored: {
        usages: [
          {id: HERO_USAGE_ID, isPaid: true, endDate: '2026-11-30'},
          {id: HOLIDAY_USAGE_ID, isPaid: true, endDate: '2026-11-30'},
        ],
        draftRights: {
          id: DRAFT_MAYA_ID,
          paidAdvertisingAllowed: false,
        },
        deletedProofs: proofIds.length,
      },
      expectedBlastRadius: {
        affectedUsageRequests: 2,
        primaryChangedAxis: 'paid',
      },
      observedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Canonical scenario restore failed'},
      {status: 500},
    )
  }
}
