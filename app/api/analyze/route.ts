import {NextResponse} from 'next/server'
import {analyzeHeroImpact} from '../../../src/heroScenario'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await analyzeHeroImpact({persist: true})
    return NextResponse.json({
      ...result,
      observedAt: new Date().toISOString(),
      truth: {
        statusAuthority: 'deterministic-evaluator',
        currentPerspective: 'published',
        proposedPerspective: 'drafts',
        proofState: 'persisted',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Impact analysis failed',
      },
      {status: 500},
    )
  }
}
