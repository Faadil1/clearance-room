export type Status = 'CLEAR' | 'BLOCK' | 'REVIEW' | 'UNKNOWN'

export interface Right {
  _id: string
  _rev?: string
  _originalId?: string
  title: string
  kind: string
  allowedTerritories?: string[]
  allowedChannels?: string[]
  paidAdvertisingAllowed?: boolean
  validFrom?: string
  validTo?: string
  sourceClause?: string
}

export interface UsageGraph {
  _id: string
  title: string
  territory: string
  channel: string
  isPaid: boolean
  startDate: string
  endDate: string
  asset: {_id: string; title: string; rights: Right[]}
}

export interface Finding {
  axis: 'territory' | 'channel' | 'paid' | 'window'
  status: Status
  causedBy: string[]
  reason: string
}

export interface ClearanceProof {
  usageRequestId: string
  assetId: string
  status: Status
  findings: Finding[]
  sourceRevisions: Array<{id: string; originalId?: string; rev?: string}>
}
