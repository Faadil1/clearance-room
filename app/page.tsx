'use client'

import {useState} from 'react'

type Finding = {
  axis: string
  status: 'CLEAR' | 'BLOCK' | 'REVIEW' | 'UNKNOWN'
  causedBy: string[]
  reason: string
}

type Proof = {
  status: 'CLEAR' | 'BLOCK' | 'REVIEW' | 'UNKNOWN'
  findings: Finding[]
  sourceRevisions: Array<{id: string; originalId?: string; rev?: string}>
}

type Analysis = {
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
  current: Proof
  proposed: Proof
  diff: {
    from: string
    to: string
    changed: boolean
    changedAxes: Array<{axis: string; from: string; to: string; causedBy: string[]}>
  }
  source: {
    id: string
    title: string
    kind: string
    sourceClause: string | null
    rev: string | null
  } | null
  persistedProof: {id: string; rev?: string} | null
  observedAt: string
}

type Evidence = {
  knowledgeBase: string
  entryPath: string
  evidence: {
    documentId: string
    title: string
    kind: string
    sourceClause: string
    validTo: string
    source: string
  }
  raw: string
  authority: string
  observedAt: string
}

type Remediation = {
  action: string
  mutation: {usageRequestId: string; field: string; from: boolean; to: boolean}
  previousProof: {id: string; status: string; stale: boolean}
  newProof: {id: string; status: string; stale: boolean; supersedes: string}
  observedAt: string
}

function StatusPill({status}: {status: string}) {
  return <span className={`status status--${status.toLowerCase()}`}>{status}</span>
}

