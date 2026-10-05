'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import RightsChangePortfolio, {
  type RightsChangePortfolioData,
} from './components/RightsChangePortfolio'
import ScenarioLab from './components/ScenarioLab'
import CaseFile, {type EvidenceState} from './components/CaseFile'
import ProofIntegrityPanel from './components/ProofIntegrityPanel'
import ShockwaveMap from './components/ShockwaveMap'
import SystemStatus from './components/SystemStatus'
import {
  highestRisk,
  shockwaveCounts,
  type MapPerspective,
} from '../src/shockwaveLayout'
import {
  EMPTY_IMPACT_FILTERS,
  filterImpacts,
  impactFilterOptions,
  type ImpactFilters,
} from '../src/portfolioFilters'

type Status = 'CLEAR' | 'BLOCK' | 'REVIEW' | 'UNKNOWN'

type ChangedAxis = {
  axis: string
  from: Status
  to: Status
  causedBy: string[]
}

type Finding = {
  axis: string
  status: Status
  causedBy: string[]
  reason: string
  allowedThrough?: string
  blockedFrom?: string
}

type ImpactSummary = {
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
  changedAxes: ChangedAxis[]
  nonClearFindings: Finding[]
  causalRights: Array<{
    id: string
    title: string
    kind: string
    sourceClause: string | null
    rev: string | null
  }>
  repairCount: number
  severity: number
}

type Portfolio = {
  summary: {
    totalUsageRequests: number
    affectedUsageRequests: number
    blocked: number
    review: number
    unknown: number
    clear: number
  }
  impacts: ImpactSummary[]
  observedAt: string
  truth?: {
    currentPerspective?: string
    proposedPerspective?: string
    statusAuthority?: string
    graphReadIntegration?: string
    scope?: string
  }
}

type Proof = {
  status: Status
  findings: Finding[]
  sourceRevisions: Array<{id: string; originalId?: string; rev?: string}>
}

type RepairOption = {
  id: string
  label: string
  description: string
  mutation: {field: string; value: boolean | string}
  basedOnAxis: string
}

type ImpactDetail = {
  usage: ImpactSummary['usage']
  current: Proof
  proposed: Proof
  diff: {
    from: Status
    to: Status
    changed: boolean
    changedAxes: ChangedAxis[]
  }
  causalRights: ImpactSummary['causalRights']
  repairs: RepairOption[]
  persistedProof: {id: string; rev?: string} | null
  proofHistory: Array<{
    _id: string
    status: Status
    isStale: boolean
    staleReason?: string
    evaluatedAt?: string
    supersedes?: string
  }>
  observedAt: string
  truth?: {
    currentPerspective?: string
    proposedPerspective?: string
    statusAuthority?: string
    graphReadIntegration?: string
    mutationMode?: string
  }
}

type AutoRefreshReceipt = {
  sequence: number
  triggerType: string
  triggerId: string | null
  eventObservedAt: string
  completedAt: string
  beforeAffected: number | null
  afterAffected: number
  graphRead: 'sanity-context-mcp'
  invalidation: 'sanity-live-content-api'
}

type RemediationReceipt = {
  action: string
  label: string
  usageRequestId: string
  mutation: {field: string; value: boolean | string}
  previousProof: {id: string; status: Status; stale: boolean}
  newProof: {id: string; status: Status; stale: boolean; supersedes: string}
  observedAt: string
}

function StatusPill({status}: {status: string}) {
  return <span className={`status status--${status.toLowerCase()}`}>{status}</span>
}

function formatChannel(value: string) {
  return value.replaceAll('_', ' ')
}

