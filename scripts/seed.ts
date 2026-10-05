import {client} from './sanityClient.js'

const docs = [
  {
    _id: 'rights-maya-2026',
    _type: 'rightsDocument',
    title: 'Maya Talent Release 2026',
    kind: 'talent_release',
    allowedTerritories: ['CA', 'US'],
    allowedChannels: ['instagram_reels', 'organic_social'],
    paidAdvertisingAllowed: true,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    sourceClause: 'Paid social advertising permitted in Canada and the United States through 2026-12-31.',
  },
  {
    _id: 'drafts.rights-maya-2026',
    _type: 'rightsDocument',
    title: 'Maya Talent Release 2026 — Draft Amendment',
    kind: 'talent_release',
    allowedTerritories: ['CA', 'US'],
    allowedChannels: ['instagram_reels', 'organic_social'],
    paidAdvertisingAllowed: false,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    sourceClause: 'Draft amendment: organic social only. Paid amplification is not permitted.',
  },
  {
    _id: 'rights-music-c09',
    _type: 'rightsDocument',
    title: 'C09 Original Soundtrack License',
    kind: 'music_license',
    allowedTerritories: ['CA'],
    allowedChannels: ['instagram_reels'],
    paidAdvertisingAllowed: true,
    validFrom: '2026-01-01',
    validTo: '2026-10-31',
    sourceClause: 'Master and sync rights are cleared for paid Instagram Reels in Canada through 2026-10-31.',
  },
  {
    _id: 'asset-a17',
    _type: 'mediaAsset',
    title: 'A17 — Maya Hero',
    rights: [{_type: 'reference', _ref: 'rights-maya-2026'}],
  },
  {
    _id: 'usage-winter-ca',
    _type: 'usageRequest',
    title: 'Winter Canada Paid Reels',
    asset: {_type: 'reference', _ref: 'asset-a17'},
    territory: 'CA',
    channel: 'instagram_reels',
    isPaid: true,
    startDate: '2026-10-15',
    endDate: '2026-11-30',
  },
  {
    _id: 'asset-c09',
    _type: 'mediaAsset',
    title: 'C09 — Maya with Original Soundtrack',
    rights: [
      {_type: 'reference', _ref: 'rights-maya-2026'},
      {_type: 'reference', _ref: 'rights-music-c09'},
    ],
  },
  {
    _id: 'usage-holiday-ca',
    _type: 'usageRequest',
    title: 'Holiday Canada Paid Reels',
    asset: {_type: 'reference', _ref: 'asset-c09'},
    territory: 'CA',
    channel: 'instagram_reels',
    isPaid: true,
    startDate: '2026-10-15',
    endDate: '2026-11-30',
  },
]

await Promise.all([
  client.delete('proof-usage-holiday-ca-baseline').catch(() => undefined),
  client.delete('proof-usage-holiday-ca-remediated').catch(() => undefined),
])

for (const doc of docs) {
  await client.createOrReplace(doc as any)
  console.log(`seeded ${doc._id}`)
}
console.log('Seed complete.')
