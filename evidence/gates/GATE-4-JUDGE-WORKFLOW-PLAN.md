# Gate #4 — Live Product Surface

Status: ACTIVE  
Date: 2026-10-04

## Product thesis

**Clearance Room — See what breaks before a rights change goes live.**

The product surface must operationalize the proven backend mechanisms across the live rights graph, not only one seeded hero scenario.

Primary question:

> What breaks if this rights change goes live?

Primary workflow:

`WHAT BREAKS → WHY → SOURCE EVIDENCE → PROPOSED REPAIR → HUMAN APPROVAL → RECOMPILE`

## Product scope

The primary product scans all live usage requests, compares published and proposed/draft rights state, ranks affected usages, and lets an operator investigate and resolve each impact.

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

## Product information hierarchy

### Portfolio / blast-radius view

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

### Live product primary

Uses the real Sanity project, all current usage requests, deterministic evaluator, persisted proofs, and evidence endpoint.

### Seeded reproducibility harness

A canonical seeded scenario may be reset for judging/reproducibility, but it is explicitly secondary to the live product path and never represented as the product itself.

## MUST

- show `published` and proposed/draft state clearly
- show deterministic status source
- show exact `causedBy`
- show proof freshness/staleness
- show KB evidence independently from status calculation
- require human approval before mutation
- show recompile result after mutation
- scan and rank multiple live usage requests
- allow opening any affected usage
- expose proof history per usage
- support more than one remediation class where findings justify it
- keep a one-click seeded reproducibility harness for judging
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

## Current implementation order

1. portfolio blast-radius scan across all usage requests
2. ranked affected-usage list + unaffected context
3. impact detail with deterministic findings and proof history
4. source-evidence lookup by causal rights document
5. remediation registry (paid → organic; window → shorten when supported)
6. explicit approval + real mutation + recompile
7. audit trail / supersession display
8. loading/error/UNKNOWN paths
9. responsive + accessibility pass
10. seeded reproducibility harness hardening
