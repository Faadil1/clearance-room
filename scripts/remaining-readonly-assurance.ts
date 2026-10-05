import {scanLiveImpacts} from '../src/productSurface'
import {EMPTY_IMPACT_FILTERS, filterImpacts} from '../src/portfolioFilters'
import {getServerSanity} from '../src/serverSanity'

type CheckState = 'PROVEN_RUNTIME' | 'BLOCKED'

function includesUsage(
  impacts: Awaited<ReturnType<typeof scanLiveImpacts>>['impacts'],
  usageId: string,
) {
  return impacts.some((impact) => impact.usage.id === usageId)
}

async function main() {
  const portfolio = await scanLiveImpacts('drafts')
  const target = portfolio.impacts.find((impact) =>
    impact.usage.id.startsWith('usage-user-'),
  ) || portfolio.impacts[0]

  if (!target) {
    console.log(JSON.stringify({
      assurance: 'CLEARANCE_ROOM_REMAINING_READONLY_ASSURANCE_V1',
      result: 'BLOCKED',
      reason: 'NO_USAGE_REQUESTS_AVAILABLE',
    }, null, 2))
    process.exitCode = 2
    return
  }

  const searchResult = filterImpacts(portfolio.impacts, {
    ...EMPTY_IMPACT_FILTERS,
    search: target.usage.id,
  })
  const statusResult = filterImpacts(portfolio.impacts, {
    ...EMPTY_IMPACT_FILTERS,
    status: target.proposedStatus,
  })
  const territoryResult = filterImpacts(portfolio.impacts, {
    ...EMPTY_IMPACT_FILTERS,
    territory: target.usage.territory,
  })
  const channelResult = filterImpacts(portfolio.impacts, {
    ...EMPTY_IMPACT_FILTERS,
    channel: target.usage.channel,
  })

  const filterChecks = {
    freeText: {
      state: includesUsage(searchResult, target.usage.id)
        ? 'PROVEN_RUNTIME' as CheckState
        : 'BLOCKED' as CheckState,
      targetUsage: target.usage.id,
      visibleCount: searchResult.length,
    },
    proposedStatus: {
      state: includesUsage(statusResult, target.usage.id)
        ? 'PROVEN_RUNTIME' as CheckState
        : 'BLOCKED' as CheckState,
      selected: target.proposedStatus,
      visibleCount: statusResult.length,
    },
    territory: {
      state: includesUsage(territoryResult, target.usage.id)
        ? 'PROVEN_RUNTIME' as CheckState
        : 'BLOCKED' as CheckState,
      selected: target.usage.territory,
      visibleCount: territoryResult.length,
    },
    channel: {
      state: includesUsage(channelResult, target.usage.id)
        ? 'PROVEN_RUNTIME' as CheckState
        : 'BLOCKED' as CheckState,
      selected: target.usage.channel,
      visibleCount: channelResult.length,
    },
  }

  const client = getServerSanity()
  let releaseAvailability: {
    state: CheckState
    classification: 'RELEASES_PRESENT' | 'NO_RELEASE_PRESENT' | 'QUERY_FAILED'
    releaseCount: number | null
    releases?: Array<{id: string; name: string; state: string | null; title: string | null}>
    blocker?: string
  }

  try {
    const releases = await client.fetch<Array<{
      _id: string
      state?: string
      metadata?: {title?: string}
    }>>(
      'releases::all(){_id,state,metadata}',
      {},
      {perspective: 'raw'},
    )

    releaseAvailability = {
      state: 'PROVEN_RUNTIME',
      classification: releases.length ? 'RELEASES_PRESENT' : 'NO_RELEASE_PRESENT',
      releaseCount: releases.length,
      releases: releases.map((release) => ({
        id: release._id,
        name: release._id.split('.').at(-1) || release._id,
        state: release.state || null,
        title: release.metadata?.title || null,
      })),
    }
  } catch (error) {
    releaseAvailability = {
      state: 'BLOCKED',
      classification: 'QUERY_FAILED',
      releaseCount: null,
      blocker: error instanceof Error ? error.message : String(error),
    }
  }

  const filterStates = Object.values(filterChecks).map((check) => check.state)
  const filtersPassed = filterStates.every((state) => state === 'PROVEN_RUNTIME')

  const blockers = [
    ...(filtersPassed ? [] : ['operatorFilters']),
    ...(releaseAvailability.state === 'PROVEN_RUNTIME' ? [] : ['releaseAvailability']),
  ]

  console.log(JSON.stringify({
    assurance: 'CLEARANCE_ROOM_REMAINING_READONLY_ASSURANCE_V1',
    truthBoundary: {
      action: 'READ_ONLY_ASSURANCE',
      businessMutation: false,
      protectedSubmission: false,
      filterProofUsesLivePortfolioData: true,
      releaseQueryPerspective: 'raw',
    },
    livePortfolio: {
      usageCount: portfolio.summary.totalUsageRequests,
      targetUsage: target.usage.id,
      targetStatus: target.proposedStatus,
    },
    operatorFilters: filterChecks,
    releaseAvailability,
    terminal: {
      safeReadonlyGapsSatisfied: blockers.length === 0,
      blockers,
    },
    observedAt: new Date().toISOString(),
  }, null, 2))

  if (blockers.length) process.exitCode = 3
}

main().catch((error) => {
  console.error(JSON.stringify({
    assurance: 'CLEARANCE_ROOM_REMAINING_READONLY_ASSURANCE_V1',
    result: 'FAIL',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2))
  process.exitCode = 1
})
