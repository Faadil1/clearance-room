import {describe, expect, it} from 'vitest'
import {compileClearance} from '../src/compiler.js'
import type {UsageGraph} from '../src/types.js'

const graph: UsageGraph = {
  _id: 'usage-holiday-ca',
  _rev: 'usage-rev-1',
  title: 'Holiday Canada Paid Reels',
  territory: 'CA',
  channel: 'instagram_reels',
  isPaid: true,
  startDate: '2026-10-15',
  endDate: '2026-11-30',
  asset: {
    _id: 'asset-c09',
    _rev: 'asset-rev-1',
    title: 'C09',
    rights: [
      {
        _id: 'rights-maya-2026',
        _rev: 'maya-rev-1',
        title: 'Maya',
        kind: 'talent_release',
        allowedTerritories: ['CA'],
        allowedChannels: ['instagram_reels'],
        paidAdvertisingAllowed: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
      },
      {
        _id: 'rights-music-c09',
        _rev: 'music-rev-1',
        title: 'Music',
        kind: 'music_license',
        allowedTerritories: ['CA'],
        allowedChannels: ['instagram_reels'],
        paidAdvertisingAllowed: true,
        validFrom: '2026-01-01',
        validTo: '2026-10-31',
      },
    ],
  },
}

describe('Gate #2 partial-window and remediation behavior', () => {
  it('returns REVIEW when a right expires during the requested flight', () => {
    const proof = compileClearance(graph)
    expect(proof.status).toBe('REVIEW')
    expect(proof.findings.find((finding) => finding.axis === 'window')).toMatchObject({
      status: 'REVIEW',
      allowedThrough: '2026-10-31',
      blockedFrom: '2026-11-01',
      causedBy: ['rights-music-c09'],
    })
  })

  it('returns CLEAR after the human-modeled remediation shortens the flight', () => {
    const proof = compileClearance({...graph, endDate: '2026-10-31'})
    expect(proof.status).toBe('CLEAR')
  })

  it('returns BLOCK when the requested flight begins after a governing right expired', () => {
    const proof = compileClearance({...graph, startDate: '2026-11-01', endDate: '2026-11-30'})
    expect(proof.status).toBe('BLOCK')
  })
})
