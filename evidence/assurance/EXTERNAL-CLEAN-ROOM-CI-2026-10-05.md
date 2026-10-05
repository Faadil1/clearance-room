# External Clean-Room CI Receipt — Run 118

Date: 2026-10-05  
Workflow: `Product quality`  
Run id: `37261638163`  
Observed workflow conclusion: `success`  
Runner: GitHub-hosted `ubuntu-latest`  
Node: 22.12  
Install mode: `npm ci`

## External clean-room behavior

Fresh GitHub Actions runner performed:
- repository checkout
- dependency-locked `npm ci`
- Engineering Quality regression harness
- 42/42 tests PASS
- Next production build PASS
- TypeScript PASS
- critical dependency audit PASS (0 critical)

The Engineering Quality receipt itself returned `PASS_WITH_ACCEPTED_DEBT`.

Observed dependency debt:
- 2 low
- 10 moderate
- 11 high
- 0 critical

## Harness defect discovered

The receipt still included `EQ-DIRTY-001`.

The receipt notes exposed the exact cause:

`substantive_dirty_paths=M next-env.d.ts; generated_safe_dirty_paths=none`

This was not real source drift. The helper used to obtain `git status --porcelain` trimmed the leading porcelain status column before path parsing, turning generated `next-env.d.ts` into a false substantive dirty path.

The parser has now been corrected to read raw porcelain output without trimming status columns.

## Verdicts

- EXTERNAL_CLEAN_ROOM_REPRODUCIBILITY: PROVEN
- DEPENDENCY_LOCK_INSTALL_WITH_NPM_CI: PROVEN
- TEST_BUILD_REEXECUTION_ON_FRESH_EXTERNAL_RUNNER: PROVEN
- ENGINEERING_QUALITY_ASSURANCE: ACTIVE pending one corrected clean receipt
- HIGH_DEPENDENCY_DEBT: ACCEPTED / DISCLOSED
- PROTECTED_SUBMISSION: NOT PERFORMED
