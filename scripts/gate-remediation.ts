import assert from 'node:assert/strict'
import {client} from './sanityClient.js'
import {USAGE_GRAPH_QUERY} from '../src/query.js'
import {compileClearance} from '../src/compiler.js'
import {
  BASELINE_PROOF_ID,
  REMEDIATED_PROOF_ID,
  proofDocument,
  storedProofIsStale,
} from '../src/proof.js'
import type {UsageGraph} from '../src/types.js'

if (!process.argv.includes('--approve')) {
  throw new Error(
    'Human approval required. Re-run with: npm run gate:remediate -- --approve',
  )
}

const baselineStored = await client.getDocument<any>(BASELINE_PROOF_ID)
assert.ok(baselineStored, 'Run npm run gate:proof before remediation')
assert.equal(baselineStored.isStale, false, 'baseline proof is already stale')

const beforeGraph = await client.fetch<UsageGraph>(
  USAGE_GRAPH_QUERY,
  {id: 'usage-holiday-ca'},
  {perspective: 'published'},
)
const beforeProof = compileClearance(beforeGraph)
assert.equal(beforeProof.status, 'REVIEW')
assert.equal(storedProofIsStale(baselineStored, beforeGraph, beforeProof), false)

await client
  .transaction()
  .patch(BASELINE_PROOF_ID, (patch) =>
    patch.set({
      isStale: true,
      staleReason: 'HUMAN_APPROVED_USAGE_REQUEST_MUTATION',
    }),
  )
  .patch('usage-holiday-ca', (patch) => patch.set({endDate: '2026-10-31'}))
  .commit()

const afterGraph = await client.fetch<UsageGraph>(
  USAGE_GRAPH_QUERY,
  {id: 'usage-holiday-ca'},
  {perspective: 'published'},
)
const afterProof = compileClearance(afterGraph)
assert.equal(afterProof.status, 'CLEAR', 'approved remediation must compile to CLEAR')

const staleBaseline = await client.getDocument<any>(BASELINE_PROOF_ID)
assert.equal(staleBaseline?.isStale, true)
assert.equal(storedProofIsStale(baselineStored, afterGraph, afterProof), true)

const remediated = await client.createOrReplace(
  proofDocument(REMEDIATED_PROOF_ID, afterGraph, afterProof, {
    perspective: 'published',
    supersedes: BASELINE_PROOF_ID,
  }),
)

const persisted = await client.getDocument<any>(REMEDIATED_PROOF_ID)
assert.equal(persisted?.status, 'CLEAR')
assert.equal(persisted?.isStale, false)
assert.equal(persisted?.supersedes?._ref, BASELINE_PROOF_ID)

console.log(JSON.stringify({
  gate: 'HUMAN_APPROVED_REMEDIATION',
  action: 'shorten_campaign_end_date',
  approvedChange: {
    usageRequestId: 'usage-holiday-ca',
    from: '2026-11-30',
    to: '2026-10-31',
  },
  previousProof: {
    id: BASELINE_PROOF_ID,
    status: beforeProof.status,
    stale: true,
  },
  newProof: {
    id: remediated._id,
    status: afterProof.status,
    stale: false,
  },
  result: 'PASS',
}, null, 2))