function formatChannel(value: string) {
  return value.replaceAll('_', ' ')
}

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [evidence, setEvidence] = useState<Evidence | null>(null)
  const [receipt, setReceipt] = useState<Remediation | null>(null)
  const [approved, setApproved] = useState(false)
  const [busy, setBusy] = useState<'analyze' | 'evidence' | 'remediate' | 'reset' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Request failed')
    return payload
  }

  async function analyze() {
    setBusy('analyze')
    setError(null)
    setReceipt(null)
    setEvidence(null)
    setApproved(false)
    try {
      setAnalysis(await run('/api/analyze'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impact analysis failed')
    } finally {
      setBusy(null)
    }
  }

  async function loadEvidence() {
    setBusy('evidence')
    setError(null)
    try {
      setEvidence(await run('/api/evidence'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evidence retrieval failed')
    } finally {
      setBusy(null)
    }
  }

  async function remediate() {
    if (!approved) return
    setBusy('remediate')
    setError(null)
    try {
      const result = await run('/api/remediate', {approved: true})
      setReceipt(result)
      setAnalysis(null)
      setApproved(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remediation failed')
    } finally {
      setBusy(null)
    }
  }

  async function resetDemo() {
    if (!window.confirm('Reset the seeded demo scenario to paid media and remove the two hero proof records?')) return
    setBusy('reset')
    setError(null)
    try {
      await run('/api/reset', {approved: true})
      setAnalysis(null)
      setEvidence(null)
      setReceipt(null)
      setApproved(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo reset failed')
    } finally {
      setBusy(null)
    }
  }

  const changed = analysis?.diff.changedAxes[0]

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">CR</span>
          <span>Clearance Room</span>
        </div>
        <div className="runtimeBadge">
          <span className="liveDot" />
          Live Sanity runtime
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">Pre-publish rights impact analysis</p>
        <h1>What breaks if this rights change goes live?</h1>
        <p className="lede">
          Compare the published rights graph with the proposed draft, show the exact downstream impact,
          ground the explanation in source evidence, then require a human before anything consequential changes.
        </p>

        <div className="truthStrip" aria-label="System truth boundaries">
          <span>STATUS · deterministic evaluator</span>
          <span>EVIDENCE · Sanity Knowledge Base</span>
          <span>WRITE · human approval required</span>
        </div>

        {!analysis && !receipt && (
          <div className="launchCard">
            <div>
              <p className="cardKicker">Hero scenario</p>
              <h2>Maya · Winter Canada Paid Reels</h2>
              <p>
                A draft rights amendment removes paid amplification. Run the live comparison to see which
                campaign permission changes before that draft is published.
              </p>
            </div>
            <button className="primaryButton" onClick={analyze} disabled={busy !== null}>
              {busy === 'analyze' ? 'Analyzing live graph…' : 'Run impact analysis'}
            </button>
          </div>
        )}

        {error && <div className="errorBanner" role="alert">{error}</div>}
      </section>

      {analysis && (
        <section className="workspace" aria-live="polite">
          <div className="impactHeader">
            <div>
              <p className="cardKicker">Observed impact</p>
              <h2>{analysis.usage.title}</h2>
              <p className="muted">
                {analysis.usage.assetTitle} · {analysis.usage.territory} · {formatChannel(analysis.usage.channel)} · paid media
              </p>
            </div>
            <div className="transition" aria-label={`${analysis.current.status} to ${analysis.proposed.status}`}>
              <StatusPill status={analysis.current.status} />
              <span className="arrow">→</span>
              <StatusPill status={analysis.proposed.status} />
            </div>
          </div>

          <div className="splitGrid">
            <article className="panel">
              <div className="panelHeading">
                <span className="stepIndex">01</span>
                <div>
                  <p className="cardKicker">{changed ? 'What breaks' : 'Live verification'}</p>
                  <h3>{changed ? `${changed.axis} permission changes` : 'No clearance regression remains'}</h3>
                </div>
              </div>
              {changed && (
                <div className="finding">
                  <div className="findingTransition">
                    <StatusPill status={changed.from} />
                    <span>→</span>
                    <StatusPill status={changed.to} />
                  </div>
                  <p>
                    The proposed graph changes the <strong>{changed.axis}</strong> axis for this usage request.
                  </p>
                  <div className="receiptLine">
                    <span>causedBy</span>
                    <code>{changed.causedBy.join(', ')}</code>
                  </div>
                </div>
              )}
              <div className="miniReceipt">
                <span>Current perspective</span><strong>published</strong>
                <span>Proposed perspective</span><strong>drafts</strong>
                <span>Proof</span><strong>{analysis.persistedProof?.id || 'not persisted'}</strong>
              </div>
            </article>

            <article className="panel panel--accent">
              <div className="panelHeading">
                <span className="stepIndex">02</span>
                <div>
                  <p className="cardKicker">Why</p>
                  <h3>{changed ? 'Draft amendment removes paid amplification' : 'The draft restriction remains, but this usage is now organic'}</h3>
                </div>
              </div>
              <blockquote>
                {analysis.source?.sourceClause || 'No governing draft clause was returned.'}
              </blockquote>
              {!changed && (
                <p className="proposalNote">
                  The draft still prohibits paid amplification. The recompiled usage is CLEAR because it no longer requests paid media.
                </p>
              )}
              <div className="receiptLine">
                <span>rights document</span>
                <code>{analysis.source?.id || 'unknown'}</code>
              </div>
              <div className="receiptLine">
                <span>source revision</span>
                <code>{analysis.source?.rev || 'unknown'}</code>
              </div>
            </article>
          </div>

          <article className="panel evidencePanel">
            <div className="panelHeading">
              <span className="stepIndex">03</span>
              <div>
                <p className="cardKicker">Published baseline evidence</p>
                <h3>Why the current published state still clears paid media</h3>
              </div>
              <button className="secondaryButton" onClick={loadEvidence} disabled={busy !== null}>
                {busy === 'evidence' ? 'Retrieving…' : evidence ? 'Refresh evidence' : 'Retrieve KB evidence'}
              </button>
            </div>
            {!evidence ? (
              <p className="muted">
                The proposed BLOCK above comes from the deterministic draft graph. This separate Knowledge Base lookup retrieves the published source clause that explains the current CLEAR baseline.
              </p>
            ) : (
              <div className="evidenceCard">
                <div className="evidenceMeta">
                  <span>Sanity Knowledge Base</span>
                  <strong>{evidence.evidence.title}</strong>
                </div>
                <blockquote>{evidence.evidence.sourceClause}</blockquote>
                <div className="miniReceipt">
                  <span>Document</span><strong>{evidence.evidence.documentId}</strong>
                  <span>Kind</span><strong>{evidence.evidence.kind}</strong>
                  <span>Published valid through</span><strong>{evidence.evidence.validTo}</strong>
                  <span>Source</span><strong>{evidence.evidence.source}</strong>
                  <span>Authority</span><strong>evidence only · never status</strong>
                </div>
                <details>
                  <summary>View raw KB receipt</summary>
                  <pre>{evidence.raw}</pre>
                </details>
              </div>
            )}
          </article>

          <article className="panel repairPanel">
            <div className="panelHeading">
              <span className="stepIndex">04</span>
              <div>
                <p className="cardKicker">Proposed repair</p>
                <h3>Switch this campaign to organic distribution</h3>
              </div>
            </div>

            <div className="repairChange">
              <div>
                <span className="muted">Current intent</span>
                <strong>Paid media</strong>
              </div>
              <span className="arrow">→</span>
              <div>
                <span className="muted">Proposed intent</span>
                <strong>Organic only</strong>
              </div>
            </div>

            <p className="proposalNote">
              Proposal only. No new clearance status is claimed until the mutation is approved and the deterministic evaluator runs again.
            </p>

            <label className="approval">
              <input
                type="checkbox"
                checked={approved}
                onChange={(event) => setApproved(event.target.checked)}
              />
              <span>
                I approve changing <code>{analysis.usage.id}</code> from paid media to organic-only usage.
              </span>
            </label>

            <button
              className="dangerButton"
              onClick={remediate}
              disabled={!approved || busy !== null}
            >
              {busy === 'remediate' ? 'Writing + recompiling…' : 'Approve repair and recompile'}
            </button>
          </article>
        </section>
      )}

      {receipt && (
        <section className="workspace">
          <article className="panel successPanel">
            <div className="panelHeading">
              <span className="stepIndex">05</span>
              <div>
                <p className="cardKicker">Recompile receipt</p>
                <h2>Repair applied. New proof is clear.</h2>
              </div>
              <StatusPill status={receipt.newProof.status} />
            </div>

            <div className="proofCompare">
              <div className="proofBox proofBox--stale">
                <span className="muted">Previous proof</span>
                <strong>{receipt.previousProof.id}</strong>
                <StatusPill status={receipt.previousProof.status} />
                <span className="staleFlag">STALE</span>
              </div>
              <span className="arrow">→</span>
              <div className="proofBox">
                <span className="muted">Replacement proof</span>
                <strong>{receipt.newProof.id}</strong>
                <StatusPill status={receipt.newProof.status} />
                <span className="freshFlag">FRESH</span>
              </div>
            </div>

            <div className="miniReceipt">
              <span>Mutation</span><strong>isPaid: true → false</strong>
              <span>Approval</span><strong>explicit human action</strong>
              <span>Supersedes</span><strong>{receipt.newProof.supersedes}</strong>
              <span>Observed</span><strong>{new Date(receipt.observedAt).toLocaleString()}</strong>
            </div>

            <button className="primaryButton" onClick={analyze} disabled={busy !== null}>
              Verify live graph again
            </button>
          </article>
        </section>
      )}

      <footer>
        <div>
          <strong>Clearance Room</strong>
          <span>Observed facts, source-bound evidence, human-approved writes.</span>
        </div>
        <button className="textButton" onClick={resetDemo} disabled={busy !== null}>
          {busy === 'reset' ? 'Resetting…' : 'Reset seeded demo'}
        </button>
      </footer>
    </main>
  )
}
