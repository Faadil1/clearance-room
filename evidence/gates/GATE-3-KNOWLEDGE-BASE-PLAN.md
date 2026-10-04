# Gate #3 — Knowledge Base Grounding

Status: ACTIVE  
Date: 2026-10-04

## Objective

Ground Clearance Room explanations in published rights-source evidence through Sanity Context Knowledge Base while preserving the deterministic evaluator as the sole authority for `CLEAR`, `BLOCK`, `REVIEW`, and `UNKNOWN`.

## Required architecture

### Structured graph endpoint

`clearance-room-graph`

Purpose:
- live structured content
- GROQ traversal
- `published` vs `drafts` perspectives
- feeds deterministic evaluator

Must not:
- make writes
- invent clearance status

### Evidence endpoint

`clearance-room-evidence`

Purpose:
- Knowledge-Base-only endpoint
- retrieve published source clauses
- support grounded explanation and evidence presentation

Must not:
- decide clearance status
- override deterministic findings
- mutate content

## Knowledge Base source

Project: `041j2som`  
Dataset: `production`

Target source projection:

```groq
*[_type == "rightsDocument"]{
  _id,
  title,
  kind,
  sourceClause,
  allowedTerritories,
  allowedChannels,
  paidAdvertisingAllowed,
  validFrom,
  validTo
}
```

## Gate proof target

Retrieve source evidence for `rights-music-c09` showing:

- title: `C09 Original Soundtrack License`
- right kind: `music_license`
- paid Instagram Reels in Canada are granted
- validity ends on `2026-10-31`

The evidence should support the already-proven deterministic finding:

- `allowedThrough: 2026-10-31`
- `blockedFrom: 2026-11-01`

## Exit criteria

Gate #3 is PROVEN only when:

1. Knowledge Base builds successfully.
2. A separate Knowledge-Base-only Context MCP endpoint is Ready.
3. Runtime retrieval returns the music-license source evidence.
4. Retrieved evidence is traceable to the underlying source.
5. No Knowledge Base or agent output is treated as the normative clearance decision.
