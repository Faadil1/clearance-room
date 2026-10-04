# Gate #3 — Knowledge Base Grounding — PROVEN

Date: 2026-10-04

## Verdict

**PROVEN**

Clearance Room now has a separate Sanity Context Knowledge Base path for source-bound rights evidence and explanation, while preserving the deterministic evaluator as the sole authority for clearance status.

## Knowledge Base

Name: `Clearance Room — Rights Evidence`

Knowledge Base id:

`kbjKMGM1H2uf`

Source:
- project: `041j2som`
- dataset: `production`
- document type: `rightsDocument`
- published source documents discovered: 2
- generated KB entries: 7
- build status: entries up to date

Generated entry paths:
- `channels`
- `music_licensing`
- `paid_media_permissions`
- `rights_documents`
- `source_clauses`
- `territories`
- `validity_windows`

## MCP endpoint

Endpoint name:

`clearance-room-evidence`

Endpoint:

`https://api.sanity.io/v1/context/organizations/o9idurkxc/mcp/clearance-room-evidence`

Observed tools:
- `initial_context`
- `knowledge_base_read`
- `knowledge_base_search`

Endpoint truth-boundary instructions explicitly state:
- retrieve evidence and source clauses
- do not decide, infer, or override `CLEAR`, `BLOCK`, `REVIEW`, or `UNKNOWN`
- those statuses come only from the deterministic Clearance Room evaluator

## Runtime search proof

`knowledge_base_search` retrieved the C09 music-license evidence including:
- document id: `rights-music-c09`
- title: `C09 Original Soundtrack License`
- kind: `music_license`
- channel: `instagram_reels`
- territory: `CA`
- paid advertising: permitted
- valid through: `2026-10-31`
- source clause: master and sync rights cleared for paid Instagram Reels in Canada through 2026-10-31

A multi-entry search response showed inconsistent local footnote numbering in some generated entries, so it was not used as the final canonical source-binding proof.

## Canonical direct-read proof

A direct `knowledge_base_read` of path `music_licensing` returned a clean, unambiguous source mapping:

- Document ID: `rights-music-c09`
- Kind: `music_license`
- Allowed Channel: `instagram_reels`
- Allowed Territory: CA (Canada)
- Paid Advertising Allowed: Yes
- Valid From: 2026-01-01
- Valid To: 2026-10-31
- Source Clause: "Master and sync rights are cleared for paid Instagram Reels in Canada through 2026-10-31."
- Source: `C09 Original Soundtrack License — Dataset`

This evidence directly supports the already-proven deterministic window finding:
- `allowedThrough: 2026-10-31`
- `blockedFrom: 2026-11-01`

## Architecture boundary proven

`clearance-room-graph`
- dataset/GROQ endpoint
- live structured graph
- published/drafts perspectives
- feeds deterministic evaluator

`clearance-room-evidence`
- Knowledge-Base-only endpoint
- published source evidence
- explanation/traceability only
- no normative clearance authority

## Gate exit condition

Satisfied.

Next stage: productize the proven mechanisms into the user-facing/judge-facing workflow and demo surface without weakening the truth boundaries.
