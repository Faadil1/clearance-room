import {NextResponse} from 'next/server'
import {
  createUserScenario,
  listUserScenarios,
} from '../../../src/userScenarios'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json({
      scenarios: await listUserScenarios(),
      observedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Scenario list failed'},
      {status: 500},
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const scenario = await createUserScenario(body)

    return NextResponse.json(
      {
        scenario,
        truth: {
          storage: 'sanity-content-lake',
          currentState: 'published-rights-document',
          proposedState: 'draft-rights-document',
          liveInvalidation: 'sanity-live-content-api',
          graphRead: 'sanity-context-mcp',
        },
      },
      {status: 201},
    )
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Scenario creation failed'},
      {status: 400},
    )
  }
}
