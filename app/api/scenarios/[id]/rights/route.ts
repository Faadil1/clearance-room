import {NextResponse} from 'next/server'
import {
  addUserScenarioRight,
  removeUserScenarioRight,
} from '../../../../../src/userScenarios'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{id: string}>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const {id} = await context.params
    const body = await request.json()
    return NextResponse.json(
      await addUserScenarioRight(id, body),
      {status: 201},
    )
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Right creation failed'},
      {status: 400},
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const {id} = await context.params
    const body = await request.json().catch(() => ({}))

    if (body?.approved !== true || typeof body?.rightId !== 'string') {
      return NextResponse.json(
        {error: 'Explicit approval and rightId are required'},
        {status: 400},
      )
    }

    return NextResponse.json(
      await removeUserScenarioRight(id, body.rightId),
    )
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Right removal failed'},
      {status: 400},
    )
  }
}
