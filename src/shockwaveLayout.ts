// Pure layout for the Shockwave impact map.
// It only places evaluator output on screen: it never computes, upgrades or
// downgrades a clearance status. Every status it reads comes from the
// deterministic evaluator via /api/impacts.

export type MapStatus = 'CLEAR' | 'REVIEW' | 'UNKNOWN' | 'BLOCK'
export type MapPerspective = 'published' | 'proposed'

export type MapImpactInput = {
  usage: {id: string; title: string}
  currentStatus: MapStatus
  proposedStatus: MapStatus
  changed: boolean
}

export type MapDot = {
  id: string
  title: string
  status: MapStatus
  /** Percent of the square map, 0..100, measured from the top-left corner. */
  x: number
  y: number
  /** Which side of the dot its label sits on. */
  labelSide: 'left' | 'right'
  changed: boolean
  regressed: boolean
}

// Ring order: the most severe verdict sits closest to the change.
// Matches the severity ranking used by src/productSurface.ts.
export const SEVERITY: Record<MapStatus, number> = {
  CLEAR: 1,
  REVIEW: 2,
  UNKNOWN: 3,
  BLOCK: 4,
}

// Radius of each band's centre line, as a percent of the map's half-width.
export const RING_RADIUS: Record<MapStatus, number> = {
  BLOCK: 30,
  UNKNOWN: 50,
  REVIEW: 70,
  CLEAR: 88,
}

// Outer edge of each band, as a percent of the map's half-width.
export const RING_EDGE: Record<MapStatus, number> = {
  BLOCK: 40,
  UNKNOWN: 60,
  REVIEW: 80,
  CLEAR: 98,
}

export function isRegression(impact: Pick<MapImpactInput, 'currentStatus' | 'proposedStatus'>) {
  return SEVERITY[impact.proposedStatus] > SEVERITY[impact.currentStatus]
}

// Stable angle per usage id so a dot keeps its bearing across rescans and
// only its distance changes when the perspective flips.
export function bearingFor(id: string, index: number, total: number) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const slot = total > 0 ? (index / total) * 360 : 0
  const jitter = (hash % 1000) / 1000 * (total > 0 ? 360 / total / 2 : 0)
  // Start at the upper-left so the first (highest-risk) dot is near the reading start.
  return (slot + jitter + 200) % 360
}

export function layoutShockwave(
  impacts: MapImpactInput[],
  perspective: MapPerspective,
): MapDot[] {
  // Highest proposed severity first so it gets the first, most visible bearing.
  const ordered = [...impacts].sort((a, b) =>
    SEVERITY[b.proposedStatus] - SEVERITY[a.proposedStatus] ||
    a.usage.id.localeCompare(b.usage.id),
  )

  return ordered.map((impact, index) => {
    const status = perspective === 'proposed' ? impact.proposedStatus : impact.currentStatus
    const angle = (bearingFor(impact.usage.id, index, ordered.length) * Math.PI) / 180
    const radius = RING_RADIUS[status] / 2 // half-width is 50% of the square
    const x = 50 + radius * Math.cos(angle)
    const y = 50 + radius * Math.sin(angle)
    return {
      id: impact.usage.id,
      title: impact.usage.title,
      status,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      // Labels point outward, except near an edge where they turn inward so they never clip.
      labelSide: x < 50 ? (x < 18 ? 'right' : 'left') : (x > 82 ? 'left' : 'right'),
      changed: impact.changed,
      regressed: isRegression(impact),
    }
  })
}

export function shockwaveCounts(impacts: MapImpactInput[]) {
  return {
    total: impacts.length,
    changed: impacts.filter((impact) => impact.changed).length,
    regressions: impacts.filter(isRegression).length,
  }
}

export function highestRisk<T extends MapImpactInput>(impacts: T[]): T | null {
  const changed = impacts.filter((impact) => impact.changed)
  const pool = changed.length > 0 ? changed : impacts
  return [...pool].sort((a, b) =>
    SEVERITY[b.proposedStatus] - SEVERITY[a.proposedStatus] ||
    a.usage.id.localeCompare(b.usage.id),
  )[0] || null
}
