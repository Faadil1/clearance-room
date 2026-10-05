'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import RightsChangePortfolio, {
  type RightsChangePortfolioData,
} from './components/RightsChangePortfolio'
import ScenarioLab from './components/ScenarioLab'
import ClearanceAgentPanel from './components/ClearanceAgentPanel'
import RuntimeHealthPanel from './components/RuntimeHealthPanel'
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

type EvidenceRecord = {
  documentId: string
  title: string
  kind: string | null
  channels: string | null
  territories: string | null
  paidAdvertising: string | null
  validFrom: string | null
  validTo: string | null
  sourceClause: string
  source: string
  revision?: string | null
}

type Evidence = {
  knowledgeBase: string
  entryPath: string
  requestedDocumentId: string
  canonicalDocumentId: string
  kb: {
    status: 'indexed' | 'not_indexed' | 'unavailable'
    evidence: EvidenceRecord | null
    reason?: string
  }
  structured: {
    status: 'available' | 'missing'
    evidence: EvidenceRecord | null
  }
  authority: {
    knowledgeBase: string
    structuredGraph: string
    clearanceStatus: string
  }
  observedAt: string
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
  const [evidence, setEvidence] = useState<Evidence | null>(null)
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
  const [liveState, setLiveState] = useState<'connecting' | 'connected' | 'reconnecting' | 'offline'>('connecting')
  const [lastLiveSync, setLastLiveSync] = useState<string | null>(null)
  const [lastLiveEvent, setLastLiveEvent] = useState<{type: string; id: string | null; observedAt: string} | null>(null)
  const [liveEventCount, setLiveEventCount] = useState(0)
  const [liveRefreshCount, setLiveRefreshCount] = useState(0)
  const [autoRefreshReceipt, setAutoRefreshReceipt] = useState<AutoRefreshReceipt | null>(null)
  const [filters, setFilters] = useState<ImpactFilters>({...EMPTY_IMPACT_FILTERS})
  const [proposedPerspective, setProposedPerspective] = useState('drafts')
  const [perspectiveInput, setPerspectiveInput] = useState('drafts')
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
    openUsageRef.current = null
    setBusy('scan')
    setError(null)
    setDetail(null)
    setEvidence(null)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blast-radius scan failed')
    } finally {
      setBusy(null)
    }
  }

  async function openImpact(usageRequestId: string) {
    openUsageRef.current = usageRequestId
    setBusy('open')
    setError(null)
    setEvidence(null)
    setReceipt(null)
    setSelectedRepair(null)
    setApproved(false)
    setWriteRecovery(null)
    setRecoveryResult(null)

    try {
      setDetail(await run('/api/analyze', {usageRequestId, proposedPerspective}))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impact analysis failed')
    } finally {
      setBusy(null)
    }
  }

  async function loadEvidence(documentId: string) {
    setBusy('evidence')
    setError(null)
    try {
      setEvidence(await run('/api/evidence', {documentId}))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evidence retrieval failed')
    } finally {
      setBusy(null)
    }
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
      })
      setReceipt(result)
      setDetail(null)
      openUsageRef.current = null
      setEvidence(null)
      setSelectedRepair(null)
      setApproved(false)

      const [refreshed, refreshedChanges] = await Promise.all([
        run('/api/impacts', {proposedPerspective}),
        run('/api/changes', {proposedPerspective}),
      ])
      portfolioRef.current = refreshed
      setPortfolio(refreshed)
      setRightsChanges(refreshedChanges)
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

  const selectedRepairOption = detail?.repairs.find((repair) => repair.id === selectedRepair)

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

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">CR</span>
          <span>Clearance Room</span>
        </div>
        <div className="runtimeBadge">
          <span className={`liveDot liveDot--${liveState}`} />
          {liveState === 'connected' ? 'Live sync connected' : liveState === 'offline' ? 'Live sync offline' : 'Connecting live sync…'}
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">Pre-publish rights impact operations</p>
        <h1>See what breaks before rights changes go live.</h1>
        <p className="lede">
          Scan every active usage request against published and proposed rights state, investigate the exact source of each impact,
          and repair what can be repaired without letting an AI invent the decision.
        </p>

        <div className="truthStrip" aria-label="System truth boundaries">
          <span>GRAPH · Sanity Context MCP</span>
          <span>SYNC · Live Content API</span>
          <span>STATUS · deterministic evaluator</span>
          <span>EVIDENCE · Sanity Knowledge Base</span>
          <span>WRITE · human approval required</span>
        </div>

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
          {proposedPerspective !== 'drafts' && (
            <div className="proposalNote">
              Release perspective is analysis-only. Human-approved mutation/proof persistence remains locked to the drafts path until release-write semantics are explicitly implemented and proven.
            </div>
          )}
        </div>

        {!portfolio && (
          <div className="launchCard">
            <div>
              <p className="cardKicker">Live product</p>
              <h2>Scan the current rights graph</h2>
              <p>
                Clearance Room will compare the published and draft perspectives for every live usage request and rank the resulting blast radius.
              </p>
            </div>
            <button className="primaryButton" onClick={() => scan()} disabled={busy !== null}>
              {busy === 'scan' ? 'Scanning live graph…' : 'Scan live blast radius'}
            </button>
          </div>
        )}

        {error && <div className="errorBanner" role="alert">{error}</div>}

        <RuntimeHealthPanel
          liveState={liveState}
          onManualScan={() => scan({keepReceipt: true})}
        />

        {writeRecovery && (
          <div className="writeRecoveryPanel">
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
          <div className="proposalNote">
            Recovery state: <strong>{recoveryResult.state}</strong>
            {recoveryResult.action ? <span> · {recoveryResult.action}</span> : null}
          </div>
        )}
      </section>

      <section className="workspace scenarioWorkspace">
        <ScenarioLab
          onOpenUsage={openImpact}
          liveRefreshCount={liveEventCount}
        />
      </section>

      {portfolio && (
        <section className="workspace">
          <div className="portfolioHeader">
            <div>
              <p className="cardKicker">Live blast radius</p>
              <h2>{portfolio.summary.affectedUsageRequests} of {portfolio.summary.totalUsageRequests} usages affected</h2>
              <p className="muted">
                Observed {formatWhen(portfolio.observedAt)} · published → {proposedPerspective} · graph read via Context MCP
                {lastLiveSync ? ` · last live sync ${formatWhen(lastLiveSync)}` : ''}
              </p>
            </div>
            <button className="secondaryButton" onClick={() => scan({keepReceipt: true})} disabled={busy !== null}>
              {busy === 'scan' ? 'Refreshing…' : 'Refresh graph'}
            </button>
          </div>

          <div className="metricGrid">
            <div className="metricCard"><span>Affected</span><strong>{portfolio.summary.affectedUsageRequests}</strong></div>
            <div className="metricCard"><span>Blocked</span><strong>{portfolio.summary.blocked}</strong></div>
            <div className="metricCard"><span>Review</span><strong>{portfolio.summary.review}</strong></div>
            <div className="metricCard"><span>Unknown</span><strong>{portfolio.summary.unknown}</strong></div>
            <div className="metricCard"><span>Clear proposed</span><strong>{portfolio.summary.clear}</strong></div>
          </div>

          <div className="integrationRail" aria-label="Load-bearing integrations">
            <div>
              <span>Graph read</span>
              <strong>Sanity Context MCP</strong>
              <small>load-bearing · published + {proposedPerspective}</small>
            </div>
            <div>
              <span>Realtime</span>
              <strong>Sanity Live Content API</strong>
              <small>{liveState === 'connected' ? `connected · drafts included · ${liveRefreshCount} completed auto-refresh${liveRefreshCount === 1 ? '' : 'es'}` : liveState}</small>
            </div>
            <div>
              <span>Evidence</span>
              <strong>Context Knowledge Base</strong>
              <small>source-bound · evidence only</small>
            </div>
            <div>
              <span>Writes</span>
              <strong>Content Lake transaction</strong>
              <small>human-approved · proof staleness atomic</small>
            </div>
          </div>

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
            </div>
            <div>
              <strong>{liveRefreshCount}</strong>
              <span>completed automatic graph refreshes</span>
            </div>
          </div>

          {rightsChanges && (
            <RightsChangePortfolio
              data={rightsChanges}
              onOpenUsage={openImpact}
              busy={busy !== null}
            />
          )}

          {receipt && (
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
        </section>
      )}

      {detail && (
        <section className="workspace detailWorkspace" aria-live="polite">
          <div className="detailHeader">
            <button className="textButton" onClick={() => {setDetail(null); setEvidence(null); openUsageRef.current = null}}>← Back to blast radius</button>
            <div className="transition">
              <StatusPill status={detail.current.status} />
              <span className="arrow">→</span>
              <StatusPill status={detail.proposed.status} />
            </div>
          </div>

          <div className="impactHeader">
            <div>
              <p className="cardKicker">Usage impact</p>
              <h2>{detail.usage.title}</h2>
              <p className="muted">
                {detail.usage.assetTitle} · {detail.usage.territory} · {formatChannel(detail.usage.channel)} · {detail.usage.isPaid ? 'paid media' : 'organic'}
              </p>
            </div>
            <div className="proofBadge">
              <span>Proposed proof</span>
              <code>{detail.persistedProof?.id || 'not persisted'}</code>
            </div>
          </div>

          <div className="splitGrid">
            <article className="panel">
              <div className="panelHeading">
                <span className="stepIndex">01</span>
                <div>
                  <p className="cardKicker">Deterministic findings</p>
                  <h3>{detail.diff.changed ? 'Perspective change detected' : 'No perspective regression'}</h3>
                </div>
              </div>
              <div className="findingStack">
                {detail.proposed.findings.map((finding) => (
                  <div className="findingCard" key={finding.axis}>
                    <div>
                      <strong>{finding.axis}</strong>
                      <StatusPill status={finding.status} />
                    </div>
                    <p>{finding.reason}</p>
                    {finding.causedBy.length > 0 && <code>{finding.causedBy.join(', ')}</code>}
                    {finding.allowedThrough && <span className="findingMeta">allowed through {finding.allowedThrough}</span>}
                  </div>
                ))}
              </div>
            </article>

            <article className="panel panel--accent">
              <div className="panelHeading">
                <span className="stepIndex">02</span>
                <div>
                  <p className="cardKicker">Causal rights</p>
                  <h3>Open the exact source behind the impact</h3>
                </div>
              </div>

              {detail.causalRights.length === 0 ? (
                <p className="muted">No causal rights document was identified for this state.</p>
              ) : (
                <div className="rightsList">
                  {detail.causalRights.map((right) => (
                    <div className="rightCard" key={right.id}>
                      <strong>{right.title}</strong>
                      <code>{right.id}</code>
                      <p>{right.sourceClause || 'No structured source clause.'}</p>
                      <button className="secondaryButton" onClick={() => loadEvidence(right.id)} disabled={busy !== null}>
                        {busy === 'evidence' ? 'Retrieving…' : 'Open source evidence'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>

          {evidence && (() => {
            const sourceEvidence = evidence.kb.evidence || evidence.structured.evidence
            return (
              <article className="panel evidencePanel">
                <div className="panelHeading">
                  <span className="stepIndex">03</span>
                  <div>
                    <p className="cardKicker">Source-bound evidence</p>
                    <h3>{sourceEvidence?.title || evidence.canonicalDocumentId}</h3>
                  </div>
                  <span className="authorityBadge">
                    {evidence.kb.status === 'indexed' ? 'KB INDEXED' : 'STRUCTURED SOURCE'}
                  </span>
                </div>

                {evidence.kb.status === 'not_indexed' && (
                  <div className="proposalNote">
                    Knowledge Base evidence is not indexed for this document yet. Clearance Room will not substitute an unrelated entry. The source shown below comes from the live published rights graph and remains non-normative.
                  </div>
                )}

                {evidence.kb.status === 'unavailable' && (
                  <div className="proposalNote">
                    Knowledge Base is temporarily unavailable. Deterministic clearance remains independent of this outage; the structured source is shown when available and no KB claim is fabricated.
                  </div>
                )}

                {sourceEvidence ? (
                  <>
                    <blockquote>{sourceEvidence.sourceClause}</blockquote>
                    <div className="miniReceipt">
                      <span>Document</span><strong>{sourceEvidence.documentId}</strong>
                      <span>Kind</span><strong>{sourceEvidence.kind || '—'}</strong>
                      <span>Territories</span><strong>{sourceEvidence.territories || '—'}</strong>
                      <span>Channels</span><strong>{sourceEvidence.channels || '—'}</strong>
                      <span>Paid advertising</span><strong>{sourceEvidence.paidAdvertising || '—'}</strong>
                      <span>Valid through</span><strong>{sourceEvidence.validTo || '—'}</strong>
                      <span>Source</span><strong>{sourceEvidence.source}</strong>
                      <span>KB state</span><strong>{evidence.kb.status}</strong>
                      <span>Status authority</span><strong>deterministic evaluator only</strong>
                    </div>
                  </>
                ) : (
                  <div className="errorBanner">
                    No source-bound evidence is currently available for this rights document.
                  </div>
                )}
              </article>
            )
          })()}

          <div className="splitGrid">
            <article className="panel">
              <div className="panelHeading">
                <span className="stepIndex">04</span>
                <div>
                  <p className="cardKicker">Proof history</p>
                  <h3>Freshness and supersession</h3>
                </div>
              </div>
              {detail.proofHistory.length === 0 ? (
                <p className="muted">No persisted proof history yet.</p>
              ) : (
                <div className="historyList">
                  {detail.proofHistory.map((proof) => (
                    <div className="historyRow" key={proof._id}>
                      <div>
                        <strong>{proof._id}</strong>
                        <span>{formatWhen(proof.evaluatedAt)}</span>
                      </div>
                      <StatusPill status={proof.status} />
                      <span className={proof.isStale ? 'staleFlag' : 'freshFlag'}>{proof.isStale ? 'STALE' : 'FRESH'}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <ClearanceAgentPanel
              usageRequestId={detail.usage.id}
              proposedPerspective={proposedPerspective}
            />

            <article className="panel repairPanel">
              <div className="panelHeading">
                <span className="stepIndex">05</span>
                <div>
                  <p className="cardKicker">Available remediations</p>
                  <h3>Only actions justified by current findings</h3>
                </div>
              </div>

              {proposedPerspective !== 'drafts' ? (
                <div className="proposalNote">
                  This perspective is analysis-only. Switch back to <code>drafts</code> before any consequential remediation.
                </div>
              ) : detail.repairs.length === 0 ? (
                detail.proposed.status === 'UNKNOWN' ? (
                  <div className="proposalNote">
                    Clearance is UNKNOWN because required structured evidence is missing. Clearance Room will not convert missing evidence into permission or prohibition. Complete the missing rights data, then recompile.
                  </div>
                ) : (
                  <div className="proposalNote">
                    No safe structured remediation is registered for the observed findings. The product will not invent one.
                  </div>
                )
              ) : (
                <>
                  <div className="repairOptions">
                    {detail.repairs.map((repair) => (
                      <label className={`repairOption ${selectedRepair === repair.id ? 'repairOption--selected' : ''}`} key={repair.id}>
                        <input
                          type="radio"
                          name="repair"
                          value={repair.id}
                          checked={selectedRepair === repair.id}
                          onChange={() => {setSelectedRepair(repair.id); setApproved(false)}}
                        />
                        <span>
                          <strong>{repair.label}</strong>
                          <small>{repair.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>

                  {selectedRepairOption && (
                    <>
                      <p className="proposalNote">
                        Proposal only. Clearance will be recomputed after the approved write; no future status is claimed here.
                      </p>
                      <label className="approval">
                        <input
                          type="checkbox"
                          checked={approved}
                          onChange={(event) => setApproved(event.target.checked)}
                        />
                        <span>
                          I approve this mutation on <code>{detail.usage.id}</code>: <strong>{selectedRepairOption.mutation.field} → {String(selectedRepairOption.mutation.value)}</strong>.
                        </span>
                      </label>
                      <button className="dangerButton" onClick={applyRepair} disabled={!approved || busy !== null}>
                        {busy === 'remediate' ? 'Writing + recompiling…' : 'Approve repair and recompile'}
                      </button>
                    </>
                  )}
                </>
              )}
            </article>
          </div>
        </section>
      )}

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
