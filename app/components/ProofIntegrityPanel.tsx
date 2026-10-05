'use client'

import {useState} from 'react'

type Audit = {
  result: 'PASS' | 'PASS_WITH_HISTORICAL_WARNINGS' | 'HOLD'
  summary: {
    proofs: number
    usagesWithProofs: number
    freshProofs: number
    staleProofs: number
    issues: number
  }
  issues: Array<{
    type: string
    usageRequestId: string | null
    proofIds: string[]
    severity: 'warning' | 'error'
    explanation: string
  }>
  observedAt: string
}

export default function ProofIntegrityPanel() {
  const [audit, setAudit] = useState<Audit | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAudit() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/audit', {cache: 'no-store'})
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Proof audit failed')
      setAudit(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Proof audit failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="panel proofAuditPanel">
      <div className="panelHeading">
        <span className="stepIndex">AUDIT</span>
        <div>
          <p className="cardKicker">Proof integrity</p>
          <h3>Inspect the audit chain without rewriting history</h3>
        </div>
        {audit && <span className="authorityBadge">{audit.result}</span>}
      </div>

      <p className="muted">
        Detects multiple fresh proofs, stale proofs without replacements, and orphan supersession links. It never deletes historical evidence.
      </p>

      <button className="secondaryButton" onClick={runAudit} disabled={busy}>
        {busy ? 'Auditing…' : audit ? 'Re-run proof audit' : 'Run proof integrity audit'}
      </button>

      {error && <div className="errorBanner">{error}</div>}

      {audit && (
        <div className="proofAuditResult">
          <div className="changeMetrics">
            <span><strong>{audit.summary.proofs}</strong> proofs</span>
            <span><strong>{audit.summary.usagesWithProofs}</strong> usages</span>
            <span><strong>{audit.summary.freshProofs}</strong> fresh</span>
            <span><strong>{audit.summary.staleProofs}</strong> stale</span>
            <span><strong>{audit.summary.issues}</strong> issues</span>
          </div>

          {audit.issues.length === 0 ? (
            <div className="proposalNote">No proof-chain integrity issue is currently observed.</div>
          ) : (
            <div className="historyList">
              {audit.issues.map((issue, index) => (
                <div className="historyRow" key={`${issue.type}-${index}`}>
                  <div>
                    <strong>{issue.type}</strong>
                    <span>{issue.usageRequestId || 'unknown usage'} · {issue.explanation}</span>
                    <code>{issue.proofIds.join(' → ')}</code>
                  </div>
                  <span className={issue.severity === 'error' ? 'staleFlag' : 'authorityBadge'}>
                    {issue.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
