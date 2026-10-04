import {compileClearance} from './compiler'
import {diffProofs} from './diff'
import {proofDocument} from './proof'
import {ALL_USAGE_GRAPHS_QUERY, USAGE_GRAPH_QUERY} from './query'
import {getServerSanity} from './serverSanity'
import type {Finding, UsageGraph} from './types'

export type RepairOption =
  | {
      id: 'switch_to_organic'
      label: string
      description: string
      mutation: {field: 'isPaid'; value: false}
      basedOnAxis: 'paid'
    }
  | {
      id: 'shorten_campaign'
      label: string
      description: string
      mutation: {field: 'endDate'; value: string}
      basedOnAxis: 'window'
    }

export function impactProofId(usageRequestId: string, nonce = Date.now()) {
  return `proof-impact-${usageRequestId}-proposed-${nonce}`
}

export function replacementProofId(usageRequestId: string, nonce = Date.now()) {
  return `proof-impact-${usageRequestId}-resolved-${nonce}`
}

function severity(status: string) {
  return status === 'BLOCK' ? 4 : status === 'UNKNOWN' ? 3 : status === 'REVIEW' ? 2 : 1
}

export function deriveRepairOptions(graph: UsageGraph, findings: Finding[]): RepairOption[] {
  const options: RepairOption[] = []
  const paid = findings.find((finding) => finding.axis === 'paid')
  const window = findings.find((finding) => finding.axis === 'window')

  if (graph.isPaid && paid?.status === 'BLOCK') {
    options.push({
      id: 'switch_to_organic',
      label: 'Switch to organic-only distribution',
      description: 'Remove paid amplification from this usage request, then recompile against the same proposed rights graph.',
      mutation: {field: 'isPaid', value: false},
      basedOnAxis: 'paid',
    })
  }

  if (
    window?.status === 'REVIEW' &&
    window.allowedThrough &&
    graph.endDate > window.allowedThrough
  ) {
    options.push({
      id: 'shorten_campaign',
      label: `Shorten campaign through ${window.allowedThrough}`,
      description: 'Move the campaign end date to the last date covered by every governing right, then recompile.',
      mutation: {field: 'endDate', value: window.allowedThrough},
      basedOnAxis: 'window',
    })
  }

  return options
}

function causalRights(graph: UsageGraph, findings: Finding[]) {
  const ids = new Set(findings.flatMap((finding) => finding.causedBy))
  return graph.asset.rights
    .filter((right) => ids.has(right._originalId || right._id))
    .map((right) => ({
      id: right._originalId || right._id,
      title: right.title,
      kind: right.kind,
      sourceClause: right.sourceClause || null,
      rev: right._rev || null,
    }))
}

