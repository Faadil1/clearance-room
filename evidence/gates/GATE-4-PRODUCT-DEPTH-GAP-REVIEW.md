# Post-Vertical-Slice Product Depth Gap Review

Date: 2026-10-04  
Status: ACTIVE

## Current proven depth

PROVEN:
- published vs drafts deterministic comparison
- real Sanity Context MCP endpoint
- persistent clearance proofs
- explicit human-approved mutation
- stale proof + replacement proof
- Knowledge Base evidence
- multi-usage portfolio surface
- finding-driven remediation registry
- immutable proof snapshots
- real Sanity writes
- build/test pipeline

PROVEN — live integration runtime:
- Context MCP is the product graph-read path for published + drafts
- Live Content API invalidates an already-open product view
- no manual Refresh graph action is required
- completed AUTO receipt is distinct from a manual refresh
- receipt records event type/id, completion time, Context MCP reread, and affected-count before→after
- runtime video shows `AUTO #2` after a user-created Sanity write
- rights-change view visibly updates from 2 changed fields to 1 changed field after the automatic reread

ACTIVE / needs runtime proof:
- multi-impact product behavior after canonical reset
- proof-history behavior across repeated real runs

RUNTIME PROVEN — user-defined Scenario Lab:
- PROVEN: user creates a scenario from product UI
- PROVEN: real Sanity rights/asset/usage documents are created
- PROVEN: created scenario enters the product as a first-class live usage
- PROVEN: user-created scenario opens in the same deterministic clearance engine
- PROVEN: structured proposed-right edit `paid permission ALLOW → PROHIBIT`
- PROVEN: UI previews the structured decision delta before save
- PROVEN: deterministic recompute produces `CLEAR → BLOCK` on the `paid` axis
- PROVEN: causal right remains the user-created draft rights document
- PROVEN: finding-driven remediation `switch_to_organic` becomes available
- PROVEN: explicit human-approved remediation executes
- PROVEN: approval-time baseline proof records `BLOCK`
- PROVEN: baseline proof becomes `STALE`
- PROVEN: replacement proof becomes `CLEAR / FRESH`
- PROVEN: replacement proof supersedes the stale baseline
- PROVEN: post-write usage intent changes to `isPaid=false`
- IMPLEMENTED / proof pending: multiple governing rights in one user-created scenario
- IMPLEMENTED / proof pending: user-created scenario deletion
- SEPARATE PROOF STILL REQUIRED: visible no-action Live Content API auto-update of an already-open portfolio/detail view
- change-centric rights-document view
  - published vs draft field-level diff
  - revision identifiers
  - linked assets/usages
  - downstream deterministic status transitions
  - direct drill-down into affected usage
  - Live Content API refresh path includes rights-change view

RUNTIME PROVEN — operator filtering core:
- asset filter: 3 visible → 1 visible
- combined asset + causal-right filter: 1 visible → 0 visible
- active-filter count updates to 2
- filter intersection behavior is correct
- IMPLEMENTED / individual runtime proof pending: free-text search, proposed status, territory, channel
- visible result count + clear-all are present

MISSING / not yet load-bearing:
- agent orchestration in the product
- UNKNOWN / missing-evidence product path
- live integration degraded/offline recovery
- write-failure recovery
- second remediation class exercised through the browser
- native App SDK surface evaluation
- Workflows fit / availability verification
- release-aware perspective evaluation if available

## Immediate product expansion order

1. Runtime-prove multiple governing rights in one user-created scenario.
2. Exercise the window REVIEW path end-to-end through that user-created scenario.
3. Add explicit UNKNOWN path by allowing required structured evidence to be absent in a controlled user-created record.
4. Runtime-prove free-text/status/territory/channel operator filters.
5. Runtime-prove user-created scenario deletion.
7. Add product agent using MCP/KB + deterministic receipts.
8. Add recovery UI for MCP unavailable, Live API offline, KB unavailable, write failure.
9. Evaluate App SDK native surface and Workflows; mark PROVEN/N/A/BLOCKED with evidence.
10. Run final Product Depth Gap Review again before submission.

