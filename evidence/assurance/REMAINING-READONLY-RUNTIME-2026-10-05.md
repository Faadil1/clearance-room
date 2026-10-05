# Remaining Read-Only Assurance — 2026-10-05

Observed from the operator Codespace.

## Binding

- repository: `Faadil1/clearance-room`
- branch: `product/judge-workflow-4`
- observed head before follow-up fixes: `94637e9a8b9594a1bae14885924ac80d9bbb2adb`
- command: `npm run verify:remaining-readonly`
- truth class: OBSERVED
- business mutation: NONE
- protected submission: NOT PERFORMED

## Engineering Quality rerun

Observed:
- 12/12 test files PASS
- 42/42 tests PASS
- Next production build PASS
- TypeScript PASS
- npm audit: 23 total vulnerabilities
  - 2 low
  - 10 moderate
  - 11 high
  - 0 critical observed by the critical gate
- receipt verdict: `PASS_WITH_ACCEPTED_DEBT`

Observed unresolved:
- `EQ-DIRTY-001`
- `EQ-AUDIT-HIGH-001`

The `EQ-DIRTY-001` result is a harness parsing false positive caused by trimming git porcelain lines before extracting the path. The harness has been corrected after this observed run. The high dependency debt remains intentionally disclosed; do not force breaking Sanity/Content Agent changes under deadline.

## Operator filters

The live portfolio contained 3 usage requests. Target usage:

`usage-user-3dd4ef777a29`

Target proposed status:

`UNKNOWN`

Observed individual filters:

- free text: PROVEN_RUNTIME, target visible, visible count 1
- proposed status UNKNOWN: PROVEN_RUNTIME, visible count 1
- territory CA: PROVEN_RUNTIME, target visible, visible count 3
- channel instagram_reels: PROVEN_RUNTIME, target visible, visible count 3

Verdict:

`OPERATOR_FILTERS = PROVEN`

This is independent of the previously proven multi-filter composition behavior.

## Content Release availability

The primary `releases::all()` query returned `null`, and the first version of the assurance script attempted to read `.length`, producing:

`Cannot read properties of null (reading 'length')`

Truth boundary:

- this is an assurance-harness bug, not evidence that a Content Release exists or does not exist;
- no release-aware product capability is promoted from this failed classification;
- release availability remains ACTIVE / unresolved until the corrected read-only probe is rerun.

The follow-up harness now:
- accepts `releases::all()` returning an array or `null`;
- if `null`, runs the equivalent raw `*[_type == "system.release"]` query;
- classifies either `RELEASES_PRESENT` or `NO_RELEASE_PRESENT`;
- performs no business mutation.
