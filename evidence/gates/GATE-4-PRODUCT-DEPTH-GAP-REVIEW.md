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

MISSING / not yet load-bearing:
- agent orchestration in the product
- change-centric rights-document view
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
2. Add **rights-change view**: select one draft rights document and see all affected usages.
3. Add filters/search for status, territory, channel, asset, and causal right.
4. Exercise the music-window REVIEW path end-to-end through the product.
5. Add explicit UNKNOWN path by removing required evidence from a controlled test record.
6. Add product agent using MCP/KB + deterministic receipts.
7. Add recovery UI for MCP unavailable, Live API offline, KB unavailable, write failure.
8. Evaluate App SDK native surface and Workflows; mark PROVEN/N/A/BLOCKED with evidence.
9. Run final Product Depth Gap Review again before submission.

## Non-negotiable

Do not switch back to "demo polish" as the primary workstream until this gap list has been materially reduced and every remaining item is explicitly classified.
