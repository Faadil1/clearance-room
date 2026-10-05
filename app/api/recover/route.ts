import {NextResponse} from 'next/server'
import {reconcileRemediationOutcome} from '../../../src/remediationRecovery'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (body?.approved !== true) {
      return NextResponse.json(
        {error: 'Explicit operator confirmation is required before audit recovery'},
        {status: 400},
      )
    }

    const usageRequestId =
      typeof body?.usageRequestId === 'string' ? body.usageRequestId : null
    const baselineProofId =
      typeof body?.baselineProofId === 'string' ? body.baselineProofId : null

    if (!usageRequestId || !baselineProofId) {
      return NextResponse.json(
        {error: 'usageRequestId and baselineProofId are required'},
        {status: 400},
      )
    }

    return NextResponse.json(
      await reconcileRemediationOutcome(usageRequestId, baselineProofId),
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Remediation recovery failed',
        code: 'RECOVERY_FAILED',
        recovery: 'Do not retry the business mutation. Inspect current usage and proof state first.',
      },
      {status: 503},
    )
  }
}
