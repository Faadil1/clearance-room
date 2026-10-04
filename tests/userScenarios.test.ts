import {describe, expect, it} from 'vitest'
import {normalizeScenarioInput} from '../src/userScenarios'

const base = {
  title: 'Custom campaign test',
  assetTitle: 'Custom hero asset',
  usage: {
    territory: 'CA',
    channel: 'instagram_reels',
    isPaid: true,
    startDate: '2026-10-15',
    endDate: '2026-11-30',
  },
  rights: [
    {
      title: 'Custom talent release',
      kind: 'talent_release',
      current: {
        allowedTerritories: ['CA', 'US'],
        allowedChannels: ['instagram_reels', 'organic_social'],
        paidAdvertisingAllowed: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        sourceClause: 'Paid social allowed in CA and US through 2026-12-31.',
      },
      proposed: {
        allowedTerritories: ['CA'],
        allowedChannels: ['instagram_reels'],
        paidAdvertisingAllowed: false,
        validFrom: '2026-01-01',
        validTo: '2026-10-31',
        sourceClause: 'Proposed restriction: organic-only after 2026-10-31.',
      },
    },
  ],
}

describe('user-defined live scenarios', () => {
  it('accepts a complete multi-state scenario and normalizes lists', () => {
    const input = structuredClone(base)
    input.rights[0].current.allowedTerritories = [' CA ', 'US', 'CA']

    const scenario = normalizeScenarioInput(input)

    expect(scenario.title).toBe('Custom campaign test')
    expect(scenario.rights).toHaveLength(1)
    expect(scenario.rights[0].current.allowedTerritories).toEqual(['CA', 'US'])
    expect(scenario.rights[0].proposed.paidAdvertisingAllowed).toBe(false)
  })

  it('supports multiple governing rights in one user scenario', () => {
    const input = structuredClone(base)
    input.rights.push({
      ...structuredClone(input.rights[0]),
      title: 'Custom music license',
      kind: 'music_license',
    })

    const scenario = normalizeScenarioInput(input)

    expect(scenario.rights).toHaveLength(2)
    expect(scenario.rights.map((right) => right.kind)).toEqual([
      'talent_release',
      'music_license',
    ])
  })

  it('rejects invalid campaign windows before writing to Sanity', () => {
    const input = structuredClone(base)
    input.usage.startDate = '2026-12-01'
    input.usage.endDate = '2026-11-01'

    expect(() => normalizeScenarioInput(input)).toThrow(
      'usage.endDate cannot be before usage.startDate',
    )
  })

  it('requires at least one governing right', () => {
    const input = structuredClone(base)
    input.rights = []

    expect(() => normalizeScenarioInput(input)).toThrow(
      'At least one governing right is required',
    )
  })
})
