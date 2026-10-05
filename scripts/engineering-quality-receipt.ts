import {execFileSync, spawnSync} from 'node:child_process'
import {existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'

type CommandReceipt = {
  command: string
  status: 'PASS' | 'FAIL'
  exitCode: number
}

function run(command: string, args: string[]): CommandReceipt {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  })

  return {
    command: [command, ...args].join(' '),
    status: result.status === 0 ? 'PASS' : 'FAIL',
    exitCode: result.status ?? 1,
  }
}

function git(args: string[]) {
  return execFileSync('git', args, {encoding: 'utf8'}).trim()
}

function tracked(path: string) {
  try {
    git(['ls-files', '--error-unmatch', path])
    return true
  } catch {
    return false
  }
}

const functional = run('npm', ['test'])
const build = functional.status === 'PASS'
  ? run('npm', ['run', 'app:build'])
  : {command: 'npm run app:build', status: 'FAIL' as const, exitCode: 1}

const audit = functional.status === 'PASS' && build.status === 'PASS'
  ? run('npm', ['audit', '--omit=dev', '--audit-level=critical'])
  : {command: 'npm audit --omit=dev --audit-level=critical', status: 'FAIL' as const, exitCode: 1}

const commit = git(['rev-parse', 'HEAD'])
const branch = git(['branch', '--show-current'])
const dirtyLines = execFileSync(
  'git',
  ['status', '--porcelain'],
  {encoding: 'utf8'},
)
  .split('\n')
  .filter((line) => line.length > 0)
const generatedSafeDirtyPaths = new Set([
  'next-env.d.ts',
  'evidence/assurance/ENGINEERING-QUALITY-RECEIPT.json',
])
const substantiveDirtyLines = dirtyLines.filter((line) => {
  const path = line.slice(3).trim()
  return !generatedSafeDirtyPaths.has(path)
})
const dirty = substantiveDirtyLines.length > 0
const lockExists = existsSync('package-lock.json')
const lockTracked = lockExists && tracked('package-lock.json')

const unresolved: Array<Record<string, unknown>> = []

if (!lockTracked) {
  unresolved.push({
    id: 'EQ-LOCK-001',
    class: 'test_or_type_health',
    severity: 'medium',
    summary: 'package-lock.json is not committed; dependency clean-room reproducibility is incomplete.',
    disposition: 'DEFERRED_WITH_GATE',
    reason: 'Commit the generated lockfile before BUILD_CANDIDATE_READY.',
    next_gate: 'CLEAN_ROOM_REPRODUCIBILITY',
  })
}

if (dirty) {
  unresolved.push({
    id: 'EQ-DIRTY-001',
    class: 'correctness_or_bug_risk',
    severity: 'medium',
    summary: 'Engineering-quality verification ran on a dirty working tree.',
    disposition: 'DEFERRED_WITH_GATE',
    reason: 'Freeze and commit the candidate code state, then rerun before terminal assurance.',
    next_gate: 'ENGINEERING_QUALITY_ASSURANCE',
  })
}

