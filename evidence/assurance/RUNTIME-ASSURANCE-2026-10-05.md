# Runtime Assurance Receipt — 2026-10-05

Observed from the operator Codespace after committing `package-lock.json`.

## Binding

- repository: `Faadil1/clearance-room`
- branch: `product/judge-workflow-4`
- runtime commit: `17463ebed6b4e2e3038119fde2625c5bae1d760d`
- command: `npm run verify:completion`
- truth class: OBSERVED
- runtime class: LIVE_CODESPACES_DEV
- protected submission: NOT PERFORMED
- business mutation by assurance command: NONE

## Regression

- runtime env verification: PASS
- test files: 12/12 PASS
- tests: 42/42 PASS
- Next production build: PASS
- TypeScript: PASS
- static generation: PASS

## Engineering Quality

Observed receipt verdict on this runtime commit:

`PASS_WITH_ACCEPTED_DEBT`

Observed reason in the first run:
- `EQ-DIRTY-001` only.

The product build itself passed. The dirty-tree signal is being corrected so generated `next-env.d.ts` and the generated receipt file do not count as substantive source drift.

Dependency audit truth from the same run:
- 23 total vulnerabilities reported
- 2 low
- 10 moderate
- 11 high
- 0 critical observed by the `--audit-level=critical` gate

Do **not** run `npm audit fix --force` under the deadline. The reported remediation proposes breaking Sanity / Content Agent dependency changes. High-severity dependency debt must remain disclosed rather than silently ignored.

## Runtime Health

Result: **PROVEN_RUNTIME / healthy**

Observed:
- Context MCP graph: available
- Knowledge Base: available
- Content Lake read: available
- Content Lake write: available via dry-run
- Live Content state: client-observed

## Time to First Value

Result: **PROVEN_RUNTIME**

- measured value: **442 ms**
- definition: concurrent live Context MCP portfolio + rights-change scan

## Live portfolio

Result: **PROVEN_RUNTIME**

Observed:
- total usage requests: 3
- affected: 0
- BLOCK: 0
- REVIEW: 0
- UNKNOWN: 0
- CLEAR: 3

## Change-centric view

Result: **PROVEN_RUNTIME**

Observed:
- changed rights documents: 3
- linked usage requests: 3
- affected usage requests: 0

## Material UNKNOWN

Result: **BLOCKED**

Observed:
- user-created UNKNOWN count: 0
- all UNKNOWN count: 0

Reason:
The current user-created usage does not materially depend on the structured field previously set to NOT DOCUMENTED. A material missing-evidence case still needs to be created/observed, preferably by setting a proposed validity boundary to NOT DOCUMENTED while the usage has a date window.

## Proof integrity

Result: **PROVEN_RUNTIME / PASS_WITH_HISTORICAL_WARNINGS**

Observed:
- 16 proofs
- 3 usages with proofs
- 11 fresh proofs
- 5 stale proofs
- 3 warnings
- no error/HOLD issue observed

Warnings are all `MULTIPLE_FRESH_PROOFS` from historical pre-fix proof noise:
- `usage-holiday-ca`
- `usage-winter-ca`
- `usage-user-3dd4ef777a29`

Truth boundary:
- audit is read-only
- historical evidence is preserved
- no automatic deletion is allowed merely to make the audit green

## Still unobserved / protected

- bounded Sanity Content Agent narration: SKIPPED
- release perspective: SKIPPED (no release id supplied)
- scenario deletion: BLOCKED pending explicit disposable-scenario choice
- real dependency failure injection: BLOCKED
- write-outcome-unknown recovery: BLOCKED
- external zero-state clean-room replay: BLOCKED

## Drift Tripwire

Material user/operator capability delta since the previous milestone:
- live runtime health + dependency visibility is now observed;
- TTFV is now measured;
- proof-integrity audit is now observed on the current live dataset;
- dependency lock is committed.

No new WORKSTREAM_DRIFT is observed.

BUILD_CANDIDATE_READY remains fail-closed until the remaining applicable gates are resolved or truthfully classified.
