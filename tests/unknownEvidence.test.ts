import {describe, expect, it} from 'vitest'
import {compileClearance} from '../src/compiler'
import type {UsageGraph} from '../src/types'

function graph(): UsageGraph {
  return {
    _id: 'usage-unknown',
    title: 'Unknown evidence usage',
    territory: 'CA',
    channel: 'instagram_reels',
    isPaid: false,
    startDate: '2026-10-15',
    endDate: '2026-10-31',
    asset: {
      _id: 'asset-unknown',
      title: 'Unknown evidence asset',
      rights: [
        {
          _id: 'drafts.rights-unknown',
          _originalId: 'drafts.rights-unknown',
          title: 'Incomplete proposed right',
          kind: 'music_license',
          allowedTerritories: ['CA'],
          allowedChannels: ['instagram_reels'],
          paidAdvertisingAllowed: true,
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
        },
      ],
    },
  }
}

describe('UNKNOWN from genuinely missing structured evidence', () => {
  it('returns UNKNOWN when a governing right has no validity end', () => {
    const input = graph()
    delete input.asset.rights[0].validTo

    const proof = compileClearance(input)
    const window = proof.findings.find((finding) => finding.axis === 'window')

    expect(proof.status).toBe('UNKNOWN')
    expect(window).toMatchObject({
      status: 'UNKNOWN',
      causedBy: ['drafts.rights-unknown'],
      reason: 'At least one governing right is missing a validity boundary.',
    })
  })

  it('returns UNKNOWN for paid usage when paid permission is absent', () => {
    const input = graph()
    input.isPaid = true
    delete input.asset.rights[0].paidAdvertisingAllowed

    const proof = compileClearance(input)
    const paid = proof.findings.find((finding) => finding.axis === 'paid')

    expect(proof.status).toBe('UNKNOWN')
    expect(paid).toMatchObject({
      status: 'UNKNOWN',
      causedBy: ['drafts.rights-unknown'],
      reason: 'Paid-advertising permission is missing from at least one governing right.',
    })
  })

  it('does not offer a false CLEAR when territory grants are missing', () => {
    const input = graph()
    delete input.asset.rights[0].allowedTerritories

    const proof = compileClearance(input)
    const territory = proof.findings.find((finding) => finding.axis === 'territory')

    expect(proof.status).toBe('UNKNOWN')
    expect(territory?.status).toBe('UNKNOWN')
  })
})
