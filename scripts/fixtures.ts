import type {UsageGraph} from '../src/types.js'

export const publishedGraph: UsageGraph = {
  _id: 'usage-winter-ca',
  title: 'Winter Canada Paid Reels',
  territory: 'CA',
  channel: 'instagram_reels',
  isPaid: true,
  startDate: '2026-10-15',
  endDate: '2026-11-30',
  asset: {
    _id: 'asset-a17',
    title: 'A17 — Maya Hero',
    rights: [{
      _id: 'rights-maya-2026',
      _rev: 'published-rev',
      title: 'Maya Talent Release 2026',
      kind: 'talent_release',
      allowedTerritories: ['CA', 'US'],
      allowedChannels: ['instagram_reels', 'organic_social'],
      paidAdvertisingAllowed: true,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      sourceClause: 'Paid social advertising permitted in Canada and the United States through 2026-12-31.',
    }],
  },
}

export const draftsGraph: UsageGraph = {
  ...publishedGraph,
  asset: {
    ...publishedGraph.asset,
    rights: [{
      ...publishedGraph.asset.rights[0],
      _id: 'rights-maya-2026',
      _originalId: 'drafts.rights-maya-2026',
      _rev: 'draft-rev',
      paidAdvertisingAllowed: false,
      sourceClause: 'Draft amendment: organic social only. Paid amplification is not permitted.',
    }],
  },
}
