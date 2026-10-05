import {describe, expect, it} from 'vitest'
import {composeAgentBrief} from '../src/clearanceAgent'

function impact(status: 'CLEAR' | 'BLOCK' | 'REVIEW' | 'UNKNOWN') {
  const finding = {
    axis: 'paid' as const,
    status,
    causedBy: ['drafts.rights-test'],
    reason: status === 'UNKNOWN'
      ? 'Paid-advertising permission is missing from at least one governing right.'
      : 'Test finding',
  }

  return {
    usage: {
      id: 'usage-test',
      title: 'Test usage',
      assetId: 'asset-test',
      assetTitle: 'Test asset',
      territory: 'CA',
      channel: 'instagram_reels',
      isPaid: true,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    },
    current: {
      usageRequestId: 'usage-test',
      assetId: 'asset-test',
      status: 'CLEAR' as const,
      findings: [],
      sourceRevisions: [],
    },
    proposed: {
      usageRequestId: 'usage-test',
      assetId: 'asset-test',
      status,
      findings: [finding],
      sourceRevisions: [],
    },
    diff: {from: 'CLEAR' as const, to: status, changed: status !== 'CLEAR', changedAxes: []},
    causalRights: [{id: 'drafts.rights-test', title: 'Test right', kind: 'talent_release', sourceClause: null, rev: null}],
    repairs: status === 'BLOCK'
      ? [{
          id: 'switch_to_organic' as const,
          label: 'Switch to organic-only distribution',
          description: 'Test repair',
          mutation: {field: 'isPaid' as const, value: false as const},
          basedOnAxis: 'paid' as const,
        }]
      : [],
    persistedProof: null,
    proofHistory: [],
    observedAt: new Date().toISOString(),
    truth: {
      currentPerspective: 'published',
      proposedPerspective: 'drafts',
      statusAuthority: 'deterministic-evaluator',
    },
  }
}

describe('bounded clearance agent', () => {
  it('abstains on UNKNOWN and never invents a repair', () => {
    const brief = composeAgentBrief(impact('UNKNOWN') as any, [])

    expect(brief.statusReceipt.proposed).toBe('UNKNOWN')
    expect(brief.statusReceipt.authority).toBe('deterministic-evaluator')
    expect(brief.abstention.active).toBe(true)
    expect(brief.repairOptions).toEqual([])
    expect(brief.writeAuthority).toBe('NONE')
  })

  it('surfaces only registry-backed repairs for BLOCK', () => {
    const brief = composeAgentBrief(impact('BLOCK') as any, [])

    expect(brief.abstention.active).toBe(false)
    expect(brief.repairOptions.map((repair) => repair.id)).toEqual(['switch_to_organic'])
    expect(brief.writeAuthority).toBe('NONE')
  })
})
