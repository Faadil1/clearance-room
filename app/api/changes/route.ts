import {NextResponse} from 'next/server'
import {normalizePerspective} from '../../../src/contextGraph'
import {scanRightsChanges} from '../../../src/productSurface'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const proposedPerspective = normalizePerspective(
      typeof body?.proposedPerspective === 'string' ? body.proposedPerspective : 'drafts',
    )
    return NextResponse.json(await scanRightsChanges(proposedPerspective))
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Rights-change scan failed'},
      {status: 500},
    )
  }
}
