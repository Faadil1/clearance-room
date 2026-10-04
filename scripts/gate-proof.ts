import assert from 'node:assert/strict'
import {client} from './sanityClient.js'
import {USAGE_GRAPH_QUERY} from '../src/query.js'
import {compileClearance} from '../src/compiler.js'
import {BASELINE_PROOF_ID, proofDocument} from '../src/proof.js'
import type {UsageGraph} from '../src/types.js'

const graph = await client.fetch<UsageGraph>(
  USAGE_GRAPH_QUERY,
  {id: 'usage-holiday-ca'},
  {perspective: 'published'},
)

assert.ok(graph, 'usage-holiday-ca was not found')

const proof = compileClearance(graph)
assert.equal(proof.status, 'REVIEW', 'baseline proof must be REVIEW')

const windowFinding = proof.findings.find((finding) => finding.axis === 'window')
assert.equal(windowFinding?.status, 'REVIEW')
assert.equal(windowFinding?.allowedThrough, '2026-10-31')
assert.equal(windowFinding?.blockedFrom, '2026-11-01')
assert.ok(windowFinding?.causedBy.includes('rights-music-c09'))

const stored = await client.createOrReplace(
  proofDocument(BASELINE_PROOF_ID, graph, proof, {perspective: 'published'}),
)

const fetched = await client.getDocument<any>(BASELINE_PROOF_ID)
assert.ok(fetched, 'baseline clearanceProof was not persisted')
assert.equal(fetched.status, 'REVIEW')
assert.equal(fetched.isStale, false)
assert.equal(fetched.findings?.find((finding: any) => finding.axis === 'window')?.allowedThrough, '2026-10-31')

console.log(JSON.stringify({
  gate: 'PERSISTENT_CLEARANCE_PROOF',
  proofId: stored._id,
  status: proof.status,
  window: windowFinding,
  persisted: true,
  result: 'PASS',
}, null, 2))
