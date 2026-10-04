import type {ClearanceProof, Finding, Right, Status, UsageGraph} from './types.js'

const rank: Record<Status, number> = {CLEAR: 0, REVIEW: 1, UNKNOWN: 2, BLOCK: 3}

function overall(findings: Finding[]): Status {
  return findings.reduce<Status>(
    (current, finding) => rank[finding.status] > rank[current] ? finding.status : current,
    'CLEAR',
  )
}

function sourceId(right: Right) {
  return right._originalId || right._id
}

function evaluateTerritory(graph: UsageGraph): Finding {
  const rights = graph.asset.rights
  if (!rights.length) return {axis: 'territory', status: 'UNKNOWN', causedBy: [], reason: 'No rights documents are linked to the asset.'}
  const missing = rights.filter((r) => !r.allowedTerritories?.length)
  if (missing.length) return {axis: 'territory', status: 'UNKNOWN', causedBy: missing.map(sourceId), reason: 'At least one governing right has no structured territory grant.'}
  const blocking = rights.filter((r) => !r.allowedTerritories!.includes(graph.territory))
  if (blocking.length) return {axis: 'territory', status: 'BLOCK', causedBy: blocking.map(sourceId), reason: `Requested territory ${graph.territory} is not granted by every governing right.`}
  return {axis: 'territory', status: 'CLEAR', causedBy: rights.map(sourceId), reason: `Every governing right grants ${graph.territory}.`}
}

function evaluateChannel(graph: UsageGraph): Finding {
  const rights = graph.asset.rights
  const missing = rights.filter((r) => !r.allowedChannels?.length)
  if (missing.length) return {axis: 'channel', status: 'UNKNOWN', causedBy: missing.map(sourceId), reason: 'At least one governing right has no structured channel grant.'}
  const blocking = rights.filter((r) => !r.allowedChannels!.includes(graph.channel))
  if (blocking.length) return {axis: 'channel', status: 'BLOCK', causedBy: blocking.map(sourceId), reason: `Requested channel ${graph.channel} is not granted by every governing right.`}
  return {axis: 'channel', status: 'CLEAR', causedBy: rights.map(sourceId), reason: `Every governing right grants ${graph.channel}.`}
}

function evaluatePaid(graph: UsageGraph): Finding {
  if (!graph.isPaid) return {axis: 'paid', status: 'CLEAR', causedBy: [], reason: 'The usage request is not paid advertising.'}
  const rights = graph.asset.rights
  const explicitBlocks = rights.filter((r) => r.paidAdvertisingAllowed === false)
  if (explicitBlocks.length) return {axis: 'paid', status: 'BLOCK', causedBy: explicitBlocks.map(sourceId), reason: 'At least one governing right explicitly prohibits paid advertising.'}
  const unknown = rights.filter((r) => r.paidAdvertisingAllowed == null)
  if (unknown.length) return {axis: 'paid', status: 'UNKNOWN', causedBy: unknown.map(sourceId), reason: 'Paid-advertising permission is missing from at least one governing right.'}
  return {axis: 'paid', status: 'CLEAR', causedBy: rights.map(sourceId), reason: 'Every governing right explicitly allows paid advertising.'}
}

function nextDay(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

function evaluateWindow(graph: UsageGraph): Finding {
  const start = Date.parse(graph.startDate)
  const end = Date.parse(graph.endDate)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    return {axis: 'window', status: 'UNKNOWN', causedBy: [], reason: 'The usage request has an invalid or incomplete date window.'}
  }

  const unknown = graph.asset.rights.filter((r) => !r.validFrom || !r.validTo)
  if (unknown.length) {
    return {axis: 'window', status: 'UNKNOWN', causedBy: unknown.map(sourceId), reason: 'At least one governing right is missing a validity boundary.'}
  }

  const noOverlap = graph.asset.rights.filter((r) => end < Date.parse(r.validFrom!) || start > Date.parse(r.validTo!))
  if (noOverlap.length) {
    return {
      axis: 'window',
      status: 'BLOCK',
      causedBy: noOverlap.map(sourceId),
      reason: 'The requested campaign window has no valid overlap with at least one governing right.',
    }
  }

  const partial = graph.asset.rights.filter((r) => start < Date.parse(r.validFrom!) || end > Date.parse(r.validTo!))
  if (partial.length) {
    const earliestExpiry = partial
      .map((r) => r.validTo!)
      .sort()[0]
    return {
      axis: 'window',
      status: 'REVIEW',
      causedBy: partial.map(sourceId),
      reason: `The usage is cleared only through ${earliestExpiry}; the requested campaign continues beyond that boundary.`,
      allowedThrough: earliestExpiry,
      blockedFrom: nextDay(earliestExpiry),
    }
  }

  return {
    axis: 'window',
    status: 'CLEAR',
    causedBy: graph.asset.rights.map(sourceId),
    reason: 'The campaign window is contained by every governing right.',
  }
}

export function compileClearance(graph: UsageGraph): ClearanceProof {
  const findings = [evaluateTerritory(graph), evaluateChannel(graph), evaluatePaid(graph), evaluateWindow(graph)]
  const sourceRevisions = [
    {id: graph._id, rev: graph._rev},
    {id: graph.asset._id, rev: graph.asset._rev},
    ...graph.asset.rights.map((r) => ({id: r._id, originalId: r._originalId, rev: r._rev})),
  ]

  return {
    usageRequestId: graph._id,
    assetId: graph.asset._id,
    status: overall(findings),
    findings,
    sourceRevisions,
  }
}
