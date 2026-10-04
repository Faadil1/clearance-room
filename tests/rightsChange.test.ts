import {describe, expect, it} from 'vitest'
import {rightsFieldDiff} from '../src/productSurface'
import type {Right} from '../src/types'

function right(overrides: Partial<Right> = {}): Right {
  return {
    _id: 'rights-maya-2026',
    _rev: 'rev-published',
    title: 'Maya Talent Release 2026',
    kind: 'talent_release',
    allowedTerritories: ['CA', 'US'],
    allowedChannels: ['instagram_reels', 'organic_social'],
    paidAdvertisingAllowed: true,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    sourceClause: 'Paid social advertising permitted in Canada and the United States through 2026-12-31.',
    ...overrides,
  }
}

describe('rights change field diff', () => {
  it('detects the exact changed rights fields', () => {
    const current = right()
    const proposed = right({
      _originalId: 'drafts.rights-maya-2026',
      _rev: 'rev-draft',
      paidAdvertisingAllowed: false,
      sourceClause: 'Draft amendment: organic social only. Paid amplification is not permitted.',
    })

    expect(rightsFieldDiff(current, proposed)).toEqual([
      {
        field: 'paidAdvertisingAllowed',
        from: true,
        to: false,
      },
      {
        field: 'sourceClause',
        from: 'Paid social advertising permitted in Canada and the United States through 2026-12-31.',
        to: 'Draft amendment: organic social only. Paid amplification is not permitted.',
      },
    ])
  })

  it('does not treat reordered list fields as a substantive change', () => {
    const current = right()
    const proposed = right({
      allowedTerritories: ['US', 'CA'],
      allowedChannels: ['organic_social', 'instagram_reels'],
    })

    expect(rightsFieldDiff(current, proposed)).toEqual([])
  })

  it('treats a new rights document as a field-level addition', () => {
    const proposed = right({_id: 'rights-new'})

    const fields = rightsFieldDiff(null, proposed).map((item) => item.field)

    expect(fields).toContain('title')
    expect(fields).toContain('kind')
    expect(fields).toContain('paidAdvertisingAllowed')
  })
})
