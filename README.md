# Clearance Room

**See what breaks before a rights change goes live.**

Clearance Room is a pre-publish rights impact system built around a deterministic
clearance evaluator and a live Sanity rights graph.

## Technical Reality Gate #1

The first gate must prove the same usage request produces different, correct
results under two Sanity content perspectives:

- `published` → `CLEAR`
- `drafts` → `BLOCK`
- diff → `CLEAR → BLOCK`
- `causedBy` → the exact rights document that changed

No UI work starts until this passes against a real Sanity project.

### Truth boundary

- Only the deterministic evaluator may emit `CLEAR / BLOCK / REVIEW / UNKNOWN`.
- An LLM may explain a decision but may not invent or override the status.
- Sanity Context MCP is a read path; writes happen through a separate mutation surface.
- The previous clearance proof becomes stale when referenced rights or intent change.

## Local fixture proof

```bash
npm install
npm run gate:fixture
npm test
```

## Real Sanity proof

Create `.env` from `.env.example`, then set the project ID, dataset and a
server-side token that can read drafts. The seed step also needs write access.

```bash
npm run schema:deploy
npm run seed
npm run gate:sanity
```

The gate passes only when the real Sanity dataset returns the expected
`CLEAR → BLOCK` diff.

## Next after PASS

1. Reproduce the same perspective comparison through Sanity Context MCP.
2. Add music and photographer rights lanes.
3. Persist a proof object with source revisions.
4. Add Knowledge Base evidence for source-clause explanation only.
5. Add one human-approved remediation mutation and recompile.
