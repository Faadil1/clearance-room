import {NextResponse} from 'next/server'
import {auditProofIntegrity} from '../../../src/proofAudit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await auditProofIntegrity())
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Proof audit failed',
        code: 'PROOF_AUDIT_UNAVAILABLE',
      },
      {status: 503},
    )
  }
}