export async function scanLiveImpacts() {
  const client = getServerSanity()
  const [publishedGraphs, draftGraphs] = await Promise.all([
    client.fetch<UsageGraph[]>(ALL_USAGE_GRAPHS_QUERY, {}, {perspective: 'published'}),
    client.fetch<UsageGraph[]>(ALL_USAGE_GRAPHS_QUERY, {}, {perspective: 'drafts'}),
  ])

  const publishedById = new Map(publishedGraphs.map((graph) => [graph._id, graph]))

  const impacts = draftGraphs.flatMap((proposedGraph) => {
    const currentGraph = publishedById.get(proposedGraph._id)
    if (!currentGraph) return []

    const current = compileClearance(currentGraph)
    const proposed = compileClearance(proposedGraph)
    const diff = diffProofs(current, proposed)
    const findings = proposed.findings.filter((finding) => finding.status !== 'CLEAR')

    return [{
      usage: {
        id: proposedGraph._id,
        title: proposedGraph.title,
        assetId: proposedGraph.asset._id,
        assetTitle: proposedGraph.asset.title,
        territory: proposedGraph.territory,
        channel: proposedGraph.channel,
        isPaid: proposedGraph.isPaid,
        startDate: proposedGraph.startDate,
        endDate: proposedGraph.endDate,
      },
      currentStatus: current.status,
      proposedStatus: proposed.status,
      changed: diff.changed,
      changedAxes: diff.changedAxes,
      nonClearFindings: findings,
      causalRights: causalRights(proposedGraph, findings.length ? findings : proposed.findings),
      repairCount: deriveRepairOptions(proposedGraph, proposed.findings).length,
      severity: severity(proposed.status),
    }]
  }).sort((a, b) => {
    if (a.changed !== b.changed) return a.changed ? -1 : 1
    if (a.severity !== b.severity) return b.severity - a.severity
    return a.usage.title.localeCompare(b.usage.title)
  })

  const changed = impacts.filter((impact) => impact.changed)
  return {
    summary: {
      totalUsageRequests: impacts.length,
      affectedUsageRequests: changed.length,
      blocked: impacts.filter((impact) => impact.proposedStatus === 'BLOCK').length,
      review: impacts.filter((impact) => impact.proposedStatus === 'REVIEW').length,
      unknown: impacts.filter((impact) => impact.proposedStatus === 'UNKNOWN').length,
      clear: impacts.filter((impact) => impact.proposedStatus === 'CLEAR').length,
    },
    impacts,
    observedAt: new Date().toISOString(),
    truth: {
      currentPerspective: 'published',
      proposedPerspective: 'drafts',
      statusAuthority: 'deterministic-evaluator',
      scope: 'all-usage-requests',
    },
  }
}

export async function getUsageImpact(usageRequestId: string, persist = false) {
  const client = getServerSanity()
  const [published, drafts] = await Promise.all([
    client.fetch<UsageGraph>(
      USAGE_GRAPH_QUERY,
      {id: usageRequestId},
      {perspective: 'published'},
    ),
    client.fetch<UsageGraph>(
      USAGE_GRAPH_QUERY,
      {id: usageRequestId},
      {perspective: 'drafts'},
    ),
  ])

  if (!published || !drafts) {
    throw new Error(`Usage request ${usageRequestId} was not found in both perspectives`)
  }

  const current = compileClearance(published)
  const proposed = compileClearance(drafts)
  const diff = diffProofs(current, proposed)
  const findings = proposed.findings.filter((finding) => finding.status !== 'CLEAR')
  const repairs = deriveRepairOptions(drafts, proposed.findings)

  let persistedProof: {id: string; rev?: string} | null = null
  if (persist) {
    const saved = await client.create(
      proofDocument(impactProofId(usageRequestId), drafts, proposed, {
        perspective: 'drafts',
      }),
    )
    persistedProof = {id: saved._id, rev: saved._rev}
  }

  const proofHistory = await client.fetch<Array<{
    _id: string
    status: string
    isStale: boolean
    staleReason?: string
    evaluatedAt?: string
    supersedes?: string
  }>>(
    `*[_type == "clearanceProof" && usageRequest._ref == $id] | order(evaluatedAt desc){
      _id,
      status,
      isStale,
      staleReason,
      evaluatedAt,
      "supersedes": supersedes._ref
    }[0...12]`,
    {id: usageRequestId},
  )

  return {
    usage: {
      id: drafts._id,
      title: drafts.title,
      assetId: drafts.asset._id,
      assetTitle: drafts.asset.title,
      territory: drafts.territory,
      channel: drafts.channel,
      isPaid: drafts.isPaid,
      startDate: drafts.startDate,
      endDate: drafts.endDate,
    },
    current,
    proposed,
    diff,
    causalRights: causalRights(drafts, findings.length ? findings : proposed.findings),
    repairs,
    persistedProof,
    proofHistory,
    observedAt: new Date().toISOString(),
    truth: {
      currentPerspective: 'published',
      proposedPerspective: 'drafts',
      statusAuthority: 'deterministic-evaluator',
    },
  }
}
