import {performance} from 'node:perf_hooks'
import {scanLiveImpacts, scanRightsChanges} from '../src/productSurface'
import {getRuntimeHealth} from '../src/runtimeHealth'
import {auditProofIntegrity} from '../src/proofAudit'
import {investigateUsageWithAgent} from '../src/clearanceAgent'
import {getServerSanity} from '../src/serverSanity'

type CheckState = 'PROVEN_RUNTIME' | 'OBSERVED_PARTIAL' | 'BLOCKED' | 'SKIPPED'

function envConfigured(name: string) {
  return Boolean(process.env[name]?.trim())
}

async function latestUserUsageId() {
  const client = getServerSanity()
  return client.fetch<string | null>(
    '*[_type == "usageRequest" && _id match "usage-user-*"] | order(_updatedAt desc)[0]._id',
  )
}

async function main() {
  const startedAt = new Date().toISOString()
  const requiredEnv = [
    'SANITY_STUDIO_PROJECT_ID',
    'SANITY_STUDIO_DATASET',
    'SANITY_API_TOKEN',
    'SANITY_ORGANIZATION_ID',
    'SANITY_CONTEXT_MCP_URL',
    'SANITY_EVIDENCE_MCP_URL',
    'SANITY_ORGANIZATION_TOKEN',
    'SANITY_KNOWLEDGE_BASE_ID',
  ]
  const missingEnv = requiredEnv.filter((name) => !envConfigured(name))

  if (missingEnv.length) {
    console.log(JSON.stringify({
      result: 'BLOCKED',
      reason: 'RUNTIME_ENV_MISSING',
      missingEnv,
      note: 'Secret values are never printed.',
    }, null, 2))
    process.exitCode = 2
    return
  }

  const health = await getRuntimeHealth()

  const t0 = performance.now()
  const [portfolio, rightsChanges] = await Promise.all([
    scanLiveImpacts('drafts'),
    scanRightsChanges('drafts'),
  ])
  const timeToFirstValueMs = Math.round(performance.now() - t0)

  const proofAudit = await auditProofIntegrity()
  const userUsageId = await latestUserUsageId()

  const unknownImpacts = portfolio.impacts.filter((impact) =>
    impact.proposedStatus === 'UNKNOWN',
  )
  const userUnknownImpacts = unknownImpacts.filter((impact) =>
    impact.usage.id.startsWith('usage-user-'),
  )

  let agent: {
    state: CheckState
    usageRequestId: string | null
    proposedStatus?: string
    narrativeStatus?: string
    abstention?: boolean
    writeAuthority?: string
  } = {
    state: 'SKIPPED',
    usageRequestId: userUsageId,
  }

  if (process.env.CLEARANCE_ASSURANCE_RUN_AGENT === '1') {
    if (!userUsageId) {
      agent = {
        state: 'BLOCKED',
        usageRequestId: null,
      }
    } else {
      const brief = await investigateUsageWithAgent(userUsageId, 'drafts')
      agent = {
        state: brief.aiNarrative.status === 'generated'
          ? 'PROVEN_RUNTIME'
          : 'OBSERVED_PARTIAL',
        usageRequestId: userUsageId,
        proposedStatus: brief.statusReceipt.proposed,
        narrativeStatus: brief.aiNarrative.status,
        abstention: brief.abstention.active,
        writeAuthority: brief.writeAuthority,
      }
    }
  }

  let release: {
    state: CheckState
    perspective: string | null
    summary?: unknown
    error?: string
  } = {
    state: 'SKIPPED',
    perspective: process.env.SANITY_RELEASE_ID || null,
  }

  if (process.env.SANITY_RELEASE_ID?.trim()) {
    try {
      const releasePortfolio = await scanLiveImpacts(process.env.SANITY_RELEASE_ID.trim())
      release = {
        state: 'PROVEN_RUNTIME',
        perspective: process.env.SANITY_RELEASE_ID.trim(),
        summary: releasePortfolio.summary,
      }
    } catch (error) {
      release = {
        state: 'BLOCKED',
        perspective: process.env.SANITY_RELEASE_ID.trim(),
        error: error instanceof Error ? error.message : 'Release analysis failed',
      }
    }
  }

  const checks = {
    runtimeHealth: {
      state: health.overall === 'healthy' ? 'PROVEN_RUNTIME' : 'OBSERVED_PARTIAL',
      value: health,
    },
    timeToFirstValue: {
      state: 'PROVEN_RUNTIME',
      valueMs: timeToFirstValueMs,
      definition: 'server-side concurrent live Context MCP portfolio + rights-change scan',
    },
    livePortfolio: {
      state: 'PROVEN_RUNTIME',
      summary: portfolio.summary,
      observedAt: portfolio.observedAt,
    },
    changeCentric: {
      state: 'PROVEN_RUNTIME',
      summary: rightsChanges.summary,
      observedAt: rightsChanges.observedAt,
    },
    unknownMaterialCase: {
      state: userUnknownImpacts.length ? 'PROVEN_RUNTIME' : 'BLOCKED',
      userUnknownCount: userUnknownImpacts.length,
      allUnknownCount: unknownImpacts.length,
      usageIds: userUnknownImpacts.map((impact) => impact.usage.id),
      blocker: userUnknownImpacts.length
        ? null
        : 'No user-created usage currently evaluates to UNKNOWN under drafts.',
    },
    proofIntegrity: {
      state: proofAudit.result === 'HOLD' ? 'BLOCKED' : 'PROVEN_RUNTIME',
      value: proofAudit,
    },
    boundedAgent: agent,
    releasePerspective: release,
    scenarioDeletion: {
      state: 'BLOCKED',
      blocker:
        'Destructive runtime proof requires explicit human choice of a disposable user-created scenario. This assurance command is read-only.',
    },
    dependencyFailureInjection: {
      state: 'BLOCKED',
      blocker:
        'No real dependency is intentionally disabled by this read-only command. Failure policy is unit-tested; runtime outage observation remains separate.',
    },
    writeFailureRecovery: {
      state: 'BLOCKED',
      blocker:
        'A truthful write-outcome-unknown runtime proof requires a controlled consequential failure. This command will not manufacture or repeat a business mutation.',
    },
    cleanRoomExternalReplay: {
      state: 'BLOCKED',
      blocker:
        'Requires a fresh external environment after dependency lock is committed.',
    },
  }

  const blockers = Object.entries(checks)
    .filter(([, value]) => value.state === 'BLOCKED')
    .map(([name]) => name)

  console.log(JSON.stringify({
    assurance: 'CLEARANCE_ROOM_RUNTIME_ASSURANCE_V1',
    startedAt,
    completedAt: new Date().toISOString(),
    truthBoundary: {
      action: 'READ_ONLY_ASSURANCE',
      noSeed: true,
      noBusinessMutation: true,
      noProtectedSubmission: true,
      statusAuthority: 'deterministic-evaluator',
    },
    checks,
    terminal: {
      buildCandidateReady: blockers.length === 0,
      blockers,
    },
  }, null, 2))

  if (blockers.length) process.exitCode = 3
}

main().catch((error) => {
  console.error(JSON.stringify({
    assurance: 'CLEARANCE_ROOM_RUNTIME_ASSURANCE_V1',
    result: 'FAIL',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2))
  process.exitCode = 1
})
