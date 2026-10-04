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

ACTIVE / needs runtime proof:
- Context MCP as primary graph-read path in the product
- Live Content API auto-refresh with drafts included
- multi-impact product behavior after canonical reset
- proof-history behavior across repeated real runs

IMPLEMENTED / runtime proof pending:
- change-centric rights-document view
  - published vs draft field-level diff
  - revision identifiers
  - linked assets/usages
  - downstream deterministic status transitions
  - direct drill-down into affected usage
  - Live Content API refresh path includes rights-change view

MISSING / not yet load-bearing:
- agent orchestration in the product
- filtering/search across portfolio
- UNKNOWN / missing-evidence product path
- live integration degraded/offline recovery
- write-failure recovery
- second remediation class exercised through the browser
- native App SDK surface evaluation
- Workflows fit / availability verification
- release-aware perspective evaluation if available

## Immediate product expansion order

1. Prove Context MCP + Live Content API in browser with a real draft edit.
2. Runtime-prove the **rights-change view** against a real draft edit.
3. Add filters/search for status, territory, channel, asset, and causal right.
4. Exercise the music-window REVIEW path end-to-end through the product.
5. Add explicit UNKNOWN path by removing required evidence from a controlled test record.
6. Add product agent using MCP/KB + deterministic receipts.
7. Add recovery UI for MCP unavailable, Live API offline, KB unavailable, write failure.
8. Evaluate App SDK native surface and Workflows; mark PROVEN/N/A/BLOCKED with evidence.
9. Run final Product Depth Gap Review again before submission.

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
