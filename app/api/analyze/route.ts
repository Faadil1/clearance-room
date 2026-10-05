import {NextResponse} from 'next/server'
import {normalizePerspective} from '../../../src/contextGraph'
import {getUsageImpact} from '../../../src/productSurface'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const usageRequestId =
      typeof body?.usageRequestId === 'string' ? body.usageRequestId : 'usage-winter-ca'
    const persist = body?.persist === true
    const proposedPerspective = normalizePerspective(
      typeof body?.proposedPerspective === 'string' ? body.proposedPerspective : 'drafts',
    )

    return NextResponse.json(
      await getUsageImpact(usageRequestId, persist, proposedPerspective),
    )
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Impact analysis failed'},
      {status: 500},
    )
  }
}
