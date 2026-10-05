'use client'

import {
  RING_EDGE,
  layoutShockwave,
  type MapImpactInput,
  type MapPerspective,
  type MapStatus,
} from '../../src/shockwaveLayout'

const RING_ORDER: MapStatus[] = ['CLEAR', 'REVIEW', 'UNKNOWN', 'BLOCK']

export default function ShockwaveMap({
  impacts,
  perspective,
  selectedId,
  changedRights,
  onSelect,
  busy,
}: {
  impacts: MapImpactInput[] | null
  perspective: MapPerspective
  selectedId: string | null
  changedRights: number | null
  onSelect: (usageId: string) => void
  busy: boolean
}) {
  const dots = impacts ? layoutShockwave(impacts, perspective) : []
  const showAllLabels = dots.length <= 12

  return (
    <figure className="shockwave" aria-label="Blast radius map">
      <div className="shockwaveStage">
        {RING_ORDER.map((status) => {
          const size = RING_EDGE[status]
          return (
            <div
              key={status}
              className={`shockRing shockRing--${status.toLowerCase()}`}
              style={{width: `${size}%`, height: `${size}%`}}
            >
              <span className="shockRingLabel">{status}</span>
            </div>
          )
        })}

        <div className="shockCore">
          {impacts ? (
            <>
              <strong>Δ {changedRights ?? '—'}</strong>
              <span>rights {changedRights === 1 ? 'document' : 'documents'}<br />changed</span>
            </>
          ) : (
            <span>No scan<br />yet</span>
          )}
        </div>

        {dots.map((dot) => {
          const selected = dot.id === selectedId
          const labelled = showAllLabels || dot.changed || selected
          // On narrow screens only the selected point keeps its label: with several
          // regressions near the centre, more labels collide. Every dot keeps its
          // full accessible name, and the selected-usage card names the point.
          const priority = selected
          return (
            <div
              key={dot.id}
              className={`shockDot shockDot--${dot.status.toLowerCase()} ${selected ? 'shockDot--selected' : ''}`}
              style={{left: `${dot.x}%`, top: `${dot.y}%`}}
            >
              <button
                type="button"
                className="shockDotButton"
                aria-label={`${dot.title}, ${dot.status}${dot.status === 'UNKNOWN' ? ' (insufficient evidence)' : ''}${selected ? ', selected' : ''}`}
                aria-pressed={selected}
                data-usage-id={dot.id}
                onClick={() => onSelect(dot.id)}
                disabled={busy}
              />
              {labelled && (
                <span
                  className={`shockDotLabel shockDotLabel--${dot.labelSide} shockDotLabel--in-${dot.x < 50 ? 'right' : 'left'} ${priority ? 'shockDotLabel--priority' : ''}`}
                  aria-hidden="true"
                >
                  {dot.title}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <figcaption>
        {impacts
          ? 'Distance from the centre is severity. Positions come from the deterministic verdict, never from the agent.'
          : 'Run the live graph scan to place every usage on its verdict ring.'}
      </figcaption>
    </figure>
  )
}
