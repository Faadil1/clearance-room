import {NextResponse} from 'next/server'
import {getRuntimeHealth} from '../../../src/runtimeHealth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getRuntimeHealth())
  } catch {
    return NextResponse.json(
      {
        overall: 'degraded',
        checkedAt: new Date().toISOString(),
        code: 'HEALTH_CHECK_FAILED',
      },
      {status: 503},
    )
  }
}
