import {describe, expect, it} from 'vitest'
import {mutationMatches} from '../src/remediationRecovery'

describe('write outcome reconciliation', () => {
  it('recognizes an observed paid-to-organic mutation', () => {
    expect(
      mutationMatches({isPaid: false}, 'isPaid', 'false'),
    ).toBe(true)
  })

  it('recognizes an observed shortened campaign end date', () => {
    expect(
      mutationMatches({endDate: '2026-10-31'}, 'endDate', '2026-10-31'),
    ).toBe(true)
  })

  it('fails closed when the observed value conflicts with the approved mutation', () => {
    expect(
      mutationMatches({endDate: '2026-11-30'}, 'endDate', '2026-10-31'),
    ).toBe(false)
  })

  it('cannot reconcile without approval metadata', () => {
    expect(mutationMatches({isPaid: false}, undefined, undefined)).toBe(false)
  })
})
