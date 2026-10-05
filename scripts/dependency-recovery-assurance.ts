import {getRuntimeHealth} from '../src/runtimeHealth'
import {scanLiveImpacts} from '../src/productSurface'
import {getRightsEvidence} from '../src/evidenceService'
import {getServerSanity} from '../src/serverSanity'
import {reconcileRemediationOutcome} from '../src/remediationRecovery'

type Check = {
  state: 'PROVEN_RUNTIME' | 'BLOCKED'
  detail?: unknown
  blocker?: string
}

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

async function latestUserRightId() {
  const client = getServerSanity()
  return client.fetch<string | null>(
    '*[_type == "rightsDocument" && _id match "rights-user-*"] | order(_updatedAt desc)[0]._id',
  )
}

async function completedRecoveryPair() {
  const client = getServerSanity()
  return client.fetch<{baseline: string; usage: string} | null>(
    `*[_type == "clearanceProof" && isStale == true && defined(usageRequest._ref)]{
      _id,
      "usage": usageRequest._ref,
      "replacement": *[_type == "clearanceProof" && supersedes._ref == ^._id][0]._id
    }[defined(replacement)][0]{
      "baseline": _id,
      usage
    }`,
  )
}

async function main() {
  const originalGraph = required('SANITY_CONTEXT_MCP_URL')
  const originalEvidence = required('SANITY_EVIDENCE_MCP_URL')
  const unreachable = 'http://127.0.0.1:9/clearance-room-assurance-unreachable'

  const baselineHealth = await getRuntimeHealth()
  if (baselineHealth.overall !== 'healthy') {
    console.log(JSON.stringify({
      result: 'BLOCKED',
      reason: 'BASELINE_RUNTIME_NOT_HEALTHY',
      baselineHealth,
    }, null, 2))
    process.exitCode = 2
    return
  }

  let contextFailure: Check
  try {
    process.env.SANITY_CONTEXT_MCP_URL = unreachable
    const health = await getRuntimeHealth()

    let scanFailedClosed = false
    let scanError: string | null = null
    try {
      await scanLiveImpacts('drafts')
    } catch (error) {
      scanFailedClosed = true
      scanError = error instanceof Error ? error.message : String(error)
    }

    contextFailure = health.dependencies.contextGraph.state === 'unavailable' && scanFailedClosed
      ? {
          state: 'PROVEN_RUNTIME',
          detail: {
            healthOverall: health.overall,
            contextGraph: health.dependencies.contextGraph.state,
            scanFailedClosed,
            scanError,
            businessMutation: false,
          },
        }
      : {
          state: 'BLOCKED',
          blocker: 'Controlled Context MCP failure did not produce the expected fail-closed state.',
          detail: {health, scanFailedClosed, scanError},
        }
  } finally {
    process.env.SANITY_CONTEXT_MCP_URL = originalGraph
  }

  let knowledgeBaseFailure: Check
  try {
    process.env.SANITY_EVIDENCE_MCP_URL = unreachable
    const health = await getRuntimeHealth()
    const rightId = await latestUserRightId()

    let evidence: any = null
    if (rightId) {
      evidence = await getRightsEvidence(rightId)
    }

    const structuredStillAvailable =
      !rightId || evidence?.structured?.status === 'available'
    const kbUnavailable =
      health.dependencies.knowledgeBase.state === 'unavailable' &&
      (!rightId || evidence?.kb?.status === 'unavailable')

    knowledgeBaseFailure = kbUnavailable && structuredStillAvailable
      ? {
          state: 'PROVEN_RUNTIME',
          detail: {
            knowledgeBase: health.dependencies.knowledgeBase.state,
            contextGraph: health.dependencies.contextGraph.state,
            structuredSource: rightId ? evidence?.structured?.status : 'no-user-right',
            kbEvidence: rightId ? evidence?.kb?.status : 'no-user-right',
            statusAuthorityUnaffected: true,
            businessMutation: false,
          },
        }
      : {
          state: 'BLOCKED',
          blocker: 'Controlled Knowledge Base failure did not preserve the expected structured-source degradation boundary.',
          detail: {health, rightId, evidence},
        }
  } finally {
    process.env.SANITY_EVIDENCE_MCP_URL = originalEvidence
  }

  const recoveredHealth = await getRuntimeHealth()
  let recoveredScan: Check
  try {
    const portfolio = await scanLiveImpacts('drafts')
    recoveredScan = recoveredHealth.overall === 'healthy'
      ? {
          state: 'PROVEN_RUNTIME',
          detail: {
            runtimeHealth: recoveredHealth.overall,
            usageCount: portfolio.summary.totalUsageRequests,
            affected: portfolio.summary.affectedUsageRequests,
          },
        }
      : {
          state: 'BLOCKED',
          blocker: 'Runtime did not return to healthy after restoring dependency endpoints.',
          detail: recoveredHealth,
        }
  } catch (error) {
    recoveredScan = {
      state: 'BLOCKED',
      blocker: 'Context MCP scan did not recover after restoring the real endpoint.',
      detail: error instanceof Error ? error.message : String(error),
    }
  }

  let writeRecoveryIdempotence: Check
  const pair = await completedRecoveryPair()
  if (!pair) {
    writeRecoveryIdempotence = {
      state: 'BLOCKED',
      blocker: 'No stale baseline with an existing replacement proof is available for a read-only idempotence check.',
    }
  } else {
    const result = await reconcileRemediationOutcome(pair.usage, pair.baseline)
    writeRecoveryIdempotence = result.state === 'ALREADY_COMPLETE'
      ? {
          state: 'PROVEN_RUNTIME',
          detail: {
            state: result.state,
            usageRequestId: pair.usage,
            baselineProofId: pair.baseline,
            businessMutationRepeated: false,
          },
        }
      : {
          state: 'BLOCKED',
          blocker: 'Existing completed recovery did not resolve to ALREADY_COMPLETE.',
          detail: result,
        }
  }

  const checks = {
    contextMcpFailClosed: contextFailure,
    knowledgeBaseEvidenceOnlyDegradation: knowledgeBaseFailure,
    dependencyRecoveryAfterRestore: recoveredScan,
    writeRecoveryIdempotence,
    writeOutcomeUnknownRecovery: {
      state: 'BLOCKED' as const,
      blocker:
        'A real write-outcome-unknown case still requires a controlled consequential failure. This assurance script never mutates business state.',
    },
  }

  const blockers = Object.entries(checks)
    .filter(([, value]) => value.state === 'BLOCKED')
    .map(([key]) => key)

  console.log(JSON.stringify({
    assurance: 'CLEARANCE_ROOM_DEPENDENCY_RECOVERY_ASSURANCE_V1',
    truthBoundary: {
      runtimeClass: 'LOCAL_CONTROLLED_INTEGRATION_FAILURE',
      realProductionOutageClaimed: false,
      businessMutation: false,
      protectedSubmission: false,
      endpointOverridesAreProcessLocal: true,
    },
    baselineHealth: baselineHealth.overall,
    checks,
    terminal: {
      dependencyFailureRecoverySatisfied:
        contextFailure.state === 'PROVEN_RUNTIME' &&
        knowledgeBaseFailure.state === 'PROVEN_RUNTIME' &&
        recoveredScan.state === 'PROVEN_RUNTIME',
      remainingBlockers: blockers,
    },
    observedAt: new Date().toISOString(),
  }, null, 2))

  if (
    contextFailure.state !== 'PROVEN_RUNTIME' ||
    knowledgeBaseFailure.state !== 'PROVEN_RUNTIME' ||
    recoveredScan.state !== 'PROVEN_RUNTIME'
  ) {
    process.exitCode = 3
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    assurance: 'CLEARANCE_ROOM_DEPENDENCY_RECOVERY_ASSURANCE_V1',
    result: 'FAIL',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2))
  process.exitCode = 1
})
