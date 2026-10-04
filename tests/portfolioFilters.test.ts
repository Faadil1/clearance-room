import {describe, expect, it} from 'vitest'
import {
  EMPTY_IMPACT_FILTERS,
  filterImpacts,
  impactFilterOptions,
} from '../src/portfolioFilters'

const impacts = [
  {
    usage: {
      id: 'usage-a',
      title: 'Winter Canada Paid Reels',
      assetId: 'asset-a',
      assetTitle: 'Winter Hero',
      territory: 'CA',
      channel: 'instagram_reels',
    },
    proposedStatus: 'BLOCK',
    changed: true,
    causalRights: [{id: 'rights-maya', title: 'Maya Talent Release'}],
  },
  {
    usage: {
      id: 'usage-b',
      title: 'Organic US Social',
      assetId: 'asset-b',
      assetTitle: 'Organic Cut',
      territory: 'US',
      channel: 'organic_social',
    },
    proposedStatus: 'CLEAR',
    changed: false,
    causalRights: [{id: 'rights-photo', title: 'Photo Agreement'}],
  },
]

describe('portfolio filters', () => {
  it('combines status and territory filters', () => {
    const result = filterImpacts(impacts, {
      ...EMPTY_IMPACT_FILTERS,
      status: 'BLOCK',
      territory: 'CA',
    })

    expect(result.map((impact) => impact.usage.id)).toEqual(['usage-a'])
  })

  it('searches across usage, asset and causal-right identity', () => {
    expect(
      filterImpacts(impacts, {...EMPTY_IMPACT_FILTERS, search: 'maya'}),
    ).toHaveLength(1)

    expect(
      filterImpacts(impacts, {...EMPTY_IMPACT_FILTERS, search: 'organic cut'}),
    ).toHaveLength(1)
  })

  it('filters by causal right', () => {
    const result = filterImpacts(impacts, {
      ...EMPTY_IMPACT_FILTERS,
      causalRight: 'rights-photo',
    })

    expect(result.map((impact) => impact.usage.id)).toEqual(['usage-b'])
  })

  it('builds unique operator filter options', () => {
    const options = impactFilterOptions(impacts)

    expect(options.statuses).toEqual(['BLOCK', 'CLEAR'])
    expect(options.territories).toEqual(['CA', 'US'])
    expect(options.assets).toEqual([
      {id: 'asset-a', title: 'Winter Hero'},
      {id: 'asset-b', title: 'Organic Cut'},
    ])
  })
})
