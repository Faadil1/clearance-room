import {NextResponse} from 'next/server'
import {getRightsEvidence} from '../../../src/evidenceService'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const requestedId =
      typeof body?.documentId === 'string' ? body.documentId : 'rights-maya-2026'

    return NextResponse.json(await getRightsEvidence(requestedId))
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Evidence retrieval failed',
        code: 'EVIDENCE_UNAVAILABLE',
        recovery: 'Status remains deterministic. Retry evidence retrieval after the dependency recovers.',
      },
      {status: 503},
    )
  }
}
