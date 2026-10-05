import {describe, expect, it} from 'vitest'
import {
  RING_RADIUS,
  highestRisk,
  isRegression,
  layoutShockwave,
  shockwaveCounts,
  type MapImpactInput,
} from '../src/shockwaveLayout'

const impacts: MapImpactInput[] = [
  {usage: {id: 'usage-winter-ca', title: 'Winter Canada Paid Reels'}, currentStatus: 'CLEAR', proposedStatus: 'BLOCK', changed: true},
  {usage: {id: 'usage-holiday-ca', title: 'Holiday Canada Paid Reels'}, currentStatus: 'REVIEW', proposedStatus: 'BLOCK', changed: true},
  {usage: {id: 'usage-user-1', title: 'User scenario'}, currentStatus: 'CLEAR', proposedStatus: 'UNKNOWN', changed: true},
  {usage: {id: 'usage-stable', title: 'Stable organic'}, currentStatus: 'CLEAR', proposedStatus: 'CLEAR', changed: false},
]

function distanceFromCentre(dot: {x: number; y: number}) {
  return Math.hypot(dot.x - 50, dot.y - 50)
}

describe('shockwave layout', () => {
  it('places each dot on the ring of the evaluator status for the chosen perspective', () => {
    for (const perspective of ['published', 'proposed'] as const) {
      const dots = layoutShockwave(impacts, perspective)
      for (const dot of dots) {
        const source = impacts.find((impact) => impact.usage.id === dot.id)!
        const expected = perspective === 'proposed' ? source.proposedStatus : source.currentStatus
        expect(dot.status).toBe(expected)
        expect(distanceFromCentre(dot)).toBeCloseTo(RING_RADIUS[expected] / 2, 1)
      }
    }
  })

  it('keeps each dot on the same bearing when the perspective flips', () => {
    const published = layoutShockwave(impacts, 'published')
    const proposed = layoutShockwave(impacts, 'proposed')
    for (const dot of proposed) {
      const before = published.find((candidate) => candidate.id === dot.id)!
      const angleBefore = Math.atan2(before.y - 50, before.x - 50)
      const angleAfter = Math.atan2(dot.y - 50, dot.x - 50)
      expect(angleAfter).toBeCloseTo(angleBefore, 1)
    }
  })

  it('never invents or drops a usage', () => {
    expect(layoutShockwave(impacts, 'proposed').map((dot) => dot.id).sort())
      .toEqual(impacts.map((impact) => impact.usage.id).sort())
    expect(layoutShockwave([], 'proposed')).toEqual([])
  })

  it('treats UNKNOWN as more severe than REVIEW, never as neutral', () => {
    expect(isRegression({currentStatus: 'REVIEW', proposedStatus: 'UNKNOWN'})).toBe(true)
    expect(isRegression({currentStatus: 'UNKNOWN', proposedStatus: 'REVIEW'})).toBe(false)
    expect(RING_RADIUS.UNKNOWN).toBeLessThan(RING_RADIUS.REVIEW)
  })

  it('counts regressions separately from any status change', () => {
    const improved: MapImpactInput = {usage: {id: 'usage-fixed', title: 'Fixed'}, currentStatus: 'BLOCK', proposedStatus: 'CLEAR', changed: true}
    expect(shockwaveCounts([...impacts, improved])).toEqual({total: 5, changed: 4, regressions: 3})
  })

  it('selects the most severe changed usage as highest risk', () => {
    expect(highestRisk(impacts)?.proposedStatus).toBe('BLOCK')
    expect(highestRisk([impacts[3]])?.usage.id).toBe('usage-stable')
    expect(highestRisk([])).toBeNull()
  })
})
