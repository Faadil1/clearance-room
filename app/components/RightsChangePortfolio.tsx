'use client'

import {useEffect, useMemo, useState} from 'react'

export type RightsFieldDiff = {
  field: string
  from: string | boolean | string[] | null
  to: string | boolean | string[] | null
}

type Status = 'CLEAR' | 'BLOCK' | 'REVIEW' | 'UNKNOWN'

export type RightsChangePortfolioData = {
  summary: {
    changedRightsDocuments: number
    affectedUsageRequests: number
    linkedUsageRequests: number
  }
  changes: Array<{
    right: {
      id: string
      title: string
      kind: string
      publishedRev: string | null
      proposedRev: string | null
      proposedDocumentId: string
    }
    fields: RightsFieldDiff[]
    downstream: Array<{
      usage: {
        id: string
        title: string
        assetId: string
        assetTitle: string
        territory: string
        channel: string
        isPaid: boolean
        startDate: string
        endDate: string
      }
      currentStatus: Status
      proposedStatus: Status
      changed: boolean
      changedAxes: Array<{
        axis: string
        from: Status
        to: Status
        causedBy: string[]
      }>
      nonClearFindings: Array<{
        axis: string
        status: Status
        reason: string
        causedBy: string[]
        allowedThrough?: string
        blockedFrom?: string
      }>
      repairs: Array<{
        id: string
        label: string
        description: string
        basedOnAxis: string
      }>
    }>
    summary: {
      linkedAssets: number
      linkedUsageRequests: number
      affectedUsageRequests: number
      blocked: number
      review: number
      unknown: number
    }
  }>
  observedAt: string
}

function StatusPill({status}: {status: string}) {
  return <span className={`status status--${status.toLowerCase()}`}>{status}</span>
}

function printable(value: RightsFieldDiff['from']) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '∅'
  if (value === null) return '∅'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return value
}

function fieldLabel(field: string) {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (value) => value.toUpperCase())
}

export default function RightsChangePortfolio({
  data,
  onOpenUsage,
  busy,
}: {
  data: RightsChangePortfolioData
  onOpenUsage: (usageRequestId: string) => void
  busy: boolean
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    data.changes[0]?.right.id || null,
  )

  useEffect(() => {
    if (!selectedId || !data.changes.some((change) => change.right.id === selectedId)) {
      setSelectedId(data.changes[0]?.right.id || null)
    }
  }, [data, selectedId])

  const selected = useMemo(
    () => data.changes.find((change) => change.right.id === selectedId) || null,
    [data, selectedId],
  )

  return (
    <section className="changeCentricSurface">
      <div className="changeSummary">
        <div>
          <span>Changed rights documents</span>
          <strong>{data.summary.changedRightsDocuments}</strong>
        </div>
        <div>
          <span>Downstream usages</span>
          <strong>{data.summary.linkedUsageRequests}</strong>
        </div>
        <div>
          <span>Actually affected</span>
          <strong>{data.summary.affectedUsageRequests}</strong>
        </div>
      </div>

      {data.changes.length === 0 ? (
        <article className="panel emptyState">
          <StatusPill status="CLEAR" />
          <h3>No draft rights-document field changes are currently observed.</h3>
          <p className="muted">
            Clearance Room found no material difference between the published and draft rights documents.
          </p>
        </article>
      ) : (
        <div className="changeWorkspace">
          <aside className="changeList" aria-label="Rights changes">
            {data.changes.map((change) => (
              <button
                key={change.right.id}
                className={`changeCard ${selectedId === change.right.id ? 'changeCard--selected' : ''}`}
                onClick={() => setSelectedId(change.right.id)}
              >
                <span className="changeKind">{change.right.kind.replaceAll('_', ' ')}</span>
                <strong>{change.right.title}</strong>
                <code>{change.right.id}</code>
                <div className="changeCardMetrics">
                  <span>{change.fields.length} fields changed</span>
                  <span>{change.summary.affectedUsageRequests}/{change.summary.linkedUsageRequests} usages affected</span>
                </div>
              </button>
            ))}
          </aside>

          {selected && (
            <div className="changeDetail">
              <article className="panel">
                <div className="panelHeading">
                  <span className="stepIndex">Δ</span>
                  <div>
                    <p className="cardKicker">Rights change</p>
                    <h2>{selected.right.title}</h2>
                  </div>
                  <span className="authorityBadge">{selected.fields.length} CHANGED FIELDS</span>
                </div>

                <div className="revisionGrid">
                  <div>
                    <span>Published revision</span>
                    <code>{selected.right.publishedRev || 'not published'}</code>
                  </div>
                  <div>
                    <span>Proposed revision</span>
                    <code>{selected.right.proposedRev || 'unknown'}</code>
                  </div>
                  <div>
                    <span>Proposed document</span>
                    <code>{selected.right.proposedDocumentId}</code>
                  </div>
                </div>

                <div className="fieldDiffList">
                  {selected.fields.map((field) => (
                    <div className="fieldDiff" key={field.field}>
                      <strong>{fieldLabel(field.field)}</strong>
                      <div>
                        <span className="diffBefore">{printable(field.from)}</span>
                        <span className="arrow">→</span>
                        <span className="diffAfter">{printable(field.to)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeading">
                  <span className="stepIndex">↳</span>
                  <div>
                    <p className="cardKicker">Downstream blast radius</p>
                    <h3>
                      {selected.summary.affectedUsageRequests} of {selected.summary.linkedUsageRequests} linked usages change
                    </h3>
                  </div>
                </div>

                <div className="changeMetrics">
                  <span><strong>{selected.summary.linkedAssets}</strong> assets</span>
                  <span><strong>{selected.summary.blocked}</strong> blocked</span>
                  <span><strong>{selected.summary.review}</strong> review</span>
                  <span><strong>{selected.summary.unknown}</strong> unknown</span>
                </div>

                <div className="downstreamList">
                  {selected.downstream.map((item) => (
                    <button
                      className={`downstreamRow ${item.changed ? 'downstreamRow--changed' : ''}`}
                      key={item.usage.id}
                      onClick={() => onOpenUsage(item.usage.id)}
                      disabled={busy}
                    >
                      <div>
                        <strong>{item.usage.title}</strong>
                        <span>
                          {item.usage.assetTitle} · {item.usage.territory} · {item.usage.channel.replaceAll('_', ' ')}
                        </span>
                      </div>

                      <div className="impactAxes">
                        {item.changedAxes.length > 0
                          ? item.changedAxes.map((axis) => <span key={axis.axis}>{axis.axis}</span>)
                          : <span>linked</span>}
                      </div>

                      <div className="transition">
                        <StatusPill status={item.currentStatus} />
                        <span className="arrow">→</span>
                        <StatusPill status={item.proposedStatus} />
                      </div>

                      <span className="rowAction">
                        {item.changed ? 'Investigate →' : 'Inspect linked usage →'}
                      </span>
                    </button>
                  ))}
                </div>
              </article>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