## Non-negotiable

Do not switch back to "demo polish" as the primary workstream until this gap list has been materially reduced and every remaining item is explicitly classified.


## Workstream priority enforcement

Central canon: `Faadil1/faadil-agent-system@ff101a6e79c20d5b9c3ba370bc48c9b07d5fd3fa` / Product Reality v1.4.

Current state:
- first live vertical slice: **PROVEN**
- remaining material depth gaps: **YES**
- primary workstream: **PRODUCT_EXPLOITATION**
- valid stop condition: **NONE**
- demo packaging allowed as primary workstream: **NO**
- prior drift: **CORRECTED_FROM_WORKSTREAM_DRIFT**
- next highest-value delta: **prove Context MCP + Live Content API as load-bearing runtime integrations**

At every material product touch, re-evaluate the gap list before changing workstream priority. If seeded reset, judge flow, replay, receipts, screenshots, video, story or submission packaging begin displacing justified live product depth, mark `WORKSTREAM_DRIFT` and restore product exploitation.

**Product architecture generates the demo path; the demo path must not define product architecture.**


## Runtime proof — 2026-10-04 user Scenario Lab edit

RUNTIME PROVEN — evidence truth-boundary behavior:
- user-created custom rights document is not yet indexed in the Knowledge Base
- product explicitly reports KB state as `not_indexed`
- product does not substitute an unrelated Knowledge Base entry
- exact published structured rights document is shown as `STRUCTURED SOURCE`
- status authority remains `deterministic evaluator only`

RUNTIME PROVEN — read-only proof behavior:
- opening a user-created impact shows `Proposed proof: not persisted`
- ordinary inspection no longer creates a proof snapshot

UX issue discovered and corrected:
- user edited source-clause text to say paid amplification was prohibited but left the structured paid-permission field set to ALLOW
- deterministic result correctly remained CLEAR
- Scenario Lab now separates structured decision inputs from evidence text, uses explicit ALLOW/PROHIBIT controls, and previews structured decision changes before save


## Runtime proof — 2026-10-04 material user-created rights change

PROVEN sequence:
1. User-selected structured `PROHIBIT` control.
2. UI preview showed `paid permission: ALLOW → PROHIBIT`.
3. User saved the structured change to Sanity.
4. Opening the same user-created case showed `CLEAR → BLOCK`.
5. Deterministic `paid` finding reported: at least one governing right explicitly prohibits paid advertising.
6. No read-only proof was persisted before action.
7. Product exposed only the justified `Switch to organic-only distribution` remediation.
8. Human approved the mutation.
9. Approval-time proof captured `BLOCK`.
10. Previous proof became `STALE`.
11. Usage mutation set `isPaid → false`.
12. Deterministic post-write recompile returned `CLEAR`.
13. Replacement proof was persisted as `CLEAR / FRESH`.

This sequence is independent of the canonical seeded scenarios and proves the core product loop on user-supplied content.


## Runtime proof — 2026-10-04 no-action live refresh + operator filters

PROVEN — Live Content API → Context MCP automatic product refresh:
- portfolio was already open
- user saved a structured change in Scenario Lab
- user did not click `Refresh graph`
- Live integration receipt advanced to `AUTO #2`
- receipt explicitly reports `Sanity Live Content API → Context MCP reread`
- completed automatic graph refresh count advanced
- the change-centric rights view updated materially: the custom right moved from 2 changed fields to 1 changed field

PROVEN — operator filter composition:
- initial portfolio showed 3 of 3 usages
- asset filter reduced visible set to 1 of 3
- adding an incompatible causal-right filter reduced result to 0 of 3
- UI correctly reported 2 active filters
- this proves intersection/composition rather than independent cosmetic controls

RUNTIME PROVEN — change-centric view core:
- user-created rights document is listed as a changed right
- published and proposed revisions are visible
- exact field before/after values are visible
- linked downstream usage is visible
- after remediation, linked usage correctly remains `CLEAR → CLEAR` even while a rights field still differs, proving downstream effect is computed from the whole usage context rather than from field-change presence alone
