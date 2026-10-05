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
| NOT DOCUMENTED produces UNKNOWN in a material runtime case | OBSERVED | LIVE | user-created proposed validTo removed; UI and runtime assurance independently observed CLEAR → UNKNOWN / window UNKNOWN |
| integrated runtime assurance can inspect live graph/health/TTFV/proof chain without business mutation | OBSERVED | LIVE | verify:completion executed on 17463eb; Runtime Health healthy, live scans completed, TTFV 442 ms, proof audit observed |
| Engineering Quality receipt can be generated from tests/build/runtime dependency audit | OBSERVED | LOCAL | receipt executed on 17463eb as PASS_WITH_ACCEPTED_DEBT; generated-file dirt handling was corrected afterward and rerun is required |
| free-text/status/territory/channel filters each work in runtime | OBSERVED | LIVE | all four filters individually exercised against live portfolio; target user usage remained correctly selectable; prior composition proof also preserved |
| user-created scenario deletion works in runtime | UNKNOWN | PARTIAL | implementation exists; runtime proof pending |
| bounded product agent is load-bearing | OBSERVED | LIVE | in-product investigation generated Sanity Content Agent narrative over deterministic CLEAR → UNKNOWN receipt; Context MCP/evaluator/registry active; write authority NONE; agent abstained |
| Context MCP failure recovers safely | OBSERVED | LOCAL_CONTROLLED_INTEGRATION_FAILURE | process-local unreachable endpoint caused degraded health + fail-closed scan; restoring endpoint returned healthy live scan |
| Knowledge Base failure degrades without status corruption | OBSERVED | LOCAL_CONTROLLED_INTEGRATION_FAILURE | KB unavailable while Context MCP + structured source remained available; deterministic status authority unaffected; recovery succeeded |
| write recovery is idempotent after an already-completed remediation | OBSERVED | LIVE | existing stale baseline + replacement returned ALREADY_COMPLETE; business mutation was not repeated |
| genuine write-outcome-unknown recovery preserves truthful mutation state | UNKNOWN | PARTIAL | implementation exists and blind retry is forbidden; a controlled consequential failure has not been executed |
| App SDK is required for the current core product | INFERRED | N/A | official SDK is viable but would duplicate current surface; see native-depth evaluation |
| Editorial Workflows are required for current single-operator loop | INFERRED | N/A | additive team coordination, not core correctness; availability account-dependent |
| release-aware perspective support exists but current project has no Content Release | OBSERVED | N/A_CURRENT_RUNTIME | corrected read-only probe classified NO_RELEASE_PRESENT / releaseCount 0; gate reactivates if a release is created |
| Time to First Value is measured on the live graph path | OBSERVED | LIVE | 442 ms server-side concurrent Context MCP portfolio + rights-change scan |
| current proof history can be audited without rewriting history | OBSERVED | LIVE | 16 proofs / 3 usages / PASS_WITH_HISTORICAL_WARNINGS; 3 historical duplicate-fresh warnings, 0 audit errors |
| dependency lock is committed for clean-room reproducibility | OBSERVED | LOCAL | package-lock.json committed at 17463eb; external zero-state replay remains unobserved |

## Preserved real negative events

- Context MCP initially refused readiness because no deployed Studio/schema descriptor was available.
- Studio deployment initially failed on missing/invalid dependency declarations.
- Evidence UI once substituted unrelated KB content for a user-created right; corrected to fail closed and show structured-source fallback.
- Read-only impact views once created proof noise; corrected so proof snapshots are approval-time only.
- Evidence text and structured permissions could contradict each other; corrected with explicit ALLOW/PROHIBIT/NOT DOCUMENTED controls and evidence-only lint.

These failures are retained because they materially changed the product and truth boundaries.
