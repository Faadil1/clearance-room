import {describe, expect, it} from 'vitest'
import {analyzeProofIntegrity, type StoredProof} from '../src/proofAudit'

function proof(overrides: Partial<StoredProof>): StoredProof {
  return {
    _id: 'proof-a',
    status: 'CLEAR',
    isStale: false,
    usageRequestId: 'usage-a',
    ...overrides,
  }
}

describe('proof integrity audit', () => {
  it('passes a single fresh proof', () => {
    const result = analyzeProofIntegrity([proof({})])
    expect(result.result).toBe('PASS')
    expect(result.issues).toEqual([])
  })

  it('warns on multiple fresh proofs without deleting history', () => {
    const result = analyzeProofIntegrity([
      proof({_id: 'proof-a'}),
      proof({_id: 'proof-b'}),
    ])
    expect(result.result).toBe('PASS_WITH_HISTORICAL_WARNINGS')
    expect(result.issues[0]).toMatchObject({
      type: 'MULTIPLE_FRESH_PROOFS',
      severity: 'warning',
    })
    expect(result.truth.automaticDeletion).toBe(false)
  })

  it('holds on stale proof without replacement', () => {
    const result = analyzeProofIntegrity([
      proof({_id: 'baseline', isStale: true}),
    ])
    expect(result.result).toBe('HOLD')
    expect(result.issues[0]).toMatchObject({
      type: 'STALE_WITHOUT_REPLACEMENT',
      severity: 'error',
    })
  })

  it('accepts a stale baseline with a valid superseding proof', () => {
    const result = analyzeProofIntegrity([
      proof({_id: 'baseline', isStale: true}),
      proof({_id: 'replacement', supersedes: 'baseline'}),
    ])
    expect(result.result).toBe('PASS')
  })

  it('holds on orphan supersession', () => {
    const result = analyzeProofIntegrity([
      proof({_id: 'replacement', supersedes: 'missing-baseline'}),
    ])
    expect(result.result).toBe('HOLD')
    expect(result.issues[0]).toMatchObject({
      type: 'ORPHAN_SUPERSEDES',
      severity: 'error',
    })
  })
})
