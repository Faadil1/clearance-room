// Presentation helpers for the Marginalia Case File.
// They select, order and label values the API already returned. None of them
// computes, upgrades or downgrades a clearance status, a repair, or a proof.

import {SEVERITY, type MapStatus} from './shockwaveLayout'

type Status = MapStatus
type FieldValue = string | boolean | string[] | null

export type CaseFinding = {
  axis: string
  status: Status
  causedBy: string[]
  reason: string
  allowedThrough?: string
  blockedFrom?: string
}

export type CaseCausalRight = {
  id: string
  title: string
  kind: string
  sourceClause: string | null
  rev: string | null
}

export type CaseRightsChange = {
  right: {id: string; title: string; kind: string; publishedRev: string | null; proposedRev: string | null; proposedDocumentId: string}
  fields: Array<{field: string; from: FieldValue; to: FieldValue}>
  downstream: Array<{usage: {id: string}}>
}

export type CaseRepair = {
  id: string
  label: string
  description: string
  mutation: {field: string; value: boolean | string}
  basedOnAxis: string
}

export type CaseUsage = {
  id: string
  title: string
  territory: string
  channel: string
  isPaid: boolean
  startDate: string
  endDate: string
}

// Which rights field governs which evaluator axis. Used only to decide which
// changed fields are shown prominently; it does not affect any verdict.
const AXIS_FIELDS: Record<string, string[]> = {
  territory: ['allowedTerritories'],
  channel: ['allowedChannels'],
  paid: ['paidAdvertisingAllowed'],
  window: ['validFrom', 'validTo'],
}

const FIELD_LABELS: Record<string, string> = {
  allowedTerritories: 'Territories',
  allowedChannels: 'Channels',
  paidAdvertisingAllowed: 'Paid advertising',
  validFrom: 'Valid from',
  validTo: 'Valid through',
  sourceClause: 'Source clause',
  isPaid: 'Paid media on this usage',
  endDate: 'Campaign end date',
  startDate: 'Campaign start date',
}

export function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

// "NOT DOCUMENTED" is the product's own wording for a missing structured value.
export function printFieldValue(field: string, value: FieldValue | undefined) {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
    return 'NOT DOCUMENTED'
  }
  if (field === 'paidAdvertisingAllowed' && typeof value === 'boolean') return value ? 'ALLOWED' : 'PROHIBITED'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return value.map((item) => item.replaceAll('_', ' ')).join(', ')
  return value
}

export type CaseChangeField = {
  field: string
  label: string
  from: string
  to: string
  material: boolean
}

export type CaseChange = {
  rightId: string
  rightTitle: string
  kind: string
  fields: CaseChangeField[]
  revision: {published: string | null; proposed: string | null; documentId: string}
}

/** Rights changes that reach this usage, material fields first. */
export function changesForUsage(
  usageId: string,
  changedAxes: string[],
  rightsChanges: CaseRightsChange[] | null | undefined,
): CaseChange[] {
  if (!rightsChanges) return []
  const materialFields = new Set(changedAxes.flatMap((axis) => AXIS_FIELDS[axis] ?? []))
  return rightsChanges
    .filter((change) => change.downstream.some((item) => item.usage.id === usageId))
    .map((change) => ({
      rightId: change.right.id,
      rightTitle: change.right.title,
      kind: change.right.kind.replaceAll('_', ' '),
      revision: {
        published: change.right.publishedRev,
        proposed: change.right.proposedRev,
        documentId: change.right.proposedDocumentId,
      },
      fields: change.fields
        .map((field) => ({
          field: field.field,
          label: fieldLabel(field.field),
          from: printFieldValue(field.field, field.from),
          to: printFieldValue(field.field, field.to),
          material: materialFields.has(field.field),
        }))
        .sort((a, b) => Number(b.material) - Number(a.material)),
    }))
    .sort((a, b) =>
      Number(b.fields.some((f) => f.material)) - Number(a.fields.some((f) => f.material)),
    )
}

/**
 * The finding that explains the verdict: the most severe non-CLEAR proposed
 * finding, preferring an axis that actually changed. Null when every axis is CLEAR.
 */
export function primaryFinding(findings: CaseFinding[], changedAxes: string[]): CaseFinding | null {
  const nonClear = findings.filter((finding) => finding.status !== 'CLEAR')
  if (nonClear.length === 0) return null
  const changed = new Set(changedAxes)
  return [...nonClear].sort((a, b) =>
    Number(changed.has(b.axis)) - Number(changed.has(a.axis)) ||
    SEVERITY[b.status] - SEVERITY[a.status],
  )[0]
}

/** Human-readable titles for the rights a finding names, falling back to the id. */
export function rightTitles(causedBy: string[], causalRights: CaseCausalRight[]) {
  return causedBy.map((id) => causalRights.find((right) => right.id === id)?.title ?? id)
}

/** Findings ordered for the verdict ledger: non-CLEAR first, most severe first. */
export function orderedFindings(findings: CaseFinding[]) {
  return [...findings].sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status])
}

/** Old → new for a registered repair, read from the usage as returned. */
export function repairPreview(repair: CaseRepair, usage: CaseUsage) {
  const current = (usage as Record<string, unknown>)[repair.mutation.field]
  return {
    label: fieldLabel(repair.mutation.field),
    from: current === undefined ? 'current value' : String(current),
    to: String(repair.mutation.value),
  }
}

export type ProofReceipt = {
  label: string
  usageRequestId: string
  mutation: {field: string; value: boolean | string}
  previousProof: {id: string; status: Status; stale: boolean}
  newProof: {id: string; status: Status; stale: boolean; supersedes: string}
  observedAt: string
}

export type ProofHistoryEntry = {
  _id: string
  status: Status
  isStale: boolean
  staleReason?: string
  evaluatedAt?: string
  supersedes?: string
}

export type ProofChainEvent = {
  kind: 'baseline' | 'approval' | 'stale' | 'replacement'
  at: string | null
  status: Status | null
  title: string
  detail: string
  proofId: string | null
}

/**
 * Audit timeline for one approved write. Every event is backed by a field of the
 * remediation receipt; timestamps come from proof history when it has them and
 * are left empty otherwise. No intermediary event is invented.
 */
export function buildProofChain(
  receipt: ProofReceipt,
  history: ProofHistoryEntry[] = [],
): ProofChainEvent[] {
  const previous = history.find((entry) => entry._id === receipt.previousProof.id)
  const next = history.find((entry) => entry._id === receipt.newProof.id)
  const events: ProofChainEvent[] = [
    {
      kind: 'baseline',
      at: previous?.evaluatedAt ?? null,
      status: receipt.previousProof.status,
      title: receipt.previousProof.status,
      detail: 'Baseline proof recorded',
      proofId: receipt.previousProof.id,
    },
    {
      kind: 'approval',
      at: null,
      status: null,
      title: 'Human approval',
      detail: `${fieldLabel(receipt.mutation.field)} → ${String(receipt.mutation.value)}`,
      proofId: null,
    },
  ]
  if (receipt.previousProof.stale) {
    events.push({
      kind: 'stale',
      at: null,
      status: null,
      title: 'Stale',
      detail: previous?.staleReason || 'Previous proof invalidated',
      proofId: receipt.previousProof.id,
    })
  }
  events.push({
    kind: 'replacement',
    at: next?.evaluatedAt ?? receipt.observedAt,
    status: receipt.newProof.status,
    title: receipt.newProof.status,
    detail: receipt.newProof.stale ? 'Replacement proof (already stale)' : 'Replacement proof · fresh',
    proofId: receipt.newProof.id,
  })
  return events
}
