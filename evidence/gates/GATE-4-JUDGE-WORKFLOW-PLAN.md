# Gate #4 — Judge / Operator Workflow Productization

Status: ACTIVE  
Date: 2026-10-04

## Product thesis

**Clearance Room — See what breaks before a rights change goes live.**

The judge/operator-facing workflow must make the proven backend mechanisms legible without requiring explanation of Sanity internals.

Primary question:

> What breaks if this rights change goes live?

Primary workflow:

`WHAT BREAKS → WHY → SOURCE EVIDENCE → PROPOSED REPAIR → HUMAN APPROVAL → RECOMPILE`

## Hero scenario

A proposed rights change or usage state causes a downstream clearance impact.

The product must show:

- current published state
- proposed state
- deterministic status transition
- exact changed axis
- exact rights document causing the change
- source-bound evidence from the Knowledge Base
- a repair option
- explicit human approval before write
- stale prior proof after mutation
- new deterministic proof after recompile

## Judge-facing information hierarchy

### Above the fold

1. **Question / impact headline**
   - "What breaks if this rights change goes live?"

2. **Blast radius summary**
   - current status
   - proposed status
   - changed axes
   - number of affected usage requests

3. **Primary affected usage card**
   - usage request
   - asset
   - status transition
   - exact cause

4. **Proof strip**
   - deterministic evaluator
   - Sanity perspective
   - source revision(s)
   - proof freshness

### Detail / evidence

5. **Why**
   - deterministic finding text
   - `causedBy` rights document

6. **Source evidence**
   - Knowledge Base clause
   - source document title/id
   - territory/channel/window facts

7. **Repair**
   - proposed non-destructive remediation
   - predicted effect clearly labeled as proposal until recomputed

8. **Human approval**
   - explicit approve action
   - no automatic consequential mutation

9. **Recompile receipt**
   - prior proof → STALE
   - new proof
   - new deterministic status
   - supersedes link

## Required runtime modes

### Live primary

Uses the real Sanity project, deterministic evaluator, persisted proofs, and evidence endpoint.

### Deterministic demo fallback

May use seeded canonical records for reliability but must still execute real product logic. It must never be represented as a separate live external event if it is only preseeded data.

## MUST

- show `published` and proposed/draft state clearly
- show deterministic status source
- show exact `causedBy`
- show proof freshness/staleness
- show KB evidence independently from status calculation
- require human approval before mutation
- show recompile result after mutation
- provide a one-click/reliable hero scenario
- support mobile and desktop judge viewing
- preserve reduced-motion friendliness and keyboard-accessible core actions

## MUST NOT

- let an LLM decide `CLEAR/BLOCK/REVIEW/UNKNOWN`
- collapse evidence retrieval and status calculation into one opaque "AI answer"
- claim a repair succeeded before the post-mutation recompile
- hide stale proof state
- require judges to understand GROQ, MCP, or Sanity configuration to understand product value
- make the interface look like a generic chatbot

## Design direction

Operational evidence room, not a dashboard wall and not a chat app.

Visual priorities:
- high-contrast status transitions
- clear current/proposed split
- compact evidence receipts
- explicit provenance
- restrained motion
- strong hierarchy over decoration

Avoid:
- generic dark AI gradient
- excessive glassmorphism
- faux terminal UI as the primary surface
- dense developer-only language

## Acceptance criteria

Gate #4 is PROVEN when a judge can, from the product surface:

1. understand the affected usage without narration;
2. see a real current/proposed deterministic transition;
3. identify the exact axis and rights source;
4. open/read supporting source evidence;
5. see a repair proposal;
6. approve the consequential change explicitly;
7. see the prior proof become stale;
8. see the new proof after recompile;
9. distinguish observed/live facts from proposals and seeded demo context;
10. complete the hero scenario without visiting Sanity Manage or the terminal.

## Initial implementation order

1. app shell + hero blast-radius view
2. live current/proposed data adapter
3. evidence drawer/card
4. repair proposal + explicit approval
5. post-mutation recompile receipt
6. loading/error/unknown paths
7. responsive + accessibility pass
8. demo hardening + receipts
