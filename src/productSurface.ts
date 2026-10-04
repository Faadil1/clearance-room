import {compileClearance} from './compiler'
import {diffProofs} from './diff'
import {proofDocument} from './proof'
import {ALL_RIGHTS_DOCUMENTS_QUERY, ALL_USAGE_GRAPHS_QUERY, USAGE_GRAPH_QUERY} from './query'
import {getServerSanity} from './serverSanity'
import {queryRightsGraph} from './contextGraph'
import type {Finding, Right, UsageGraph} from './types'

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
  const [publishedGraphs, draftGraphs] = await Promise.all([
    queryRightsGraph<UsageGraph[]>('published', ALL_USAGE_GRAPHS_QUERY),
    queryRightsGraph<UsageGraph[]>('drafts', ALL_USAGE_GRAPHS_QUERY),
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
      graphReadIntegration: 'sanity-context-mcp',
      scope: 'all-usage-requests',
    },
  }
}

export async function getUsageImpact(usageRequestId: string, persist = false) {
  const client = getServerSanity()
  const query = USAGE_GRAPH_QUERY.replace('$id', JSON.stringify(usageRequestId))
  const [published, drafts] = await Promise.all([
    queryRightsGraph<UsageGraph>('published', query),
    queryRightsGraph<UsageGraph>('drafts', query),
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


export type RightsFieldDiff = {
  field:
    | 'title'
    | 'kind'
    | 'allowedTerritories'
    | 'allowedChannels'
    | 'paidAdvertisingAllowed'
    | 'validFrom'
    | 'validTo'
    | 'sourceClause'
  from: string | boolean | string[] | null
  to: string | boolean | string[] | null
}

function canonicalRightId(right: Right) {
  const original = right._originalId
  if (original?.startsWith('drafts.')) return original.slice('drafts.'.length)
  if (right._id.startsWith('drafts.')) return right._id.slice('drafts.'.length)
  return right._id
}

function normalizedArray(value?: string[]) {
  return value ? [...value].sort() : []
}

function valuesEqual(a: unknown, b: unknown) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
  }
  return a === b
}

function rightsFieldDiff(current: Right | null, proposed: Right): RightsFieldDiff[] {
  const pairs: Array<[RightsFieldDiff['field'], unknown, unknown]> = [
    ['title', current?.title ?? null, proposed.title ?? null],
    ['kind', current?.kind ?? null, proposed.kind ?? null],
    ['allowedTerritories', normalizedArray(current?.allowedTerritories), normalizedArray(proposed.allowedTerritories)],
    ['allowedChannels', normalizedArray(current?.allowedChannels), normalizedArray(proposed.allowedChannels)],
    ['paidAdvertisingAllowed', current?.paidAdvertisingAllowed ?? null, proposed.paidAdvertisingAllowed ?? null],
    ['validFrom', current?.validFrom ?? null, proposed.validFrom ?? null],
    ['validTo', current?.validTo ?? null, proposed.validTo ?? null],
    ['sourceClause', current?.sourceClause ?? null, proposed.sourceClause ?? null],
  ]

  return pairs.flatMap(([field, from, to]) =>
    valuesEqual(from, to)
      ? []
      : [{
          field,
          from: from as RightsFieldDiff['from'],
          to: to as RightsFieldDiff['to'],
        }],
  )
}

function summarizeUsage(graph: UsageGraph) {
  return {
    id: graph._id,
    title: graph.title,
    assetId: graph.asset._id,
    assetTitle: graph.asset.title,
    territory: graph.territory,
    channel: graph.channel,
    isPaid: graph.isPaid,
    startDate: graph.startDate,
    endDate: graph.endDate,
  }
}

export async function scanRightsChanges() {
  const [
    publishedRights,
    draftRights,
    publishedGraphs,
    draftGraphs,
  ] = await Promise.all([
    queryRightsGraph<Right[]>('published', ALL_RIGHTS_DOCUMENTS_QUERY),
    queryRightsGraph<Right[]>('drafts', ALL_RIGHTS_DOCUMENTS_QUERY),
    queryRightsGraph<UsageGraph[]>('published', ALL_USAGE_GRAPHS_QUERY),
    queryRightsGraph<UsageGraph[]>('drafts', ALL_USAGE_GRAPHS_QUERY),
  ])

  const publishedRightsById = new Map(
    publishedRights.map((right) => [canonicalRightId(right), right]),
  )
  const publishedUsageById = new Map(
    publishedGraphs.map((graph) => [graph._id, graph]),
  )

  const changes = draftRights.flatMap((proposedRight) => {
    const rightId = canonicalRightId(proposedRight)
    const currentRight = publishedRightsById.get(rightId) || null
    const fields = rightsFieldDiff(currentRight, proposedRight)
    if (fields.length === 0) return []

    const downstream = draftGraphs
      .filter((graph) =>
        graph.asset.rights.some((right) => canonicalRightId(right) === rightId),
      )
      .flatMap((proposedGraph) => {
        const currentGraph = publishedUsageById.get(proposedGraph._id)
        if (!currentGraph) return []

        const current = compileClearance(currentGraph)
        const proposed = compileClearance(proposedGraph)
        const diff = diffProofs(current, proposed)

        return [{
          usage: summarizeUsage(proposedGraph),
          currentStatus: current.status,
          proposedStatus: proposed.status,
          changed: diff.changed,
          changedAxes: diff.changedAxes,
          nonClearFindings: proposed.findings.filter((finding) => finding.status !== 'CLEAR'),
          repairs: deriveRepairOptions(proposedGraph, proposed.findings),
        }]
      })
      .sort((a, b) => {
        if (a.changed !== b.changed) return a.changed ? -1 : 1
        const severityDelta = severity(b.proposedStatus) - severity(a.proposedStatus)
        if (severityDelta !== 0) return severityDelta
        return a.usage.title.localeCompare(b.usage.title)
      })

    const affected = downstream.filter((item) => item.changed)
    const assetIds = new Set(downstream.map((item) => item.usage.assetId))

    return [{
      right: {
        id: rightId,
        title: proposedRight.title,
        kind: proposedRight.kind,
        publishedRev: currentRight?._rev || null,
        proposedRev: proposedRight._rev || null,
        draftDocumentId: proposedRight._originalId || proposedRight._id,
      },
      fields,
      downstream,
      summary: {
        linkedAssets: assetIds.size,
        linkedUsageRequests: downstream.length,
        affectedUsageRequests: affected.length,
        blocked: downstream.filter((item) => item.proposedStatus === 'BLOCK').length,
        review: downstream.filter((item) => item.proposedStatus === 'REVIEW').length,
        unknown: downstream.filter((item) => item.proposedStatus === 'UNKNOWN').length,
      },
    }]
  }).sort((a, b) => {
    if (a.summary.affectedUsageRequests !== b.summary.affectedUsageRequests) {
      return b.summary.affectedUsageRequests - a.summary.affectedUsageRequests
    }
    return a.right.title.localeCompare(b.right.title)
  })

  return {
    summary: {
      changedRightsDocuments: changes.length,
      affectedUsageRequests: new Set(
        changes.flatMap((change) =>
          change.downstream.filter((item) => item.changed).map((item) => item.usage.id),
        ),
      ).size,
      linkedUsageRequests: new Set(
        changes.flatMap((change) => change.downstream.map((item) => item.usage.id)),
      ).size,
    },
    changes,
    observedAt: new Date().toISOString(),
    truth: {
      currentPerspective: 'published',
      proposedPerspective: 'drafts',
      graphReadIntegration: 'sanity-context-mcp',
      statusAuthority: 'deterministic-evaluator',
      scope: 'changed-rights-documents-to-downstream-usages',
    },
  }
}
