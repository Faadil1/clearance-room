'use client'

import {forwardRef} from 'react'
import ClearanceAgentPanel from './ClearanceAgentPanel'
import {
  buildProofChain,
  changesForUsage,
  orderedFindings,
  primaryFinding,
  repairPreview,
  rightTitles,
  type CaseCausalRight,
  type CaseFinding,
  type CaseRepair,
  type CaseRightsChange,
  type CaseUsage,
  type ProofHistoryEntry,
  type ProofReceipt,
} from '../../src/caseFile'

type Status = 'CLEAR' | 'BLOCK' | 'REVIEW' | 'UNKNOWN'

export type CaseDetail = {
  usage: CaseUsage & {assetTitle: string}
  current: {status: Status; findings: CaseFinding[]}
  proposed: {status: Status; findings: CaseFinding[]}
  diff: {from: Status; to: Status; changed: boolean; changedAxes: Array<{axis: string; from: Status; to: Status; causedBy: string[]}>}
  causalRights: CaseCausalRight[]
  repairs: CaseRepair[]
  persistedProof: {id: string; rev?: string} | null
  proofHistory: ProofHistoryEntry[]
  observedAt: string
  truth?: Record<string, string | undefined>
}

export type EvidenceRecord = {
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

export type EvidencePayload = {
  knowledgeBase: string
  entryPath: string
  requestedDocumentId: string
  canonicalDocumentId: string
  kb: {status: 'indexed' | 'not_indexed' | 'unavailable'; evidence: EvidenceRecord | null; reason?: string}
  structured: {status: 'available' | 'missing'; evidence: EvidenceRecord | null}
  authority: {knowledgeBase: string; structuredGraph: string; clearanceStatus: string}
  observedAt: string
}

export type EvidenceState =
  | {status: 'loading'}
  | {status: 'ready'; data: EvidencePayload}
  | {status: 'error'; message: string}

function StatusPill({status, size}: {status: string; size?: 'lg' | 'xl'}) {
  return (
    <span className={`status status--${status.toLowerCase()} ${size ? `status--${size}` : ''}`}>
      {status}
      {status === 'UNKNOWN' && <span className="visuallyHidden"> (insufficient evidence)</span>}
    </span>
  )
}

function formatChannel(value: string) {
  return value.replaceAll('_', ' ')
}

function formatWhen(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function formatTime(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
}

function MarginNote({tag, children}: {tag: string; children?: React.ReactNode}) {
  return (
    <div className="marginNote">
      <span className="marginTag">{tag}</span>
      {children && <p>{children}</p>}
    </div>
  )
}

type Props = {
  detail: CaseDetail
  rightsChanges: CaseRightsChange[] | null
  evidence: Record<string, EvidenceState>
  onLoadEvidence: (documentId: string) => void
  proposedPerspective: string
  selectedRepair: string | null
  onSelectRepair: (repairId: string) => void
  approved: boolean
  onApprove: (value: boolean) => void
  onApply: () => void
  busy: string | null
  receipt: ProofReceipt | null
  onBack: () => void
}

const CaseFile = forwardRef<HTMLElement, Props>(function CaseFile(
  {
    detail,
    rightsChanges,
    evidence,
    onLoadEvidence,
    proposedPerspective,
    selectedRepair,
    onSelectRepair,
    approved,
    onApprove,
    onApply,
    busy,
    receipt,
    onBack,
  },
  ref,
) {
  const changedAxisNames = detail.diff.changedAxes.map((axis) => axis.axis)
  const finding = primaryFinding(detail.proposed.findings, changedAxisNames)
  const causeTitles = finding ? rightTitles(finding.causedBy, detail.causalRights) : []
  const changes = changesForUsage(detail.usage.id, changedAxisNames, rightsChanges)
  const ledger = orderedFindings(detail.proposed.findings)
  const changedByAxis = new Map(detail.diff.changedAxes.map((axis) => [axis.axis, axis]))
  const isUnknown = detail.proposed.status === 'UNKNOWN'
  const writable = proposedPerspective === 'drafts'
  const selectedRepairOption = detail.repairs.find((repair) => repair.id === selectedRepair) ?? null
  const caseReceipt = receipt && receipt.usageRequestId === detail.usage.id ? receipt : null
  const chain = caseReceipt ? buildProofChain(caseReceipt, detail.proofHistory) : []
  const unknownFinding = isUnknown ? detail.proposed.findings.find((item) => item.status === 'UNKNOWN') ?? null : null

  return (
    <section
      className="caseFile"
      id="case-file"
      ref={ref}
      tabIndex={-1}
      aria-labelledby="case-title"
      aria-live="polite"
    >
      <div className="caseNav">
        <button type="button" className="textButton caseBack" onClick={onBack}>
          ← Back to the map
        </button>
        <span className="caseNavNote">Case file for the point selected on the map</span>
      </div>

      <header className="caseHeader">
        <div className="caseHeaderMain">
          <p className="caseKicker">Case file · {detail.usage.assetTitle}</p>
          <h2 id="case-title">{detail.usage.title}</h2>
          <div className="caseVerdict" aria-label={`Verdict changes from ${detail.current.status} to ${detail.proposed.status}`}>
            <div>
              <span className="caseVerdictLabel">Published</span>
              <StatusPill status={detail.current.status} size="lg" />
            </div>
            <span className="caseVerdictArrow" aria-hidden="true">→</span>
            <div>
              <span className="caseVerdictLabel">Proposed · {proposedPerspective}</span>
              <StatusPill status={detail.proposed.status} size="xl" />
            </div>
          </div>
          <p className="caseMeta">
            {detail.usage.territory} · {formatChannel(detail.usage.channel)} · {detail.usage.isPaid ? 'paid media' : 'organic'} · {detail.usage.startDate} to {detail.usage.endDate}
          </p>
        </div>

        <dl className="caseSummary">
          <div>
            <dt>Why it changed</dt>
            <dd>
              {finding
                ? finding.reason
                : detail.diff.changed
                  ? 'Every axis is CLEAR under the proposed rights state.'
                  : 'No status change under the proposed rights state.'}
            </dd>
          </div>
          <div>
            <dt>Caused by</dt>
            <dd>{causeTitles.length ? causeTitles.join(', ') : 'No governing right is implicated.'}</dd>
          </div>
          <div>
            <dt>Supported actions</dt>
            <dd>
              {!writable
                ? 'Analysis only on this perspective'
                : detail.repairs.length
                  ? `${detail.repairs.length} registered · human approval required`
                  : isUnknown
                    ? 'None · permission will not be inferred'
                    : 'None registered'}
            </dd>
          </div>
        </dl>
      </header>

      {/* 01 What changed */}
      <div className="caseSection">
        <span className="caseNum" aria-hidden="true">01</span>
        <div className="caseBody">
          <h3><span className="visuallyHidden">01 </span>What changed</h3>
          {rightsChanges === null ? (
            <p className="caseQuiet">Reading the rights-change diff…</p>
          ) : changes.length === 0 ? (
            <div className="caseQuiet">
              <p>No rights-document field change reaches this usage.</p>
              {detail.diff.changedAxes.length > 0 && (
                <p>
                  Axes that moved:{' '}
                  {detail.diff.changedAxes.map((axis) => `${axis.axis} ${axis.from} → ${axis.to}`).join(' · ')}
                </p>
              )}
            </div>
          ) : (
            <div className="changeStack">
              {changes.map((change) => (
                <article className="changeRecord" key={change.rightId}>
                  <p className="changeRecordTitle">
                    <strong>{change.rightTitle}</strong> <span>· {change.kind}</span>
                  </p>
                  {change.fields.filter((field) => field.material).map((field) => (
                    <div className="fieldChange fieldChange--material" key={field.field}>
                      <span className="fieldChangeLabel">{field.label}</span>
                      <span className="fieldChangeFrom">{field.from}</span>
                      <span className="fieldChangeArrow" aria-label="changes to">→</span>
                      <span className={`fieldChangeTo ${field.to === 'NOT DOCUMENTED' ? 'fieldChangeTo--missing' : ''}`}>{field.to}</span>
                    </div>
                  ))}
                  {change.fields.filter((field) => !field.material).length > 0 && (
                    <details className="caseDisclosure">
                      <summary>
                        {change.fields.filter((field) => field.material).length > 0 ? 'Other changed fields' : 'Changed fields'} ({change.fields.filter((field) => !field.material).length})
                      </summary>
                      {change.fields.filter((field) => !field.material).map((field) => (
                        <div className="fieldChange" key={field.field}>
                          <span className="fieldChangeLabel">{field.label}</span>
                          <span className="fieldChangeFrom">{field.from}</span>
                          <span className="fieldChangeArrow" aria-label="changes to">→</span>
                          <span className="fieldChangeTo">{field.to}</span>
                        </div>
                      ))}
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
        <aside className="caseMargin" aria-label="Margin notes">
          <MarginNote tag="Proposed state">Compared with published. This view does not execute a write.</MarginNote>
        </aside>
      </div>

      {/* 02 System verdict */}
      <div className="caseSection caseSection--verdict">
        <span className="caseNum" aria-hidden="true">02</span>
        <div className="caseBody">
          <h3><span className="visuallyHidden">02 </span>Why this verdict</h3>
          <div className="verdictLedger">
            <div className="verdictLedgerHead">
              <span className="verdictLedgerLabel">System verdict</span>
              <span className="verdictLedgerTransition">
                <StatusPill status={detail.current.status} />
                <span aria-hidden="true">→</span>
                <StatusPill status={detail.proposed.status} size="lg" />
              </span>
            </div>
            <ul>
              {ledger.map((item) => {
                const moved = changedByAxis.get(item.axis)
                const titles = rightTitles(item.causedBy, detail.causalRights)
                return (
                  <li key={item.axis} className={item.status === 'CLEAR' ? 'verdictRow verdictRow--clear' : 'verdictRow'}>
                    <span className="verdictAxis">Axis: {item.axis}</span>
                    <span className="verdictStatus">
                      <StatusPill status={item.status} />
                      {moved && <small>was {moved.from}</small>}
                    </span>
                    <span className="verdictReason">
                      {item.reason}
                      {item.status !== 'CLEAR' && titles.length > 0 && (
                        <em>Caused by: {titles.join(', ')}</em>
                      )}
                      {item.allowedThrough && <em>Allowed through {item.allowedThrough}</em>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        <aside className="caseMargin" aria-label="Margin notes">
          <MarginNote tag="Deterministic">Computed by the evaluator from structured rights fields. Final status is the most severe axis.</MarginNote>
          <MarginNote tag="AI cannot override" />
        </aside>
      </div>

      {/* 03 Source evidence */}
      <div className="caseSection">
        <span className="caseNum" aria-hidden="true">03</span>
        <div className="caseBody">
          <h3><span className="visuallyHidden">03 </span>Source evidence</h3>
          {detail.causalRights.length === 0 ? (
            <p className="caseQuiet">No causal rights document was identified for this state.</p>
          ) : (
            <div className="evidenceStack">
              {detail.causalRights.map((right) => {
                const state = evidence[right.id]
                const payload = state?.status === 'ready' ? state.data : null
                const record = payload ? payload.kb.evidence || payload.structured.evidence : null
                return (
                  <figure className="evidenceRecord" key={right.id}>
                    <figcaption className="evidenceTitle">
                      <strong>{right.title}</strong>
                      <span>{right.kind.replaceAll('_', ' ')}</span>
                    </figcaption>

                    {!state && (
                      <button type="button" className="secondaryButton" onClick={() => onLoadEvidence(right.id)}>
                        Open source evidence
                      </button>
                    )}
                    {state?.status === 'loading' && <p className="caseQuiet">Retrieving the source…</p>}
                    {state?.status === 'error' && (
                      <div className="caseQuiet">
                        <p>Evidence could not be retrieved: {state.message}. The verdict above does not depend on it.</p>
                        <button type="button" className="secondaryButton" onClick={() => onLoadEvidence(right.id)}>Retry</button>
                      </div>
                    )}

                    {payload && payload.kb.status === 'not_indexed' && (
                      <p className="caseQuiet">Not indexed in the Knowledge Base yet. Shown from the live published rights graph; no unrelated entry is substituted.</p>
                    )}
                    {payload && payload.kb.status === 'unavailable' && (
                      <p className="caseQuiet">Knowledge Base temporarily unavailable. Shown from the structured graph when available; no KB claim is made.</p>
                    )}

                    {payload && !record && (
                      <p className="caseQuiet">No source-bound evidence is currently available for this rights document.</p>
                    )}

                    {record && (
                      <>
                        <blockquote className="evidenceClause">{record.sourceClause}</blockquote>
                        <dl className="evidenceFacts">
                          <div><dt>Territories</dt><dd>{record.territories || 'NOT DOCUMENTED'}</dd></div>
                          <div><dt>Channels</dt><dd>{record.channels ? formatChannel(record.channels) : 'NOT DOCUMENTED'}</dd></div>
                          <div><dt>Paid advertising</dt><dd>{record.paidAdvertising || 'NOT DOCUMENTED'}</dd></div>
                          <div><dt>Validity</dt><dd>{record.validFrom || 'NOT DOCUMENTED'} to {record.validTo || 'NOT DOCUMENTED'}</dd></div>
                          <div><dt>Source</dt><dd>{payload?.kb.status === 'indexed' ? 'Knowledge Base, indexed' : 'Structured rights graph'}</dd></div>
                          <div><dt>Revision</dt><dd>{record.revision ? <code>{record.revision.slice(0, 10)}</code> : '—'}</dd></div>
                        </dl>
                        <details className="caseDisclosure">
                          <summary>View source receipt</summary>
                          <dl className="receiptList">
                            <div><dt>Document</dt><dd><code>{record.documentId}</code></dd></div>
                            <div><dt>Canonical id</dt><dd><code>{payload?.canonicalDocumentId}</code></dd></div>
                            <div><dt>Revision</dt><dd><code>{record.revision || '—'}</code></dd></div>
                            <div><dt>Knowledge Base</dt><dd>{payload?.knowledgeBase} · {payload?.kb.status}</dd></div>
                            <div><dt>Entry path</dt><dd><code>{payload?.entryPath}</code></dd></div>
                            <div><dt>Status authority</dt><dd>{payload?.authority.clearanceStatus}</dd></div>
                            <div><dt>Observed</dt><dd>{formatWhen(payload?.observedAt)}</dd></div>
                          </dl>
                        </details>
                      </>
                    )}
                  </figure>
                )
              })}
            </div>
          )}
        </div>
        <aside className="caseMargin" aria-label="Margin notes">
          <MarginNote tag="Source bound">Quoted from the rights document. Never substituted or paraphrased.</MarginNote>
        </aside>
      </div>

      {/* 04 Agent explanation */}
      <div className="caseSection caseSection--agent">
        <span className="caseNum" aria-hidden="true">04</span>
        <div className="caseBody">
          <h3><span className="visuallyHidden">04 </span>Agent boundary</h3>
          {isUnknown && (
            <div className="abstention" role="note">
              <span className="abstentionTag">Insufficient evidence</span>
              <p className="abstentionLead">
                No supported repair can be recommended. The verdict stays UNKNOWN until the missing rights data is documented.
              </p>
              {unknownFinding && (
                <p className="abstentionFinding">
                  Deterministic finding · {unknownFinding.axis}: {unknownFinding.reason}
                </p>
              )}
              <p className="abstentionNote">The agent is required to abstain on UNKNOWN. Clearance Room will not infer permission or prohibition.</p>
            </div>
          )}
          <ClearanceAgentPanel
            usageRequestId={detail.usage.id}
            proposedPerspective={proposedPerspective}
          />
        </div>
        <aside className="caseMargin" aria-label="Margin notes">
          <MarginNote tag="AI cannot override">Narratives that contradict the system verdict are rejected.</MarginNote>
        </aside>
      </div>

      {/* 05 Supported action */}
      <div className={`caseSection ${detail.repairs.length === 0 ? 'caseSection--compact' : ''}`}>
        <span className="caseNum" aria-hidden="true">05</span>
        <div className="caseBody">
          <h3><span className="visuallyHidden">05 </span>Supported action</h3>
          {!writable ? (
            <p className="caseQuiet">This perspective is analysis-only. Switch back to <code>drafts</code> before any consequential remediation.</p>
          ) : detail.repairs.length === 0 ? (
            <div className={`noRepair ${isUnknown ? 'noRepair--unknown' : ''}`}>
              <span className="noRepairTag">No supported repair</span>
              <p>
                {isUnknown
                  ? 'Clearance is UNKNOWN because required structured evidence is missing. Complete the missing rights data, then recompile.'
                  : detail.proposed.status === 'CLEAR'
                    ? 'No repair is registered; the proposed verdict is CLEAR.'
                    : 'No safe structured remediation is registered for the observed findings. The product will not invent one.'}
              </p>
            </div>
          ) : (
            <fieldset className="repairChoices">
              <legend>Registered for this verdict</legend>
              {detail.repairs.map((repair) => {
                const preview = repairPreview(repair, detail.usage)
                return (
                  <label className={`repairChoice ${selectedRepair === repair.id ? 'repairChoice--selected' : ''}`} key={repair.id}>
                    <input
                      type="radio"
                      name="case-repair"
                      value={repair.id}
                      checked={selectedRepair === repair.id}
                      onChange={() => onSelectRepair(repair.id)}
                    />
                    <span className="repairChoiceBody">
                      <strong>{repair.label}</strong>
                      <span className="repairChoiceDiff">
                        {preview.label}: <code>{preview.from}</code> → <code>{preview.to}</code>
                      </span>
                      <small>{repair.description} Based on the {repair.basedOnAxis} finding.</small>
                    </span>
                  </label>
                )
              })}
              <p className="recomputeNote">The final verdict will be recomputed after the write. No outcome is claimed here.</p>
            </fieldset>
          )}
        </div>
        <aside className="caseMargin" aria-label="Margin notes">
          <MarginNote tag="Registry only">Only repairs registered for this finding are offered.</MarginNote>
        </aside>
      </div>

      {/* 06 Human approval */}
      <div className={`caseSection ${!caseReceipt && (!writable || detail.repairs.length === 0) ? 'caseSection--compact' : ''}`}>
        <span className="caseNum" aria-hidden="true">06</span>
        <div className="caseBody">
          <h3><span className="visuallyHidden">06 </span>Human approval</h3>
          {caseReceipt ? (
            <p className="caseQuiet">You approved <strong>{caseReceipt.label}</strong>. The write and its recompiled proof are recorded in the proof chain below.</p>
          ) : writable && detail.repairs.length > 0 ? (
            <div className="approvalGate">
              <span className="approvalTag">Human approval required</span>
              {selectedRepairOption ? (
                <>
                  <label className="approvalCheck">
                    <input
                      type="checkbox"
                      checked={approved}
                      onChange={(event) => onApprove(event.target.checked)}
                    />
                    <span>
                      I approve this rights-impacting change on <strong>{detail.usage.title}</strong>:{' '}
                      <code>{selectedRepairOption.mutation.field} → {String(selectedRepairOption.mutation.value)}</code>
                    </span>
                  </label>
                  <div className="approvalActions">
                    <span className="approvalSignature">{approved ? 'Approved by you · ready to write' : 'Awaiting your approval'}</span>
                    <button className="dangerButton approvalButton" onClick={onApply} disabled={!approved || busy !== null}>
                      {busy === 'remediate' ? 'Writing + recompiling…' : 'Approve, write and recompile'}
                    </button>
                  </div>
                </>
              ) : (
                <p className="caseQuiet">Select a supported action above to unlock approval.</p>
              )}
            </div>
          ) : (
            <p className="caseQuiet">Nothing can be written for this case, so no approval is requested.</p>
          )}
        </div>
        <aside className="caseMargin" aria-label="Margin notes">
          <MarginNote tag="Human approval">Only a person can authorize a write. The agent has no write authority.</MarginNote>
        </aside>
      </div>

      {/* 07 Proof chain */}
      <div className={`caseSection ${!caseReceipt && detail.proofHistory.length === 0 ? 'caseSection--compact' : ''}`}>
        <span className="caseNum" aria-hidden="true">07</span>
        <div className="caseBody">
          <h3><span className="visuallyHidden">07 </span>Proof chain</h3>
          {caseReceipt ? (
            <>
              <ol className="proofChain">
                {chain.map((event) => (
                  <li key={event.kind} className={`proofEvent proofEvent--${event.kind}`}>
                    <span className="proofTime">{formatTime(event.at) ?? '—'}</span>
                    <span className="proofMark" aria-hidden="true" />
                    <span className="proofText">
                      {event.status ? <StatusPill status={event.status} /> : <strong>{event.title}</strong>}
                      <span>{event.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <details className="caseDisclosure">
                <summary>View proof receipt</summary>
                <dl className="receiptList">
                  <div><dt>Previous proof</dt><dd><code>{caseReceipt.previousProof.id}</code> · {caseReceipt.previousProof.stale ? 'stale' : 'fresh'}</dd></div>
                  <div><dt>Replacement proof</dt><dd><code>{caseReceipt.newProof.id}</code> · supersedes <code>{caseReceipt.newProof.supersedes}</code></dd></div>
                  <div><dt>Mutation</dt><dd><code>{caseReceipt.mutation.field} → {String(caseReceipt.mutation.value)}</code></dd></div>
                  <div><dt>Approval</dt><dd>explicit human action</dd></div>
                  <div><dt>Observed</dt><dd>{formatWhen(caseReceipt.observedAt)}</dd></div>
                </dl>
              </details>
            </>
          ) : detail.proofHistory.length === 0 ? (
            <p className="caseQuiet">No persisted proof yet. A baseline proof is recorded when an approved write starts.</p>
          ) : (
            <ol className="proofChain">
              {detail.proofHistory.map((proof) => (
                <li key={proof._id} className={`proofEvent ${proof.isStale ? 'proofEvent--stale' : 'proofEvent--replacement'}`}>
                  <span className="proofTime">{formatTime(proof.evaluatedAt) ?? '—'}</span>
                  <span className="proofMark" aria-hidden="true" />
                  <span className="proofText">
                    <StatusPill status={proof.status} />
                    <span>{proof.isStale ? `Stale${proof.staleReason ? ` · ${proof.staleReason}` : ''}` : 'Fresh'}</span>
                    <code className="proofId">{proof._id}</code>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <aside className="caseMargin" aria-label="Margin notes">
          <MarginNote tag={caseReceipt ? 'Proof superseded' : 'Audit trail'}>
            Old proofs are kept and marked stale. History is never rewritten.
          </MarginNote>
        </aside>
      </div>

      <details className="caseDisclosure caseTechnical">
        <summary>Technical details</summary>
        <dl className="receiptList">
          <div><dt>Usage id</dt><dd><code>{detail.usage.id}</code></dd></div>
          <div><dt>Proposed proof</dt><dd><code>{detail.persistedProof?.id || 'not persisted'}</code></dd></div>
          <div><dt>Graph perspective</dt><dd>{detail.truth?.currentPerspective || 'published'} → {detail.truth?.proposedPerspective || proposedPerspective}</dd></div>
          <div><dt>Graph read</dt><dd>{detail.truth?.graphReadIntegration || '—'}</dd></div>
          <div><dt>Status authority</dt><dd>{detail.truth?.statusAuthority || '—'}</dd></div>
          <div><dt>Mutation mode</dt><dd>{detail.truth?.mutationMode || '—'}</dd></div>
          <div><dt>Observed</dt><dd>{formatWhen(detail.observedAt)}</dd></div>
        </dl>
      </details>
    </section>
  )
})

export default CaseFile
