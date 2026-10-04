import {NextResponse} from 'next/server'
import {scanLiveImpacts} from '../../../src/productSurface'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    return NextResponse.json(await scanLiveImpacts())
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Blast-radius scan failed'},
      {status: 500},
    )
  }
}
