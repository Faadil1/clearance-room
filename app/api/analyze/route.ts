import {NextResponse} from 'next/server'
import {getUsageImpact} from '../../../src/productSurface'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const usageRequestId =
      typeof body?.usageRequestId === 'string' ? body.usageRequestId : 'usage-winter-ca'
    const persist = body?.persist === true

    return NextResponse.json(await getUsageImpact(usageRequestId, persist))
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Impact analysis failed'},
      {status: 500},
    )
  }
}
