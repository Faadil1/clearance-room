# Clearance Room — Completion Block Runbook

Date: 2026-10-04  
Status: ACTIVE  
Primary workstream: PRODUCT_EXPLOITATION  
Canonical baseline: `0.1.56-canonical-baseline-drift-tripwire-promoted` @ `8a7e8a4ff5461641c595e2cf052a95fdc32a6340`

This runbook closes everything that can truthfully be closed in one implementation/assurance block.

It does **not** auto-perform:
- destructive scenario deletion;
- consequential remediation;
- protected deployment;
- final submission;
- artificial external dependency outages;
- paid AI narration unless explicitly enabled.

## One-command non-destructive verification

After runtime environment variables are configured:

```bash
npm run verify:completion
```

This executes:

1. runtime environment name check without printing secret values;
2. Engineering Quality regression verification:
   - `npm test`;
   - `npm run app:build`;
   - `npm audit --omit=dev --audit-level=critical`;
   - local canonical Engineering Quality receipt generation;
3. read-only live runtime assurance:
   - Runtime Health;
   - Context MCP live portfolio scan;
   - change-centric live scan;
   - server-side Time to First Value;
   - Proof Integrity Audit;
   - material UNKNOWN presence check;
   - optional release-perspective check;
   - optional bounded Content Agent execution.

The runtime assurance command never seeds or mutates business state.

## Optional bounded Content Agent runtime proof

Sanity Content Agent may consume AI credits, so it is opt-in:

```bash
CLEARANCE_ASSURANCE_RUN_AGENT=1 npm run verify:runtime-assurance
```

A runtime proof requires:
- deterministic receipt produced first;
- AI narrative provider = `sanity-content-agent`;
- AI narrative status = `generated`;
- agent write authority = `NONE`;
- no status outside the deterministic current/proposed receipt.

If AI credits/provider are unavailable, classify as BLOCKED/OBSERVED_PARTIAL; never fake a generated narration.

## Material UNKNOWN runtime proof

The latest recorded run persisted `ALLOW → NOT DOCUMENTED` for paid permission, but the usage was organic. That is not a material UNKNOWN consequence.

Use an existing user-created multi-right case and remove a field that is material to the current usage. Preferred path:

- proposed `validTo` → **NOT DOCUMENTED**;
- keep a usage window present.

Expected deterministic outcome:

```text
proposed = UNKNOWN
window = UNKNOWN
reason = At least one governing right is missing a validity boundary.
repairs = []
agent = abstain
```

Then rerun:

```bash
npm run verify:runtime-assurance
```

The assurance receipt should report at least one user-created UNKNOWN usage.

## Runtime dependency / recovery proof

The implementation already contains:
- Context MCP fail-closed status behavior;
- KB evidence-only degradation;
- Content Lake write dry-run health check;
- write-outcome reconciliation that never repeats the business mutation automatically;
- audit-only replacement-proof reconstruction after the approved mutation is observed.

Unit tests cover the deterministic failure policy.

A **LIVE** dependency-failure proof still requires a real or deliberately controlled unavailable dependency. Do not silently call a simulated unit test LIVE.

A consequential write-failure test requires explicit operator approval. Do not trigger it automatically from this runbook.

## Proof integrity

Run in product or via the assurance command.

Expected truth:
- `PASS` — no issues;
- `PASS_WITH_HISTORICAL_WARNINGS` — historical pre-fix duplicate fresh proofs may remain;
- `HOLD` — stale proof without replacement or orphan supersession.

Historical evidence must not be deleted merely to make the audit green.

## Operator controls / scenario deletion

Search/filter engine is implemented and composition is runtime observed.

Remaining individual controls can be exercised without product mutation:
- free text;
- status;
- territory;
- channel.

Scenario deletion is destructive. Runtime proof requires the operator to deliberately create/select a disposable user scenario and confirm deletion. The assurance script will never delete one automatically.

## Release-aware perspective

If a real Content Release id exists:

```bash
SANITY_RELEASE_ID="<release-id>" npm run verify:runtime-assurance
```

If no real release exists in this Sanity project, classify runtime availability as BLOCKED/UNAVAILABLE rather than inventing one.

Release analysis remains read-only.

## Dependency lock / clean-room

`package-lock.json` is required before terminal clean-room assurance.

After a verified install:

```bash
npm install
git add package-lock.json
git commit -m "chore: lock verified product dependencies"
git push
```

Then rerun the Engineering Quality receipt on the committed head.

A true zero-state clean-room proof still requires a fresh external environment after the lockfile is committed.

## Terminal truth

This block may materially reduce product-depth gaps, but it cannot itself authorize:

`BUILD_CANDIDATE_READY / RELEASE_READY / SUBMISSION_READY / COMPLETE`

while any applicable gate remains BLOCKED, MISSING or UNKNOWN.

Final protected submission remains human-only.
