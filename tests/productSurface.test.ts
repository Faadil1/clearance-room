import {describe, expect, it} from 'vitest'
import {compileClearance} from '../src/compiler'
import {deriveRepairOptions} from '../src/productSurface'
import type {UsageGraph} from '../src/types'

function baseGraph(): UsageGraph {
  return {
    _id: 'usage-test',
    _rev: 'usage-rev',
    title: 'Test usage',
    territory: 'CA',
    channel: 'instagram_reels',
    isPaid: true,
    startDate: '2026-10-15',
    endDate: '2026-11-30',
    asset: {
      _id: 'asset-test',
      _rev: 'asset-rev',
      title: 'Test asset',
      rights: [{
        _id: 'rights-test',
        _rev: 'rights-rev',
        title: 'Test rights',
        kind: 'license',
        allowedTerritories: ['CA'],
        allowedChannels: ['instagram_reels'],
        paidAdvertisingAllowed: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
      }],
    },
  }
}

describe('live product remediation registry', () => {
  it('offers organic-only only when paid media is deterministically blocked', () => {
    const graph = baseGraph()
    graph.asset.rights[0].paidAdvertisingAllowed = false

    const proof = compileClearance(graph)
    const options = deriveRepairOptions(graph, proof.findings)

    expect(proof.status).toBe('BLOCK')
    expect(options).toEqual([
      expect.objectContaining({
        id: 'switch_to_organic',
        basedOnAxis: 'paid',
        mutation: {field: 'isPaid', value: false},
      }),
    ])
  })

  it('offers shortening only when the campaign partially exceeds a right window', () => {
    const graph = baseGraph()
    graph.asset.rights[0].validTo = '2026-10-31'

    const proof = compileClearance(graph)
    const options = deriveRepairOptions(graph, proof.findings)

    expect(proof.status).toBe('REVIEW')
    expect(options).toEqual([
      expect.objectContaining({
        id: 'shorten_campaign',
        basedOnAxis: 'window',
        mutation: {field: 'endDate', value: '2026-10-31'},
      }),
    ])
  })

  it('does not invent a structured remediation when findings are already clear', () => {
    const graph = baseGraph()
    const proof = compileClearance(graph)

    expect(proof.status).toBe('CLEAR')
    expect(deriveRepairOptions(graph, proof.findings)).toEqual([])
  })
})
