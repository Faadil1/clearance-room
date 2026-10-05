# Clearance Room — Reality Ledger

Updated: 2026-10-04

This ledger separates what is observed from what is implemented, inferred, or still unknown.

| Capability / claim | Truth | Runtime class | Evidence |
|---|---|---|---|
| published vs drafts can change the same usage from CLEAR to BLOCK | OBSERVED | LIVE | Gate 1 + PR #1 runtime comments |
| Context MCP is load-bearing for rights graph reads | OBSERVED | LIVE | Gate 4 runtime review |
| Live Content API can trigger a no-action Context MCP reread | OBSERVED | LIVE | Gate 4 AUTO #2 runtime receipt |
| user can create a live rights scenario | OBSERVED | LIVE | Gate 4 Scenario Lab runtime |
| user can edit a structured proposed permission | OBSERVED | LIVE | ALLOW → PROHIBIT runtime |
| user can add a second governing right | OBSERVED | LIVE | multi-right runtime |
| paid BLOCK can be remediated to organic-only | OBSERVED | LIVE | BLOCK → stale proof → CLEAR/FRESH |
| window REVIEW can be remediated by shortening campaign | OBSERVED | LIVE | REVIEW → stale proof → CLEAR/FRESH |
| KB evidence does not override deterministic status | OBSERVED | LIVE | KB not-indexed structured-source fallback review |
| read-only inspection does not persist a proof | OBSERVED | LIVE | Proposed proof: not persisted |
| operator can explicitly set proposed paid permission to NOT DOCUMENTED | OBSERVED | LIVE | uploaded runtime recording, ALLOW → NOT DOCUMENTED save |
| NOT DOCUMENTED produces UNKNOWN in a material runtime case | UNKNOWN | PARTIAL | unit tests + UI exist; recorded usage was organic so paid axis stayed CLEAR |
| free-text/status/territory/channel filters each work in runtime | UNKNOWN | PARTIAL | filter engine + composition observed; individual controls not all exercised |
| user-created scenario deletion works in runtime | UNKNOWN | PARTIAL | implementation exists; runtime proof pending |
| bounded product agent is load-bearing | UNKNOWN | NOT_IMPLEMENTED | implementation begins in current block |
| Context MCP outage recovers safely | UNKNOWN | NOT_IMPLEMENTED | recovery implementation begins in current block |
| KB outage degrades without status corruption | INFERRED | PARTIAL | route architecture supports separation; outage not exercised |
| write failure preserves truthful mutation state | UNKNOWN | NOT_IMPLEMENTED | recovery implementation begins in current block |
| App SDK is required for the current core product | INFERRED | N/A | official SDK is viable but would duplicate current surface; see native-depth evaluation |
| Editorial Workflows are required for current single-operator loop | INFERRED | N/A | additive team coordination, not core correctness; availability account-dependent |
| release-aware perspective is supported by Sanity Context | OBSERVED | LIVE_PLATFORM_CAPABILITY | official Context docs accept release id perspective; product support pending |

## Preserved real negative events

- Context MCP initially refused readiness because no deployed Studio/schema descriptor was available.
- Studio deployment initially failed on missing/invalid dependency declarations.
- Evidence UI once substituted unrelated KB content for a user-created right; corrected to fail closed and show structured-source fallback.
- Read-only impact views once created proof noise; corrected so proof snapshots are approval-time only.
- Evidence text and structured permissions could contradict each other; corrected with explicit ALLOW/PROHIBIT/NOT DOCUMENTED controls and evidence-only lint.

These failures are retained because they materially changed the product and truth boundaries.
