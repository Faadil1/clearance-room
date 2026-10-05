import {NextResponse} from 'next/server'
import {normalizePerspective} from '../../../src/contextGraph'
import {investigateUsageWithAgent} from '../../../src/clearanceAgent'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const usageRequestId =
      typeof body?.usageRequestId === 'string' ? body.usageRequestId : null
    const proposedPerspective = normalizePerspective(
      typeof body?.proposedPerspective === 'string' ? body.proposedPerspective : 'drafts',
    )

    if (!usageRequestId) {
      return NextResponse.json(
        {error: 'usageRequestId is required'},
        {status: 400},
      )
    }

    return NextResponse.json(
      await investigateUsageWithAgent(usageRequestId, proposedPerspective),
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Clearance Agent failed',
        code: 'AGENT_DEPENDENCY_FAILURE',
        recovery: 'No status is emitted when the deterministic graph read fails. Retry after Context MCP recovers.',
      },
      {status: 503},
    )
  }
}
