import type {ClearanceProof, Finding} from './types'

export interface ClearanceDiff {
  from: ClearanceProof['status']
  to: ClearanceProof['status']
  changed: boolean
  changedAxes: Array<{axis: Finding['axis']; from: Finding['status']; to: Finding['status']; causedBy: string[]}>
}

export function diffProofs(current: ClearanceProof, proposed: ClearanceProof): ClearanceDiff {
  const byAxis = new Map(current.findings.map((f) => [f.axis, f]))
  const changedAxes = proposed.findings.flatMap((next) => {
    const prev = byAxis.get(next.axis)
    if (!prev || prev.status === next.status) return []
    return [{axis: next.axis, from: prev.status, to: next.status, causedBy: next.causedBy}]
  })
  return {from: current.status, to: proposed.status, changed: current.status !== proposed.status || changedAxes.length > 0, changedAxes}
}
