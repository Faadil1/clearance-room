# Controlled Dependency Failure + Recovery — Runtime Receipt

Date: 2026-10-05  
Command: `npm run verify:dependency-recovery`  
Truth class: OBSERVED  
Runtime class: LOCAL_CONTROLLED_INTEGRATION_FAILURE  
Real production outage claimed: false  
Business mutation: none  
Protected submission: none

## Baseline

Baseline Runtime Health: **healthy**

## Context MCP fail-closed

Observed:
- Context MCP endpoint overridden only inside the assurance process
- Runtime Health became degraded
- context graph state = unavailable
- live graph scan failed closed with `fetch failed`
- no business mutation occurred

Verdict:

`CONTEXT_MCP_FAIL_CLOSED = PROVEN_RUNTIME`

## Knowledge Base evidence-only degradation

Observed:
- Knowledge Base endpoint overridden only inside the assurance process
- Knowledge Base state = unavailable
- Context MCP remained available
- exact structured source remained available
- KB evidence reported unavailable
- deterministic status authority remained unaffected
- no business mutation occurred

Verdict:

`KNOWLEDGE_BASE_EVIDENCE_ONLY_DEGRADATION = PROVEN_RUNTIME`

## Dependency recovery after restore

After restoring the real process environment endpoints:

- Runtime Health returned to healthy
- live graph scan succeeded
- usage count = 3
- affected usages = 1

Verdict:

`DEPENDENCY_RECOVERY_AFTER_RESTORE = PROVEN_RUNTIME`

## Write recovery idempotence

The assurance selected an existing stale baseline proof that already had a replacement proof:

- usage: `usage-holiday-ca`
- baseline proof: `proof-impact-usage-holiday-ca-proposed-1791131489643`

Observed reconciliation state:

`ALREADY_COMPLETE`

Observed:
- existing replacement proof recognized
- business mutation was **not repeated**

Verdict:

`WRITE_RECOVERY_IDEMPOTENCE = PROVEN_RUNTIME`

## Remaining write-failure boundary

A genuine `write-outcome-unknown` case remains unobserved.

Reason:
- proving it truthfully requires a controlled consequential failure around a business mutation;
- this assurance intentionally performs no business mutation;
- the project must not manufacture a false production failure.

Current truthful state:

`WRITE_OUTCOME_UNKNOWN_RECOVERY = BLOCKED / UNOBSERVED`

This blocker does not invalidate the proven non-mutating dependency failure/recovery behavior.

## Gate implications

- EXTERNAL_DEPENDENCY_FAILURE: PROVEN
- WRITE_FAILURE_RECOVERY: remains ACTIVE
- write-recovery idempotence: PROVEN
- blind retry prevention: preserved
- business mutation repeat: false
