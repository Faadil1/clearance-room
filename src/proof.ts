import type {ClearanceProof, UsageGraph} from './types.js'

export const BASELINE_PROOF_ID = 'proof-usage-holiday-ca-baseline'
export const REMEDIATED_PROOF_ID = 'proof-usage-holiday-ca-remediated'

export function intentSignature(graph: UsageGraph) {
  return [
    graph._id,
    graph.asset._id,
    graph.territory,
    graph.channel,
    graph.isPaid ? 'paid' : 'organic',
    graph.startDate,
    graph.endDate,
  ].join('|')
}

export function proofDocument(
  proofId: string,
  graph: UsageGraph,
  proof: ClearanceProof,
  options: {perspective?: 'published' | 'drafts'; supersedes?: string} = {},
) {
  return {
    _id: proofId,
    _type: 'clearanceProof',
    usageRequest: {_type: 'reference', _ref: graph._id},
    perspective: options.perspective || 'published',
    status: proof.status,
    isStale: false,
    evaluatedAt: new Date().toISOString(),
    intentSignature: intentSignature(graph),
    findings: proof.findings.map((finding, index) => ({
      _key: `${finding.axis}-${index}`,
      axis: finding.axis,
      status: finding.status,
      reason: finding.reason,
      causedBy: finding.causedBy,
      ...(finding.allowedThrough ? {allowedThrough: finding.allowedThrough} : {}),
      ...(finding.blockedFrom ? {blockedFrom: finding.blockedFrom} : {}),
    })),
    sourceRevisions: proof.sourceRevisions.map((source, index) => ({
      _key: `source-${index}`,
      documentId: source.originalId || source.id,
      revision: source.rev || 'unknown',
    })),
    ...(options.supersedes
      ? {supersedes: {_type: 'reference', _ref: options.supersedes}}
      : {}),
  }
}

export function storedProofIsStale(stored: any, graph: UsageGraph, current: ClearanceProof) {
  if (stored.intentSignature !== intentSignature(graph)) return true

  const currentRevisions = new Map(
    current.sourceRevisions.map((source) => [source.originalId || source.id, source.rev || 'unknown']),
  )

  return (stored.sourceRevisions || []).some(
    (source: {documentId: string; revision: string}) =>
      currentRevisions.get(source.documentId) !== source.revision,
  )
}
