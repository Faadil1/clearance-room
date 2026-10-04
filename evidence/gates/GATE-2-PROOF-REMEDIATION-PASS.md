# Gate #2 — Persistent Proof + Human-Approved Remediation — PROVEN

Date: 2026-10-04

## Verdict

**PROVEN**

Clearance Room now proves a consequential product loop against the real Sanity dataset:

1. compile a structured clearance decision;
2. persist a first-class `clearanceProof`;
3. expose a partial-window rights problem;
4. require explicit human approval before mutation;
5. mutate the live usage request;
6. mark the prior proof stale;
7. recompile using the same deterministic evaluator;
8. persist a replacement proof that supersedes the stale proof.

## Baseline runtime proof

Scenario:
- usage request: `usage-holiday-ca`
- asset: `asset-c09`
- added governing right: `rights-music-c09`
- requested campaign: 2026-10-15 → 2026-11-30
- music license valid through: 2026-10-31

Observed deterministic result:
- overall status: `REVIEW`
- window status: `REVIEW`
- causedBy: `rights-music-c09`
- allowedThrough: `2026-10-31`
- blockedFrom: `2026-11-01`
- persisted proof id: `proof-usage-holiday-ca-baseline`
- persisted: true
- result: PASS

## Human-approved remediation runtime proof

Protected command:
`npm run gate:remediate -- --approve`

Observed consequence:
- action: `shorten_campaign_end_date`
- usage request: `usage-holiday-ca`
- end date: `2026-11-30 → 2026-10-31`
- previous proof: `proof-usage-holiday-ca-baseline`
- previous status: `REVIEW`
- previous proof stale: true
- new proof: `proof-usage-holiday-ca-remediated`
- new status: `CLEAR`
- new proof stale: false
- result: PASS

## Truth boundary preserved

- `CLEAR / BLOCK / REVIEW / UNKNOWN` remain deterministic evaluator outputs only.
- Human approval is required before the consequential mutation.
- Context MCP remains read-only.
- The write path is a separate Sanity mutation path.
- Prior proof is not silently reused after the usage intent changes.
- The replacement proof supersedes the stale proof.

## Gate exit condition

Satisfied.

Next gate: Knowledge Base grounding for source-clause evidence. The Knowledge Base may support explanation and evidence retrieval but must not become the normative clearance authority.
