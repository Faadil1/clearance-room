# Clearance Room — Living PRD

Version: 0.1.0-reconstructed  
Status: ACTIVE  
Owner: PBPD-authorized implementation owner  
Source of truth: GitHub + state/CURRENT.yaml + state/HANDOVER.yaml  
Reconstruction date: 2026-10-04

> This PRD is reconstructed from the current canonical project state. It does not backdate missing historical source packets or upgrade earlier evidence.

## Product thesis

**See what breaks before a rights change goes live.**

Clearance Room is a rights-impact operating system over structured Sanity content. It compares current/published rights with proposed rights, calculates downstream clearance consequences deterministically, retrieves source-bound evidence, and lets an operator repair supported issues through explicit human-approved writes followed by deterministic recompilation.

## User / JTBD

Primary operator:
- marketing/content/rights operator preparing a campaign or content usage;
- needs to know whether a proposed rights change invalidates current downstream use before publication.

Core job:
- understand blast radius of a rights change;
- see the exact causal right and deterministic finding;
- inspect evidence without letting free text decide status;
- resolve supported issues safely;
- preserve an auditable proof chain.

## Goals

- deterministic CLEAR / BLOCK / REVIEW / UNKNOWN status;
- current vs proposed rights comparison;
- change-centric and usage-centric blast radius;
- user-created live scenarios as first-class content;
- source-bound evidence from Sanity Context / Knowledge Base;
- human-approved remediation with real write consequence;
- stale-proof + replacement-proof audit chain;
- automatic live invalidation on content change;
- bounded agent orchestration that cannot override the deterministic evaluator;
- fail-closed behavior when required evidence or dependencies are unavailable.

## Non-goals

- legal advice;
- autonomous legal judgment;
- free-form LLM status generation;
- automatic consequential writes without human approval;
- replacing Sanity / a DAM / contract management;
- treating evidence text as normative permission;
- demo-only parallel logic.

## Product invariants

1. Deterministic evaluator is the only authority for CLEAR / BLOCK / REVIEW / UNKNOWN.
2. Knowledge Base and source clauses are evidence/explanation only.
3. Missing structured evidence produces UNKNOWN when material; it is never silently converted to permission.
4. Explicit BLOCK outranks UNKNOWN, which outranks REVIEW, which outranks CLEAR.
5. Context MCP is the load-bearing structured graph read path.
6. Writes use a separate mutation path and require explicit human approval when consequential.
7. A read-only inspection does not create proof noise.
8. Approval-time baseline proof + write + post-write recompile preserve an auditable stale/supersession chain.
9. A proposed repair never predicts a final status as fact before recompilation.
10. Seeded scenarios are a reproducibility harness only; user-created live content is the primary product path.

## Core entities

- rightsDocument
- mediaAsset
- usageRequest
- clearanceProof
- rights-change diff
- finding
- causal right
- remediation option
- live event receipt
- user-created Scenario Lab case

## Primary live flow

1. Observe published and proposed rights state.
2. Read graph through Sanity Context MCP.
3. Compile every affected usage deterministically.
4. Rank blast radius.
5. Open an impact.
6. Inspect findings + causal rights.
7. Retrieve Knowledge Base / structured source evidence.
8. Derive only supported remediation options.
9. Require explicit human approval for consequential write.
10. Persist approval-time baseline proof.
11. Execute mutation.
12. Mark baseline proof stale.
13. Re-read and deterministically recompile.
14. Persist replacement proof with supersession.
15. Continue listening for later invalidating content changes.

## Product surfaces

### Portfolio
- all live usage requests;
- affected and stable states;
- aggregate counts;
- free-text search;
- filters by status, territory, channel, asset and causal right.

### Rights-change view
- changed rights document;
- published vs proposed revisions;
- material field-level diff;
- linked assets / usages;
- downstream status transitions.

### Scenario Lab
- create user-owned live scenario;
- current + proposed rights;
- multiple governing rights;
- asset and usage intent;
- live edit / add / remove rights;
- explicit NOT DOCUMENTED state;
- delete only user-created scenario records.

### Impact detail
- current/proposed statuses;
- all axis findings;
- causal rights;
- evidence;
- proof history;
- supported remediation or explicit abstention.

### Bounded agent
- investigate one usage;
- gather deterministic receipt;
- gather available source evidence;
- summarize findings;
- expose supported remediation;
- abstain on missing evidence;
- never invent or override status;
- never execute write without the protected human path.

## Proven product behavior

See:
- evidence/gates/GATE-1-TECHNICAL-REALITY-PASS.md
- evidence/gates/GATE-2-PROOF-REMEDIATION-PASS.md
- evidence/gates/GATE-3-KNOWLEDGE-BASE-PASS.md
- evidence/gates/GATE-4-PRODUCT-DEPTH-GAP-REVIEW.md
- evidence/REALITY-LEDGER.md

## Runtime truth classes

Use:
- OBSERVED
- INFERRED
- UNKNOWN

And:
- LIVE
- LOCAL
- LOCAL_STUB
- PRESEEDED
- SIMULATED
- PARTIAL
- NOT_IMPLEMENTED

No artifact may silently upgrade a capability class.

## Material acceptance criteria before BUILD_CANDIDATE_READY

- all current MUST depth gaps resolved or explicitly N/A/BLOCKED with valid stop condition;
- UNKNOWN / missing evidence path observed in runtime;
- agent orchestration load-bearing and bounded;
- degraded Context MCP / Live API / KB behavior exercised;
- write-failure recovery exercised;
- repeated proof-history behavior verified;
- setup / clean-room path current;
- current Engineering Quality receipt available;
- final Post-Vertical-Slice Depth Gap Review complete;
- Conditional Gateway Registry has no material BLOCKED gate;
- Project Finisher Final Canonical Assurance still required after BUILD_CANDIDATE_READY.

## Protected actions

Human authority required for:
- final submission;
- production deploy when protected;
- irreversible external publication;
- consequential product mutation already modeled by explicit approval in-product.

## Current workstream

PRODUCT_EXPLOITATION

Current highest-value delta:
- runtime-prove UNKNOWN / missing structured evidence;
- then bounded agent + recovery behavior.

## Version history

### 0.1.0-reconstructed — 2026-10-04
- reconstructed the missing local living PRD from current repository truth;
- does not claim this file existed during earlier gates;
- preserves current product thesis, invariants, proven behaviors and remaining gaps.
