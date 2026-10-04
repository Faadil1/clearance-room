import {NextResponse} from 'next/server'
import {scanRightsChanges} from '../../../src/productSurface'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    return NextResponse.json(await scanRightsChanges())
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Rights-change scan failed'},
      {status: 500},
    )
  }
}
