'use client'

import {useEffect, useState} from 'react'

type DependencyState = 'available' | 'degraded' | 'unavailable' | 'unverified'

type Health = {
  overall: 'healthy' | 'degraded'
  checkedAt: string
  dependencies: {
    contextGraph: {state: DependencyState; recovery: string}
    knowledgeBase: {state: DependencyState; recovery: string}
    contentLakeRead: {state: DependencyState; recovery: string}
    contentLakeWrite: {state: DependencyState; recovery: string; dryRun: boolean}
    liveContent: {state: string; recovery: string}
  }
}

function StateBadge({state}: {state: string}) {
  return <span className={`dependencyState dependencyState--${state}`}>{state}</span>
}

export default function RuntimeHealthPanel({
  liveState,
  onManualScan,
}: {
  liveState: 'connecting' | 'connected' | 'reconnecting' | 'offline'
  onManualScan: () => void
}) {
  const [health, setHealth] = useState<Health | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function check() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/health', {cache: 'no-store'})
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.code || 'Health check failed')
      setHealth(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    check()
  }, [])

  return (
    <section className="runtimeHealth">
      <div className="runtimeHealthHeader">
        <div>
          <p className="cardKicker">Runtime health</p>
          <h3>{health?.overall === 'healthy' && liveState === 'connected' ? 'Dependencies healthy' : 'Degraded-mode controls active'}</h3>
        </div>
        <button className="textButton" onClick={check} disabled={busy}>
          {busy ? 'Checking…' : 'Re-check dependencies'}
        </button>
      </div>

      {error && <div className="errorBanner">{error}</div>}

      <div className="dependencyGrid">
        <div>
          <span>Context graph</span>
          <StateBadge state={health?.dependencies.contextGraph.state || 'unverified'} />
        </div>
        <div>
          <span>Knowledge Base</span>
          <StateBadge state={health?.dependencies.knowledgeBase.state || 'unverified'} />
        </div>
        <div>
          <span>Content Lake read</span>
          <StateBadge state={health?.dependencies.contentLakeRead.state || 'unverified'} />
        </div>
        <div>
          <span>Content Lake write</span>
          <StateBadge state={health?.dependencies.contentLakeWrite.state || 'unverified'} />
          <small>permission probe uses dry-run only</small>
        </div>
        <div>
          <span>Live stream</span>
          <StateBadge state={liveState === 'connected' ? 'available' : 'unavailable'} />
        </div>
      </div>

      {health?.dependencies.contextGraph.state === 'unavailable' && (
        <div className="errorBanner">
          Context MCP is unavailable. Clearance status is fail-closed; no stale result is promoted as current.
        </div>
      )}

      {health?.dependencies.knowledgeBase.state === 'unavailable' && (
        <div className="proposalNote">
          Knowledge Base is unavailable. Deterministic status can continue from the structured graph, but evidence explanation is degraded.
        </div>
      )}

      {health?.dependencies.contentLakeWrite.state === 'unavailable' && (
        <div className="errorBanner">
          Content Lake write path is unavailable. Consequential remediation must remain disabled until write access recovers.
        </div>
      )}

      {liveState === 'offline' && (
        <div className="degradedAction">
          <div>
            <strong>Live sync is offline.</strong>
            <span>Manual Context MCP scan remains available. Treat the displayed graph as stale until you re-scan.</span>
          </div>
          <button className="secondaryButton" onClick={onManualScan}>
            Run manual Context MCP scan
          </button>
        </div>
      )}
    </section>
  )
}
