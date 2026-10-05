import {NextResponse} from 'next/server'
import {
  deleteUserScenario,
  updateUserScenario,
} from '../../../../src/userScenarios'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{id: string}>
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const {id} = await context.params
    const body = await request.json()
    return NextResponse.json(await updateUserScenario(id, body))
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Scenario update failed'},
      {status: 400},
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const {id} = await context.params
    const body = await request.json().catch(() => ({}))

    if (body?.approved !== true) {
      return NextResponse.json(
        {error: 'Explicit approval is required before deleting a user scenario'},
        {status: 400},
      )
    }

    return NextResponse.json(await deleteUserScenario(id))
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Scenario deletion failed'},
      {status: 400},
    )
  }
}