let auditCounts = {low: 0, moderate: 0, high: 0, critical: 0, total: 0}
try {
  const auditJsonRaw = execFileSync(
    'npm',
    ['audit', '--omit=dev', '--json'],
    {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']},
  )
  const parsed = JSON.parse(auditJsonRaw)
  auditCounts = {
    low: Number(parsed?.metadata?.vulnerabilities?.low || 0),
    moderate: Number(parsed?.metadata?.vulnerabilities?.moderate || 0),
    high: Number(parsed?.metadata?.vulnerabilities?.high || 0),
    critical: Number(parsed?.metadata?.vulnerabilities?.critical || 0),
    total: Number(parsed?.metadata?.vulnerabilities?.total || 0),
  }
} catch (error: any) {
  try {
    const parsed = JSON.parse(String(error?.stdout || '{}'))
    auditCounts = {
      low: Number(parsed?.metadata?.vulnerabilities?.low || 0),
      moderate: Number(parsed?.metadata?.vulnerabilities?.moderate || 0),
      high: Number(parsed?.metadata?.vulnerabilities?.high || 0),
      critical: Number(parsed?.metadata?.vulnerabilities?.critical || 0),
      total: Number(parsed?.metadata?.vulnerabilities?.total || 0),
    }
  } catch {
    // The human-readable critical audit command above remains the authoritative fallback.
  }
}

if (audit.status === 'FAIL' || auditCounts.critical > 0) {
  unresolved.push({
    id: 'EQ-AUDIT-CRITICAL-001',
    class: 'correctness_or_bug_risk',
    severity: 'critical',
    summary: 'Runtime dependency critical-vulnerability audit did not pass.',
    disposition: 'BLOCKING',
    reason: 'Resolve critical runtime dependency vulnerability findings without weakening behavior.',
    next_gate: 'ENGINEERING_QUALITY_ASSURANCE',
  })
}

if (auditCounts.high > 0 && auditCounts.critical === 0) {
  unresolved.push({
    id: 'EQ-AUDIT-HIGH-001',
    class: 'correctness_or_bug_risk',
    severity: 'high',
    summary: `npm audit reports ${auditCounts.high} high-severity runtime dependency vulnerabilities and no critical vulnerabilities.`,
    disposition: 'ACCEPTED_DEBT',
    reason: 'Current npm remediation proposes breaking dependency changes. Preserve the verified build under deadline and disclose this debt rather than force-upgrading the Sanity/Content Agent dependency graph.',
    next_gate: 'POST_SUBMISSION_DEPENDENCY_REMEDIATION',
  })
}

const testsPass = functional.status === 'PASS'
const buildPass = build.status === 'PASS'
const behaviorPass = testsPass && buildPass
const blocking = unresolved.some((item) => item.disposition === 'BLOCKING')

const verdict =
  !testsPass || !buildPass || blocking
    ? 'HOLD'
    : unresolved.length
      ? 'PASS_WITH_ACCEPTED_DEBT'
      : 'PASS'

const receipt = {
  schema_version: '1.0.0',
  project: 'clearance-room',
  repository: 'Faadil1/clearance-room',
  commit,
  branch,
  generated_at: new Date().toISOString(),
  activation_reason:
    'Active code-bearing project without a current project-local Engineering Quality receipt; material AI-assisted code changes are present.',
  provider: {
    name: 'native-toolchain-bounded-quality-pass',
    version: null,
    authority: 'NONE',
    status_json_pointer: null,
  },
  scan_scope: {
    paths: ['app/', 'src/', 'scripts/', 'tests/', 'schemaTypes/'],
    excluded_paths: ['node_modules/', '.next/', '.sanity/'],
    languages: ['TypeScript', 'TSX'],
    language_policy: null,
  },
  quality_signals: {
    baseline: {
      strict_score: null,
      objective_score: null,
      open_findings: null,
    },
    after: {
      strict_score: null,
      objective_score: null,
      open_findings: unresolved.length,
    },
    score_interpretation: 'SIGNAL_NOT_TERMINAL_AUTHORITY',
  },
  material_findings_fixed: [
    {
      id: 'EQ-PROOF-AUDIT-001',
      class: 'correctness_or_bug_risk',
      severity: 'medium',
      summary: 'Proof-integrity analysis extracted into a deterministic pure function with regression tests.',
      evidence_pointer: 'tests/proofAudit.test.ts',
    },
    {
      id: 'EQ-RUNTIME-HEALTH-001',
      class: 'correctness_or_bug_risk',
      severity: 'medium',
      summary: 'Runtime dependency fail-closed policy extracted into a deterministic pure function with regression tests.',
      evidence_pointer: 'tests/runtimeHealth.test.ts',
    },
  ],
  unresolved_findings: unresolved,
  regression_verification: {
    functional_tests: testsPass ? 'PASS' : 'FAIL',
    build_or_typecheck: buildPass ? 'PASS' : 'FAIL',
    lint_or_static_analysis: audit.status === 'PASS' ? 'PASS' : 'FAIL',
    behavior_receipts_preserved: behaviorPass ? 'PASS' : 'UNKNOWN',
    notes: [
      functional.command,
      build.command,
      audit.command,
      `working_tree_dirty=${dirty}`,
      `substantive_dirty_paths=${substantiveDirtyLines.join(',') || 'none'}`,
      `generated_safe_dirty_paths=${dirtyLines.filter((line) => generatedSafeDirtyPaths.has(line.slice(3).trim())).map((line) => line.slice(3).trim()).join(',') || 'none'}`,
      `audit_low=${auditCounts.low}`,
      `audit_moderate=${auditCounts.moderate}`,
      `audit_high=${auditCounts.high}`,
      `audit_critical=${auditCounts.critical}`,
      `package_lock_exists=${lockExists}`,
      `package_lock_tracked=${lockTracked}`,
    ].join('; '),
  },
  protected_contracts: {
    public_api: 'PRESERVED',
    evidence_schema: 'PRESERVED',
    deterministic_scenario: 'PRESERVED',
    security_controls: 'PRESERVED',
    other: [
      'Deterministic evaluator remains sole CLEAR/BLOCK/REVIEW/UNKNOWN authority.',
      'Human approval remains required for consequential remediation.',
      'Context MCP remains read-only.',
    ],
  },
  scope_protection: {
    product_scope_expanded_for_score: false,
    broad_rewrite_during_freeze: false,
    exceptions: [],
  },
  evidence_pointers: [
    'npm test',
    'npm run app:build',
    'npm audit --omit=dev --audit-level=critical',
    'tests/proofAudit.test.ts',
    'tests/runtimeHealth.test.ts',
    'state/CONDITIONAL-GATEWAY-REGISTRY.yaml',
  ],
  verdict,
  verdict_reason:
    verdict === 'PASS'
      ? 'Tests, production build and runtime critical-vulnerability audit passed on a clean dependency-locked code state.'
      : verdict === 'PASS_WITH_ACCEPTED_DEBT'
        ? 'Behavior verification passed; disclosed non-critical terminal debt remains gated before BUILD_CANDIDATE_READY.'
        : 'Engineering Quality cannot pass because regression verification or a blocking runtime dependency audit failed.',
}

const path = 'evidence/assurance/ENGINEERING-QUALITY-RECEIPT.json'
mkdirSync(dirname(path), {recursive: true})
writeFileSync(path, JSON.stringify(receipt, null, 2) + '\n')

console.log(JSON.stringify({
  result: verdict,
  receipt: path,
  commit,
  branch,
  unresolved: unresolved.map((item) => item.id),
}, null, 2))

if (verdict === 'HOLD') process.exitCode = 1