function formatWhen(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export default function Home() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [rightsChanges, setRightsChanges] = useState<RightsChangePortfolioData | null>(null)
  const [detail, setDetail] = useState<ImpactDetail | null>(null)
  const [evidence, setEvidence] = useState<Record<string, EvidenceState>>({})
  const [receipt, setReceipt] = useState<RemediationReceipt | null>(null)
  const [selectedRepair, setSelectedRepair] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [busy, setBusy] = useState<'scan' | 'open' | 'evidence' | 'remediate' | 'recover' | 'reset' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [writeRecovery, setWriteRecovery] = useState<{
    usageRequestId: string
    baselineProofId: string
    code: string
  } | null>(null)
  const [recoveryResult, setRecoveryResult] = useState<any | null>(null)
  const [lastTtfvMs, setLastTtfvMs] = useState<number | null>(null)
  const [liveState, setLiveState] = useState<'connecting' | 'connected' | 'reconnecting' | 'offline'>('connecting')
  const [lastLiveSync, setLastLiveSync] = useState<string | null>(null)
  const [lastLiveEvent, setLastLiveEvent] = useState<{type: string; id: string | null; observedAt: string} | null>(null)
  const [liveEventCount, setLiveEventCount] = useState(0)
  const [liveRefreshCount, setLiveRefreshCount] = useState(0)
  const [autoRefreshReceipt, setAutoRefreshReceipt] = useState<AutoRefreshReceipt | null>(null)
  const [filters, setFilters] = useState<ImpactFilters>({...EMPTY_IMPACT_FILTERS})
  const [proposedPerspective, setProposedPerspective] = useState('drafts')
  const [perspectiveInput, setPerspectiveInput] = useState('drafts')
  const [mapPerspective, setMapPerspective] = useState<MapPerspective>('proposed')
  const [selectedUsageId, setSelectedUsageId] = useState<string | null>(null)
  const detailRef = useRef<HTMLElement | null>(null)
  const scannedRef = useRef(false)
  const openUsageRef = useRef<string | null>(null)
  const portfolioRef = useRef<Portfolio | null>(null)

  useEffect(() => {
    const source = new EventSource('/api/live')

    source.onopen = () => setLiveState('connecting')
    source.onerror = () => setLiveState('offline')

    source.onmessage = async (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'welcome') {
          setLiveState('connected')
          return
        }

        if (payload.type === 'heartbeat') return

        if (payload.type === 'error' || payload.type === 'goaway') {
          setLiveState('offline')
          return
        }

        if (payload.type === 'reconnect' || payload.type === 'connecting') {
          setLiveState('reconnecting')
          return
        }

        if (payload.type !== 'message' && payload.type !== 'restart') return

        setLiveState('connected')
        const observedAt = payload.observedAt || new Date().toISOString()
        setLastLiveSync(observedAt)
        const triggerId = typeof payload.id === 'string' ? payload.id : null
        setLastLiveEvent({
          type: payload.type,
          id: triggerId,
          observedAt,
        })
        setLiveEventCount((count) => count + 1)

        if (scannedRef.current) {
          const [impactResponse, changeResponse] = await Promise.all([
            fetch('/api/impacts', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({proposedPerspective}),
            }),
            fetch('/api/changes', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({proposedPerspective}),
            }),
          ])
          const [refreshedImpacts, refreshedChanges] = await Promise.all([
            impactResponse.json(),
            changeResponse.json(),
          ])
          if (impactResponse.ok) {
            const beforeAffected = portfolioRef.current?.summary.affectedUsageRequests ?? null
            portfolioRef.current = refreshedImpacts
            setPortfolio(refreshedImpacts)
            setLiveRefreshCount((count) => {
              const sequence = count + 1
              setAutoRefreshReceipt({
                sequence,
                triggerType: payload.type,
                triggerId,
                eventObservedAt: observedAt,
                completedAt: new Date().toISOString(),
                beforeAffected,
                afterAffected: refreshedImpacts.summary.affectedUsageRequests,
                graphRead: 'sanity-context-mcp',
                invalidation: 'sanity-live-content-api',
              })
              return sequence
            })
          }
          if (changeResponse.ok) setRightsChanges(refreshedChanges)
        }

        if (openUsageRef.current) {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              usageRequestId: openUsageRef.current,
              persist: false,
              proposedPerspective,
            }),
          })
          const refreshed = await response.json()
          if (response.ok) {
            setDetail((current) => current ? {
              ...refreshed,
              persistedProof: current.persistedProof,
            } : current)
          }
        }
      } catch {
        // A malformed live event should not break the operator surface.
      }
    }

    return () => source.close()
  }, [proposedPerspective])

  async function run(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const payload = await response.json()
    if (!response.ok) {
      const failure = new Error(payload.error || 'Request failed') as Error & {payload?: any}
      failure.payload = payload
      throw failure
    }
    return payload
  }

  async function scan({keepReceipt = false}: {keepReceipt?: boolean} = {}) {
    const ttfvStartedAt = performance.now()
    openUsageRef.current = null
    setBusy('scan')
    setError(null)
    setDetail(null)
    setEvidence({})
    setSelectedRepair(null)
    setApproved(false)
    if (!keepReceipt) setReceipt(null)

    try {
      const [impactResult, changeResult] = await Promise.all([
        run('/api/impacts', {proposedPerspective}),
        run('/api/changes', {proposedPerspective}),
      ])
      scannedRef.current = true
      portfolioRef.current = impactResult
      setPortfolio(impactResult)
      setRightsChanges(changeResult)
      setLastTtfvMs(Math.round(performance.now() - ttfvStartedAt))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blast-radius scan failed')
    } finally {
      setBusy(null)
    }
  }

  async function openImpact(usageRequestId: string) {
    openUsageRef.current = usageRequestId
    // Keep the map point and the case file pointing at the same usage.
    setSelectedUsageId(usageRequestId)
    setBusy('open')
    setError(null)
    setEvidence({})
    setReceipt(null)
    setSelectedRepair(null)
    setApproved(false)
    setWriteRecovery(null)
    setRecoveryResult(null)

    try {
      const [analysis, changeResult] = await Promise.all([
        run('/api/analyze', {usageRequestId, proposedPerspective}),
        // Field-level diffs for "What changed": read-only, only when not already scanned.
        rightsChanges ? Promise.resolve(null) : run('/api/changes', {proposedPerspective}).catch(() => null),
      ])
      setDetail(analysis)
      if (changeResult) setRightsChanges(changeResult)
      for (const right of (analysis as ImpactDetail).causalRights.slice(0, 3)) {
        void loadEvidence(right.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impact analysis failed')
    } finally {
      setBusy(null)
    }
  }

  async function loadEvidence(documentId: string) {
    setEvidence((current) => ({...current, [documentId]: {status: 'loading'}}))
    try {
      const data = await run('/api/evidence', {documentId})
      setEvidence((current) => ({...current, [documentId]: {status: 'ready', data}}))
    } catch (err) {
      setEvidence((current) => ({
        ...current,
        [documentId]: {status: 'error', message: err instanceof Error ? err.message : 'Evidence retrieval failed'},
      }))
    }
  }

  function backToMap() {
    const usageId = detail?.usage.id ?? selectedUsageId
    setDetail(null)
    setEvidence({})
    openUsageRef.current = null
    if (usageId) setSelectedUsageId(usageId)
    requestAnimationFrame(() => {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      document.getElementById('impact')?.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'})
      const dot = usageId
        ? document.querySelector<HTMLButtonElement>(`[data-usage-id="${CSS.escape(usageId)}"]`)
        : null
      dot?.focus({preventScroll: true})
    })
  }

  async function applyRepair() {
    if (!detail || !selectedRepair || !approved) return

    setBusy('remediate')
    setError(null)
    try {
      const result = await run('/api/remediate', {
        approved: true,
        usageRequestId: detail.usage.id,
        repairId: selectedRepair,
        baselineProofId: detail.persistedProof?.id,
        proposedPerspective,
      })
      setReceipt(result)
      setSelectedRepair(null)
      setApproved(false)

      // The write succeeded. Refresh read-only views; a refresh failure must not
      // be reported as a failed write.
      const usageId = detail.usage.id
      const [refreshed, refreshedChanges, refreshedDetail] = await Promise.allSettled([
        run('/api/impacts', {proposedPerspective}),
        run('/api/changes', {proposedPerspective}),
        run('/api/analyze', {usageRequestId: usageId, proposedPerspective}),
      ])
      if (refreshed.status === 'fulfilled') {
        portfolioRef.current = refreshed.value
        setPortfolio(refreshed.value)
      }
      if (refreshedChanges.status === 'fulfilled') setRightsChanges(refreshedChanges.value)
      if (refreshedDetail.status === 'fulfilled' && openUsageRef.current === usageId) {
        setDetail(refreshedDetail.value)
      }
    } catch (err) {
      const failure = err as Error & {payload?: any}
      const payload = failure.payload
      if (
        payload?.baselineProofId &&
        payload?.usageRequestId &&
        (payload?.code === 'WRITE_OUTCOME_UNKNOWN' ||
          payload?.code === 'WRITE_COMMITTED_RECONCILIATION_REQUIRED')
      ) {
        setWriteRecovery({
          usageRequestId: payload.usageRequestId,
          baselineProofId: payload.baselineProofId,
          code: payload.code,
        })
      }
      setError(failure instanceof Error ? failure.message : 'Remediation failed')
    } finally {
      setBusy(null)
    }
  }

  async function reconcileWriteOutcome() {
    if (!writeRecovery) return
    setBusy('recover')
    setError(null)

    try {
      const result = await run('/api/recover', {
        approved: true,
        usageRequestId: writeRecovery.usageRequestId,
        baselineProofId: writeRecovery.baselineProofId,
      })
      setRecoveryResult(result)

      const [refreshed, refreshedChanges] = await Promise.all([
        run('/api/impacts', {proposedPerspective}),
        run('/api/changes', {proposedPerspective}),
      ])
      portfolioRef.current = refreshed
      setPortfolio(refreshed)
      setRightsChanges(refreshedChanges)

      if (result.state === 'RECOVERED' || result.state === 'ALREADY_COMPLETE') {
        setWriteRecovery(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Write reconciliation failed')
    } finally {
      setBusy(null)
    }
  }

  async function resetSeededHarness() {
    if (!window.confirm('Restore the canonical seeded scenario? This resets both usage requests, the draft Maya paid restriction, and their proof records.')) return
    setBusy('reset')
    setError(null)
    try {
      await run('/api/reset', {approved: true})
      await scan()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seeded harness reset failed')
      setBusy(null)
    }
  }


  const filterOptions = useMemo(
    () => impactFilterOptions(portfolio?.impacts || []),
    [portfolio],
  )
  const filteredImpacts = useMemo(
    () => filterImpacts(portfolio?.impacts || [], filters),
    [portfolio, filters],
  )
  const affected = filteredImpacts.filter((impact) => impact.changed)
  const stable = filteredImpacts.filter((impact) => !impact.changed)
  const activeFilterCount = Object.entries(filters).filter(([key, value]) =>
    key === 'search' ? Boolean(value.trim()) : value !== 'ALL',
  ).length

  // Map + selection read evaluator output only; nothing here computes a status.
  const allImpacts = portfolio?.impacts ?? []
  const counts = shockwaveCounts(allImpacts)
  const riskiest = highestRisk(allImpacts)
  const selectedImpact =
    allImpacts.find((impact) => impact.usage.id === selectedUsageId) ?? riskiest
  const distributionLine = useMemo(() => {
    if (!portfolio) return ''
    const tally: Record<Status, number> = {BLOCK: 0, UNKNOWN: 0, REVIEW: 0, CLEAR: 0}
    for (const impact of portfolio.impacts) {
      tally[mapPerspective === 'proposed' ? impact.proposedStatus : impact.currentStatus] += 1
    }
    const order: Status[] = ['BLOCK', 'UNKNOWN', 'REVIEW', 'CLEAR']
    return `${mapPerspective === 'proposed' ? `published → ${proposedPerspective}` : 'current rights state'} · ${order.map((status) => `${tally[status]} ${status}`).join(' · ')}`
  }, [portfolio, mapPerspective, proposedPerspective])
  const selectedCause = useMemo(() => {
    if (!selectedImpact) return ''
    const axes = selectedImpact.changedAxes.map((axis) => axis.axis)
    const finding = selectedImpact.nonClearFindings[0]
    const rights = selectedImpact.causalRights.map((right) => right.title)
    if (!selectedImpact.changed) {
      return finding ? `Unchanged · ${finding.reason}` : 'No status change under the proposed rights state.'
    }
    const why = finding?.reason ?? 'Status changed under the proposed rights state.'
    return `${axes.length ? `${axes.join(' · ')} · ` : ''}${why}${rights.length ? ` Governed by ${rights.join(', ')}.` : ''}`
  }, [selectedImpact])

  // Opening a case file moves the reader to it instead of appending it off-screen.
  useEffect(() => {
    if (!detail || !detailRef.current) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    detailRef.current.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'})
    detailRef.current.focus({preventScroll: true})
  }, [detail?.usage.id])

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brandName">Clearance Room</span>
          <span className="brandDescriptor">Rights Impact System</span>
        </div>
        <nav className="modeNav" aria-label="Sections">
          <a href="#impact">Impact</a>
          <a href="#scenario-lab">Scenario Lab</a>
          <a href="#system">Engine &amp; assurance</a>
        </nav>
        <div className="topbarStatus">
          <span className="runtimeBadge">
            <span className={`liveDot liveDot--${liveState}`} aria-hidden="true" />
            {liveState === 'connected' ? 'Live' : liveState === 'offline' ? 'Live sync offline' : 'Connecting…'}
          </span>
          <SystemStatus liveState={liveState} onManualScan={() => scan({keepReceipt: true})} />
        </div>
      </header>

      <section className="impactHero" id="impact" aria-labelledby="impact-title">
        <div className="impactHeroCopy">
          <p className="eyebrow">Pre-publish rights impact</p>
          <h1 id="impact-title">See what breaks before a rights change goes live.</h1>
          <p className="lede">
            {portfolio
              ? 'Every dot is a live usage. Flip to the proposed rights state and watch which ones get pulled toward the change.'
              : 'Compare proposed rights against live usage. Clearance Room finds the blast radius, explains the deterministic cause, and exposes only evidence-backed next actions.'}
          </p>

          {portfolio && (
            <div className="perspectiveToggle" role="group" aria-label="Rights state shown on the map">
              <button
                type="button"
                aria-pressed={mapPerspective === 'published'}
                onClick={() => setMapPerspective('published')}
              >
                Published
              </button>
              <button
                type="button"
                aria-pressed={mapPerspective === 'proposed'}
                onClick={() => setMapPerspective('proposed')}
              >
                Proposed · {proposedPerspective}
              </button>
            </div>
          )}

          {portfolio ? (
            <div className="breakCounter" aria-live="polite">
              <div>
                <strong>{mapPerspective === 'proposed' ? counts.regressions : counts.total}</strong>
                <span>
                  {mapPerspective === 'proposed'
                    ? counts.regressions === 1 ? 'usage breaks' : 'usages break'
                    : counts.total === 1 ? 'usage · published baseline' : 'usages · published baseline'}
                </span>
              </div>
              <p>{distributionLine}</p>
              {mapPerspective === 'proposed' && counts.regressions === 0 && (
                <p>No downstream usage gets worse under this proposed rights state.</p>
              )}
            </div>
          ) : null}

          {portfolio && selectedImpact && (
            <article className="selectedUsage" aria-label="Selected usage">
              <p className="cardKicker">{selectedImpact.usage.id === riskiest?.usage.id ? 'Highest-risk usage' : 'Selected usage'}</p>
              <h2>{selectedImpact.usage.title}</h2>
              <div className="transition">
                <StatusPill status={selectedImpact.currentStatus} />
                <span className="arrow" aria-label="becomes">→</span>
                <span className="statusLarge"><StatusPill status={selectedImpact.proposedStatus} /></span>
              </div>
              <p className="selectedCause">{selectedCause}</p>
              <p className="selectedMeta">
                {selectedImpact.usage.territory} · {formatChannel(selectedImpact.usage.channel)} · {selectedImpact.usage.isPaid ? 'paid' : 'organic'}
                {' · '}
                {selectedImpact.proposedStatus === 'UNKNOWN' && selectedImpact.repairCount === 0
                  ? 'no supported repair, permission will not be inferred'
                  : `${selectedImpact.repairCount} supported action${selectedImpact.repairCount === 1 ? '' : 's'}`}
              </p>
              <button
                className="primaryButton"
                onClick={() => openImpact(selectedImpact.usage.id)}
                disabled={busy !== null}
              >
                {busy === 'open' ? 'Opening case file…' : 'Open case file →'}
              </button>
            </article>
          )}

          <div className="heroActions">
            {portfolio ? (
              <button className="secondaryButton" onClick={() => scan({keepReceipt: true})} disabled={busy !== null}>
                {busy === 'scan' ? 'Rescanning…' : 'Rescan live graph'}
              </button>
            ) : (
              <button className="primaryButton" onClick={() => scan()} disabled={busy !== null}>
                {busy === 'scan' ? 'Scanning live graph…' : 'Scan live rights graph'}
              </button>
            )}
            <a className="textLink" href="#scenario-lab">Create scenario</a>
          </div>

          <p className="heroStateLine">
            {portfolio
              ? `published → ${proposedPerspective} · observed ${formatWhen(portfolio.observedAt)} · graph read via Context MCP`
              : 'No impact scan yet. Nothing on the map is invented: it fills only from the live graph.'}
          </p>

          {proposedPerspective !== 'drafts' && (
            <div className="proposalNote">
              Release perspective is analysis-only. Human-approved mutation and proof persistence remain locked to the drafts path.
            </div>
          )}
        </div>

        <ShockwaveMap
          impacts={portfolio?.impacts ?? null}
          perspective={mapPerspective}
          selectedId={selectedImpact?.usage.id ?? null}
          changedRights={rightsChanges?.summary.changedRightsDocuments ?? null}
          onSelect={setSelectedUsageId}
          busy={busy !== null}
        />
      </section>

      <ol className="stageStrip" aria-label="How a verdict is reached">
        <li><span>01 Change</span><strong>Field-level rights diff</strong><small>published vs proposed</small></li>
        <li><span>02 Why</span><strong>Deterministic, per axis</strong><small>territory · channel · paid · window</small></li>
        <li><span>03 Evidence</span><strong>Source clause per right</strong><small>Knowledge Base, never substituted</small></li>
        <li><span>04 Action</span><strong>Registered repairs only</strong><small>human approval before any write</small></li>
      </ol>

      {error && <div className="errorBanner pageBanner" role="alert">{error}</div>}

      {writeRecovery && (
        <div className="writeRecoveryPanel pageBanner">
          <div>
            <strong>Write outcome requires reconciliation</strong>
            <span>
              {writeRecovery.code}. Do not repeat the business mutation until the current proof and usage state are reread.
            </span>
            <code>{writeRecovery.baselineProofId}</code>
          </div>
          <button
            className="dangerButton"
            onClick={reconcileWriteOutcome}
            disabled={busy !== null}
          >
            {busy === 'recover' ? 'Reconciling…' : 'Reconcile write outcome'}
          </button>
        </div>
      )}

      {recoveryResult && (
        <div className="proposalNote pageBanner">
          Recovery state: <strong>{recoveryResult.state}</strong>
          {recoveryResult.action ? <span> · {recoveryResult.action}</span> : null}
        </div>
      )}

      {portfolio && (
        <section className="workspace" id="blast-radius">
          <div className="portfolioHeader">
            <div>
              <p className="cardKicker">Blast radius</p>
              <h2>{portfolio.summary.affectedUsageRequests} of {portfolio.summary.totalUsageRequests} usages change status</h2>
              <p className="muted">
                Every downstream usage under the proposed rights state, most severe first.
                {lastLiveSync ? ` Last live sync ${formatWhen(lastLiveSync)}.` : ''}
              </p>
            </div>
          </div>

          {receipt && (!detail || detail.usage.id !== receipt.usageRequestId) && (
            <article className="panel successPanel">
              <div className="panelHeading">
                <span className="stepIndex">✓</span>
                <div>
                  <p className="cardKicker">Post-write receipt</p>
                  <h3>{receipt.label}</h3>
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
                <span>Usage</span><strong>{receipt.usageRequestId}</strong>
                <span>Mutation</span><strong>{receipt.mutation.field} → {String(receipt.mutation.value)}</strong>
                <span>Approval</span><strong>explicit human action</strong>
                <span>Observed</span><strong>{formatWhen(receipt.observedAt)}</strong>
              </div>
            </article>
          )}

          <section className="operatorFilterPanel">
            <div className="operatorFilterHeader">
              <div>
                <p className="cardKicker">Operator controls</p>
                <h3>Search and narrow the live portfolio</h3>
              </div>
              <div className="filterSummary">
                <strong>{filteredImpacts.length}</strong>
                <span>of {portfolio.impacts.length} usages visible</span>
                {activeFilterCount > 0 && <span>· {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}</span>}
              </div>
            </div>

            <div className="operatorFilters">
              <label className="filterSearch">
                <span>Search</span>
                <input
                  type="search"
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({...current, search: event.target.value}))}
                  placeholder="Usage, asset, right, territory, channel…"
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({...current, status: event.target.value}))}
                >
                  <option value="ALL">All statuses</option>
                  {filterOptions.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>

              <label>
                <span>Territory</span>
                <select
                  value={filters.territory}
                  onChange={(event) => setFilters((current) => ({...current, territory: event.target.value}))}
                >
                  <option value="ALL">All territories</option>
                  {filterOptions.territories.map((territory) => <option key={territory} value={territory}>{territory}</option>)}
                </select>
              </label>

              <label>
                <span>Channel</span>
                <select
                  value={filters.channel}
                  onChange={(event) => setFilters((current) => ({...current, channel: event.target.value}))}
                >
                  <option value="ALL">All channels</option>
                  {filterOptions.channels.map((channel) => <option key={channel} value={channel}>{formatChannel(channel)}</option>)}
                </select>
              </label>

              <label>
                <span>Asset</span>
                <select
                  value={filters.asset}
                  onChange={(event) => setFilters((current) => ({...current, asset: event.target.value}))}
                >
                  <option value="ALL">All assets</option>
                  {filterOptions.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.title}</option>)}
                </select>
              </label>

              <label>
                <span>Causal right</span>
                <select
                  value={filters.causalRight}
                  onChange={(event) => setFilters((current) => ({...current, causalRight: event.target.value}))}
                >
                  <option value="ALL">All rights</option>
                  {filterOptions.causalRights.map((right) => <option key={right.id} value={right.id}>{right.title}</option>)}
                </select>
              </label>
            </div>

            {activeFilterCount > 0 && (
              <button
                className="textButton"
                onClick={() => setFilters({...EMPTY_IMPACT_FILTERS})}
              >
                Clear all filters
              </button>
            )}
          </section>

          <section className="impactSection">
            <div className="sectionHeading">
              <div>
                <p className="cardKicker">Affected usage requests</p>
                <h2>Needs operator attention</h2>
              </div>
            </div>

            {affected.length === 0 ? (
              <article className="panel emptyState">
                <StatusPill status="CLEAR" />
                <h3>No published → draft regressions are currently observed.</h3>
                <p className="muted">The proposed graph may still contain REVIEW or UNKNOWN states; stable items remain visible below.</p>
              </article>
            ) : (
              <div className="impactList">
                {affected.map((impact) => (
                  <button
                    className="impactRow"
                    key={impact.usage.id}
                    onClick={() => openImpact(impact.usage.id)}
                    disabled={busy !== null}
                  >
                    <div className="impactIdentity">
                      <strong>{impact.usage.title}</strong>
                      <span>{impact.usage.assetTitle} · {impact.usage.territory} · {formatChannel(impact.usage.channel)}</span>
                    </div>
                    <div className="impactAxes">
                      {impact.changedAxes.map((axis) => <span key={axis.axis}>{axis.axis}</span>)}
                    </div>
                    <div className="transition">
                      <StatusPill status={impact.currentStatus} />
                      <span className="arrow">→</span>
                      <StatusPill status={impact.proposedStatus} />
                    </div>
                    <span className="rowAction">{busy === 'open' ? 'Opening…' : 'Open impact →'}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {stable.length > 0 && (
            <details className="stableDetails">
              <summary>{stable.length} usage request{stable.length === 1 ? '' : 's'} without a perspective regression</summary>
              <div className="impactList">
                {stable.map((impact) => (
                  <button
                    className="impactRow impactRow--stable"
                    key={impact.usage.id}
                    onClick={() => openImpact(impact.usage.id)}
                    disabled={busy !== null}
                  >
                    <div className="impactIdentity">
                      <strong>{impact.usage.title}</strong>
                      <span>{impact.usage.assetTitle}</span>
                    </div>
                    <div />
                    <div className="transition">
                      <StatusPill status={impact.currentStatus} />
                      <span className="arrow">→</span>
                      <StatusPill status={impact.proposedStatus} />
                    </div>
                    <span className="rowAction">Inspect →</span>
                  </button>
                ))}
              </div>
            </details>
          )}

          {rightsChanges && (
            <details className="changeDetails">
              <summary>
                View by rights change · {rightsChanges.summary.changedRightsDocuments} changed document{rightsChanges.summary.changedRightsDocuments === 1 ? '' : 's'}
              </summary>
              <RightsChangePortfolio
                data={rightsChanges}
                onOpenUsage={openImpact}
                busy={busy !== null}
              />
            </details>
          )}
        </section>
      )}

      {detail && (
        <div className="caseFileWrap">
          <CaseFile
            ref={detailRef}
            detail={detail}
            rightsChanges={rightsChanges?.changes ?? null}
            evidence={evidence}
            onLoadEvidence={loadEvidence}
            proposedPerspective={proposedPerspective}
            selectedRepair={selectedRepair}
            onSelectRepair={(repairId) => {setSelectedRepair(repairId); setApproved(false)}}
            approved={approved}
            onApprove={setApproved}
            onApply={applyRepair}
            busy={busy}
            receipt={receipt}
            onBack={backToMap}
          />
        </div>
      )}

      <section className="workspace scenarioWorkspace" id="scenario-lab">
        <ScenarioLab
          onOpenUsage={openImpact}
          liveRefreshCount={liveEventCount}
        />
      </section>

      <section className="workspace assuranceWorkspace" id="system" aria-labelledby="system-title">
        <div className="sectionHeading">
          <div>
            <p className="cardKicker">Engine &amp; assurance</p>
            <h2 id="system-title">How every verdict on this page is produced</h2>
          </div>
        </div>

        <ol className="productEngine" aria-label="Live product engine">
          <li><code>Sanity Context MCP</code><span>graph read · published + {proposedPerspective}</span></li>
          <li><code>Deterministic evaluator</code><span>the only status authority</span></li>
          <li><code>Context Knowledge Base</code><span>source-bound evidence only</span></li>
          <li><code>Content Lake transaction</code><span>proof + human-approved writes</span></li>
        </ol>
        <p className="productEngineAside">
          <code>Live Content API</code> invalidates and re-reads automatically ({liveState === 'connected' ? `connected · ${liveRefreshCount} completed auto-refresh${liveRefreshCount === 1 ? '' : 'es'}` : liveState}).
          {' '}<code>Sanity Content Agent</code> explains on request, with no decision or write authority.
        </p>

        <details className="assuranceDetails">
          <summary>Live integration receipt · time to first value</summary>
          <div className="liveReceipt">
            <span className={`liveDot liveDot--${liveState}`} />
            <div>
              <strong>Live integration receipt</strong>
              <span>
                {autoRefreshReceipt
                  ? `AUTO #${autoRefreshReceipt.sequence} · ${autoRefreshReceipt.triggerType}${autoRefreshReceipt.triggerId ? ` · ${autoRefreshReceipt.triggerId}` : ''} · completed ${formatWhen(autoRefreshReceipt.completedAt)}`
                  : lastLiveEvent
                    ? `Event received · ${lastLiveEvent.type}${lastLiveEvent.id ? ` · ${lastLiveEvent.id}` : ''} · waiting for an active portfolio to auto-refresh`
                    : 'Waiting for the next Sanity content event…'}
              </span>
              {autoRefreshReceipt && (
                <span>
                  Sanity Live Content API → Context MCP reread · affected {autoRefreshReceipt.beforeAffected ?? '—'} → {autoRefreshReceipt.afterAffected}
                </span>
              )}
              <span>Time to first value: {lastTtfvMs == null ? 'not measured yet' : `${lastTtfvMs} ms (scan click → usable impact + rights-change portfolio)`}</span>
            </div>
            <div>
              <strong>{liveRefreshCount}</strong>
              <span>completed automatic graph refreshes</span>
            </div>
          </div>
        </details>

        <details className="assuranceDetails">
          <summary>Proof integrity audit</summary>
          <ProofIntegrityPanel />
        </details>

        <details className="assuranceDetails">
          <summary>Proposed content perspective · {proposedPerspective}</summary>
          <div className="perspectiveControl">
            <div>
              <p className="cardKicker">Proposed content perspective</p>
              <strong>{proposedPerspective}</strong>
              <span>
                Use <code>drafts</code> for the write-capable product path, or enter a Sanity Content Release id for read-only impact analysis.
              </span>
            </div>
            <div className="perspectiveInput">
              <input
                aria-label="Proposed perspective"
                value={perspectiveInput}
                onChange={(event) => setPerspectiveInput(event.target.value)}
                placeholder="drafts or release-id"
              />
              <button
                className="secondaryButton"
                onClick={() => {
                  const value = perspectiveInput.trim() || 'drafts'
                  setProposedPerspective(value)
                  setPortfolio(null)
                  setRightsChanges(null)
                  setDetail(null)
                  scannedRef.current = false
                  openUsageRef.current = null
                }}
              >
                Apply perspective
              </button>
            </div>
          </div>
        </details>
      </section>

      <footer>
        <div>
          <strong>Clearance Room</strong>
          <span>Live product · deterministic decisions · source-bound evidence · human-approved writes.</span>
        </div>
        <button className="textButton" onClick={resetSeededHarness} disabled={busy !== null}>
          {busy === 'reset' ? 'Restoring…' : 'Restore canonical test scenario'}
        </button>
      </footer>
    </main>
  )
}
