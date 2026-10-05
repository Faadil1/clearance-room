# Engineering Quality — Clean External Receipt

Date: 2026-10-05  
Workflow: Product quality  
Run id: `37261750103`  
Job id: `111610243215`  
Conclusion: `success`  
Truth class: OBSERVED_EXTERNAL_CI  
Runner: GitHub-hosted `ubuntu-latest`  
Install mode: `npm ci`

## Regression

Observed on a fresh external runner after the raw-porcelain parser fix:
- dependency-locked install: PASS
- 42/42 tests: PASS
- Next production build: PASS
- TypeScript: PASS
- lint/static critical audit gate: PASS
- protected contracts: preserved

## Engineering Quality receipt

Observed verdict:

`PASS_WITH_ACCEPTED_DEBT`

Observed unresolved findings:

`EQ-AUDIT-HIGH-001`

No `EQ-DIRTY-001` remained.

Receipt notes explicitly observed:
- `working_tree_dirty=false`
- `substantive_dirty_paths=none`
- `generated_safe_dirty_paths=next-env.d.ts`
- package lock exists and is tracked

## Dependency debt

Observed:
- 2 low
- 10 moderate
- 11 high
- 0 critical

The high-severity dependency debt is accepted for the deadline because npm's available remediation proposes breaking Sanity / Content Agent dependency changes. It remains disclosed and routed to post-submission dependency remediation.

No quality score or audit result is treated as product, runtime, security, or submission authority.

## Verdict

- ENGINEERING_QUALITY_ASSURANCE: PROVEN
- verdict: PASS_WITH_ACCEPTED_DEBT
- blocking findings: none
- accepted debt: EQ-AUDIT-HIGH-001
- next debt gate: POST_SUBMISSION_DEPENDENCY_REMEDIATION
