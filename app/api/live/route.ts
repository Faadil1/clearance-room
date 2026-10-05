import {getServerSanity} from '../../../src/serverSanity'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const client = getServerSanity()
  const encoder = new TextEncoder()
  let subscription: {unsubscribe: () => void} | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null
  let lifespan: ReturnType<typeof setTimeout> | null = null
  let closed = false

  const cleanup = () => {
    if (closed) return
    closed = true
    subscription?.unsubscribe()
    if (heartbeat) clearInterval(heartbeat)
    if (lifespan) clearTimeout(lifespan)
  }

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

      // Vercel functions have a finite execution window. Rotate the SSE
      // connection before the platform timeout so EventSource reconnects
      // normally instead of surfacing a runtime timeout as a product outage.
      lifespan = setTimeout(() => {
        send({
          type: 'reconnect',
          reason: 'runtime-rotation',
          integration: 'sanity-live-content-api',
          observedAt: new Date().toISOString(),
        })
        cleanup()
        try {
          controller.close()
        } catch {
          // The client may already have disconnected.
        }
      }, 240000)
    },
    cancel() {
      cleanup()
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
