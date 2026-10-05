# Runtime Proof — Material UNKNOWN + Bounded Content Agent

Date: 2026-10-05  
Source: operator-recorded live Codespaces runtime  
Truth class: OBSERVED  
Runtime class: LIVE_CODESPACES_DEV  
Business mutation in this proof: structured user-owned draft rights edit only  
Protected final submission: NOT PERFORMED

## Scenario

User-created scenario:
- usage: `usage-user-3dd4ef777a29`
- territory: CA
- channel: instagram_reels
- paid: false / organic
- governing rights: 2

The operator edited one proposed governing right and set:

`validTo → NOT DOCUMENTED`

The product saved the change to Sanity and the UI confirmed:

`Saved to Sanity. Live Content API will invalidate the product automatically.`

## Deterministic runtime result

Observed after the save:

`CLEAR → UNKNOWN`

Axis findings:
- territory: CLEAR
- channel: CLEAR
- paid: CLEAR
- window: UNKNOWN

Observed deterministic reason:

`At least one governing right is missing a validity boundary.`

The causal right shown by the product was the user-created proposed rights document.

The proposed proof remained:

`not persisted`

Read-only inspection therefore did not create proof noise.

## Missing-evidence abstention

Observed product behavior:
- no consequential remediation was invented;
- the remediation surface explicitly said clearance is UNKNOWN because required structured evidence is missing;
- the product explicitly refused to convert missing evidence into permission or prohibition;
- operator direction was to complete the missing rights data and recompile.

This proves the material UNKNOWN / fail-closed path on user-created live content.

## Bounded Content Agent

The operator ran the in-product bounded investigation on the same UNKNOWN impact.

Observed deterministic receipt:
- current: CLEAR
- proposed: UNKNOWN
- status authority: deterministic receipt
- write authority: NONE

Observed Sanity Content Agent state:

`GENERATED`

Observed tool trace:
- Sanity Context MCP: OK
- Deterministic Clearance Evaluator: OK
- Sanity Context Knowledge Base: PARTIAL
- Remediation Registry: OK
- Sanity Content Agent: OK

Observed agent behavior:
- agent acknowledged UNKNOWN from the deterministic evaluator;
- agent abstained because required structured evidence was missing;
- agent did not invent a repair;
- bounded next action was to complete missing structured evidence and recompile;
- agent had no write authority.

The Knowledge Base remained `not_indexed` for the custom user right, while the structured source remained available. This did not alter status authority.

## Independent runtime assurance

Immediately afterward, the operator ran:

`npm run verify:runtime-assurance`

Observed:
- Runtime Health: PROVEN_RUNTIME / healthy
- Time to First Value: 380 ms
- live portfolio: 3 usages
- affected usages: 1
- UNKNOWN usages: 1
- CLEAR usages: 2
- material user UNKNOWN count: 1
- exact UNKNOWN usage: `usage-user-3dd4ef777a29`
- Proof Integrity: PASS_WITH_HISTORICAL_WARNINGS

The runtime assurance therefore independently confirmed the material UNKNOWN state outside the UI interaction.

## Verdicts

- UNKNOWN_MISSING_EVIDENCE: PROVEN
- AGENT_ORCHESTRATION: PROVEN
- AGENT_WRITE_AUTHORITY: NONE
- NO_INVENTED_REMEDIATION_ON_UNKNOWN: PROVEN
- MATERIAL_USER_CAPABILITY_DELTA: OBSERVED

This proof does not establish:
- real dependency outage recovery;
- write-outcome-unknown recovery;
- scenario deletion;
- release-id runtime availability;
- external zero-state clean-room replay;
- TRACE assurance;
- protected final submission.
