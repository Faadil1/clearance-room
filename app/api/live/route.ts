import {getServerSanity} from '../../../src/serverSanity'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const client = getServerSanity()
  const encoder = new TextEncoder()
  let subscription: {unsubscribe: () => void} | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: Record<string, unknown>) => {
        if (closed) return
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        )
      }

      send({
        type: 'connecting',
        integration: 'sanity-live-content-api',
        includeDrafts: true,
        observedAt: new Date().toISOString(),
      })

      subscription = client.live
        .events({includeDrafts: true})
        .subscribe({
          next: (event: any) => {
            send({
              type: event.type,
              id: event.id || null,
              tags: Array.isArray(event.tags) ? event.tags : [],
              integration: 'sanity-live-content-api',
              observedAt: new Date().toISOString(),
            })
          },
          error: (error: unknown) => {
            send({
              type: 'error',
              message: error instanceof Error ? error.message : 'Live Content API stream failed',
              observedAt: new Date().toISOString(),
            })
          },
        })

      heartbeat = setInterval(() => {
        send({
          type: 'heartbeat',
          integration: 'sanity-live-content-api',
          observedAt: new Date().toISOString(),
        })
      }, 15000)
    },
    cancel() {
      closed = true
      subscription?.unsubscribe()
      if (heartbeat) clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
