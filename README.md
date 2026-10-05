# Clearance Room

**See what breaks before a rights change goes live.**

[Live product](https://clearance-room.vercel.app) · [Final runtime binding](evidence/assurance/PUBLIC-RUNTIME-BINDING-FINAL-2026-10-05.md) · [Reality Ledger](evidence/REALITY-LEDGER.md)

Clearance Room is a live rights-impact operating system built on Sanity. It compares published rights with a proposed perspective, computes the downstream blast radius deterministically, grounds the result in source evidence, and lets an operator repair only supported issues through explicit human-approved writes followed by deterministic recompilation.

The product is intentionally not a demo wrapper: user-created scenarios, live graph reads, automatic invalidation, proof history, recovery behavior and bounded agent orchestration all run through the same product core.

## Why this exists

A rights change can look harmless in isolation while silently invalidating campaigns, channels, territories or time windows downstream. Traditional content views show records. Clearance Room shows **consequences before publication**.

> If this right changes, what breaks, why, and what can I safely do next?

## What the product does

1. Reads the live rights graph through Sanity Context MCP.
2. Compares published/current rights with the proposed state.
3. Deterministically evaluates every affected usage.
4. Produces CLEAR / BLOCK / REVIEW / UNKNOWN with causal findings.
5. Retrieves source-bound evidence without letting prose decide status.
6. Exposes only registry-backed remediation options.
7. Requires explicit human approval for consequential writes.
8. Persists the approval-time baseline proof, marks it stale after mutation, recompiles, and stores the replacement proof.
9. Uses Sanity Live Content to invalidate stale operator views automatically.
10. Can invoke a bounded Sanity Content Agent to explain a deterministic receipt, while preserving write authority NONE unless the protected product path is used.

## Live runtime

**Production:** https://clearance-room.vercel.app

| Field | Value |
| --- | --- |
| Runtime candidate | d2dcd7046643b60d84b508121dc75a8f7f4d3776 |
| Vercel deployment | dpl_BfGiDcKJFWtGoHfHmxbMEk5NchCB |
| Deployment state | READY |
| Branch | product/judge-workflow-4 |
| Root | HTTP 200 |
| Health | healthy |
| Context Graph | available |
| Knowledge Base | available |
| Content Lake read | available |
| Content Lake write | available, dry-run verified |
| Product quality | GitHub Actions run 37264248408 — success |

The Live Content SSE route intentionally rotates at 240 seconds and asks EventSource to reconnect before the platform timeout boundary. The rotation changes no business state.

Post-deploy README/state/evidence commits are continuity metadata only and do **not** redefine the frozen runtime candidate above.

## Judge path

The public runtime is the primary product path. A judge can:

1. open the Portfolio and inspect live usage states;
2. open a rights change and see its downstream blast radius;
3. inspect the exact causal right, axis finding and source evidence;
4. create or edit a user-owned Scenario Lab case, including explicit NOT DOCUMENTED evidence;
5. observe deterministic UNKNOWN and bounded-agent abstention when a material boundary is missing;
6. inspect proof history and supported remediation without allowing the agent to invent status or silently write.

The canonical Maya/C09 seeded scenario is retained only as a reproducibility fallback. It is not the Definition of Done.

## Sanity integrations are load-bearing

| Integration | Product responsibility |
| --- | --- |
| Sanity Context MCP | Structured graph read and blast-radius input |
| Sanity Context Knowledge Base | Source evidence and explanation only |
| Sanity Live Content | Automatic invalidation / refresh signal |
| Sanity Content Lake | User scenarios, proof persistence and explicit approved mutation |
| Sanity Content Agent | Bounded explanation over deterministic receipts |

Status authority remains the deterministic compiler. Knowledge Base content and AI narration cannot create or override CLEAR / BLOCK / REVIEW / UNKNOWN.

## Truth and safety boundaries

- Context MCP is read-only.
- Consequential writes use a separate mutation path.
- Explicit human approval is required before a supported remediation writes.
- Missing material structured evidence fails closed to UNKNOWN.
- BLOCK outranks UNKNOWN; UNKNOWN outranks REVIEW; REVIEW outranks CLEAR.
- Agent narration has no independent status authority and cannot invent a repair.
- A proposed repair is never represented as successful before a real post-mutation recompile.
- Read-only inspection does not create proof noise.
- Stale proof and replacement proof remain auditable rather than being rewritten away.

## What is proven

| Gate / capability | State |
| --- | --- |
| Live core loop | PROVEN |
| Load-bearing Context MCP | PROVEN |
| Live Content auto-invalidation | PROVEN |
| User-created live scenarios | PROVEN |
| Multi-right intersection | PROVEN |
| Material UNKNOWN / missing evidence | PROVEN |
| Bounded Content Agent + abstention | PROVEN |
| External dependency failure / recovery | PROVEN |
| Proof-history audit | PROVEN |
| Operator filters | PROVEN |
| Time to First Value | PROVEN |
| Clean-room reproducibility | PROVEN |
| Engineering Quality | PROVEN with disclosed accepted dependency debt |
| TRACE design assurance | PROVEN with non-blocking accepted debt |
| Runtime ↔ exact Git commit binding | PROVEN |
| Write-outcome-unknown recovery | BLOCKED — remaining terminal material gate |

The repo is **submission-packaged and review-ready**. Final canonical promotion remains fail-closed on WRITE_FAILURE_RECOVERY until that controlled consequential failure is observed or explicitly waived/deferred under existing authority. Final submission itself remains human-only.

## Known limitations and accepted debt

- Genuine write-outcome-unknown recovery has not been runtime-observed because proving it requires an explicitly authorized controlled consequential failure. Blind retry is forbidden.
- User-created scenario deletion exists but is not claimed as runtime-proven and is non-terminal for the current submission scope.
- The latest clean Engineering Quality run disclosed 11 high dependency findings and 0 critical findings; forced breaking remediation is intentionally not performed under the current deadline.
- TRACE accepted non-blocking debt around long proof-history density, explicit custom focus styling, mobile runtime recording, reduced-motion runtime recording and long expert-surface identifiers.

No item above is silently upgraded to a stronger truth class.

## Run locally

Requirements:
- Node.js 22.12+
- npm
- a Sanity project/dataset with the deployed schema
- server-side Sanity API token with required write permissions
- Sanity organization token with Context Viewer access
- configured Context MCP graph endpoint
- configured Knowledge Base evidence endpoint

Install:

    npm ci

Copy .env.example and configure the required values. Never commit tokens.

Verify environment names without printing secret values:

    npm run verify:runtime-env

Run the product:

    npm run app:dev

## Verification

Primary regression:

    npm run verify:product

Integrated non-mutating completion assurance:

    npm run verify:completion

Optional bounded Content Agent runtime narration:

    CLEARANCE_ASSURANCE_RUN_AGENT=1 npm run verify:runtime-assurance

The assurance path never seeds or mutates business state and never performs the protected final submission.

## Canonical source of truth

- [Current state](state/CURRENT.yaml)
- [Handover](state/HANDOVER.yaml)
- [Living PRD](product/LIVING-PRD.md)
- [Conditional Gateway Registry](state/CONDITIONAL-GATEWAY-REGISTRY.yaml)
- [Reality Ledger](evidence/REALITY-LEDGER.md)
- [Submission readiness](evidence/assurance/SUBMISSION-READINESS-2026-10-05.md)
- [Completion runbook](evidence/assurance/COMPLETION-BLOCK-RUNBOOK.md)

Canonical baseline pin:
- version: 0.1.56-canonical-baseline-drift-tripwire-promoted
- baseline continuity SHA: 8a7e8a4ff5461641c595e2cf052a95fdc32a6340
- active-project reconciliation wave: fb062d6cd792cab8e27c342120824f285120bc2f
- Product Reality: v1.5

## Submission boundary

Repository packaging, public runtime binding, reproducibility and judge-facing documentation are ready.

The protected final submission action is deliberately not automated from this repository. The remaining material canonical blocker is WRITE_FAILURE_RECOVERY; it must be proven through an authorized controlled failure or explicitly waived/deferred before terminal canonical promotion.
