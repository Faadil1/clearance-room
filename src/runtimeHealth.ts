import {callContextMcp} from './contextMcp'
import {queryRightsGraph} from './contextGraph'
import {getServerSanity} from './serverSanity'

export type DependencyState = 'available' | 'degraded' | 'unavailable' | 'unverified'

export type RuntimeHealth = {
  overall: 'healthy' | 'degraded'
  checkedAt: string
  dependencies: {
    contextGraph: {
      state: DependencyState
      recovery: string
    }
    knowledgeBase: {
      state: DependencyState
      recovery: string
    }
    contentLakeRead: {
      state: DependencyState
      recovery: string
    }
    contentLakeWrite: {
      state: DependencyState
      recovery: string
      dryRun: boolean
    }
    liveContent: {
      state: 'client_observed'
      recovery: string
    }
  }
}

function evidenceEndpoint() {
  const value = process.env.SANITY_EVIDENCE_MCP_URL
  if (!value) throw new Error('evidence endpoint not configured')
  return value
}

function orgToken() {
  const value = process.env.SANITY_ORGANIZATION_TOKEN
  if (!value) throw new Error('organization token not configured')
  return value
}

async function checkContextGraph(): Promise<DependencyState> {
  try {
    await queryRightsGraph<string | null>(
      'published',
      '*[_type == "usageRequest"][0]._id',
    )
    return 'available'
  } catch {
    return 'unavailable'
  }
}

async function checkKnowledgeBase(): Promise<DependencyState> {
  try {
    await callContextMcp(
      evidenceEndpoint(),
      orgToken(),
      'initial_context',
      {},
    )
    return 'available'
  } catch {
    return 'unavailable'
  }
}

async function checkContentLake() {
  try {
    const client = getServerSanity()
    const document = await client.fetch<{
      _id: string
      title?: string
    } | null>(
      '*[_type == "usageRequest"][0]{_id,title}',
    )

    if (!document) {
      return {
        read: 'available' as DependencyState,
        write: 'unverified' as DependencyState,
      }
    }

    try {
      await client
        .patch(document._id)
        .set({title: document.title || ''})
        .commit({dryRun: true})

      return {
        read: 'available' as DependencyState,
        write: 'available' as DependencyState,
      }
    } catch {
      return {
        read: 'available' as DependencyState,
        write: 'unavailable' as DependencyState,
      }
    }
  } catch {
    return {
      read: 'unavailable' as DependencyState,
      write: 'unavailable' as DependencyState,
    }
  }
}

export async function getRuntimeHealth(): Promise<RuntimeHealth> {
  const [contextGraph, knowledgeBase, contentLake] = await Promise.all([
    checkContextGraph(),
    checkKnowledgeBase(),
    checkContentLake(),
  ])

  const degraded =
    contextGraph !== 'available' ||
    knowledgeBase !== 'available' ||
    contentLake.read !== 'available' ||
    contentLake.write === 'unavailable'

  return {
    overall: degraded ? 'degraded' : 'healthy',
    checkedAt: new Date().toISOString(),
    dependencies: {
      contextGraph: {
        state: contextGraph,
        recovery:
          contextGraph === 'available'
            ? 'none'
            : 'Status computation is fail-closed. Restore Context MCP, then retry the graph read.',
      },
      knowledgeBase: {
        state: knowledgeBase,
        recovery:
          knowledgeBase === 'available'
            ? 'none'
            : 'Deterministic status remains usable; evidence explanation degrades until Knowledge Base recovers.',
      },
      contentLakeRead: {
        state: contentLake.read,
        recovery:
          contentLake.read === 'available'
            ? 'none'
            : 'Do not claim write outcome. Restore Content Lake access and reread before acting.',
      },
      contentLakeWrite: {
        state: contentLake.write,
        recovery:
          contentLake.write === 'available'
            ? 'none'
            : contentLake.write === 'unverified'
              ? 'No usage document exists to dry-run write permission.'
              : 'Disable consequential remediation until write permission recovers.',
        dryRun: true,
      },
      liveContent: {
        state: 'client_observed',
        recovery:
          'If the live stream disconnects, use manual Context MCP scan; never treat stale UI as current.',
      },
    },
  }
}
