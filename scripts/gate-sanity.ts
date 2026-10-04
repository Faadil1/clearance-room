import assert from 'node:assert/strict'
import {client} from './sanityClient.js'
import {USAGE_GRAPH_QUERY} from '../src/query.js'
import {compileClearance} from '../src/compiler.js'
import {diffProofs} from '../src/diff.js'
import type {UsageGraph} from '../src/types.js'

const id = 'usage-winter-ca'

const published = await client.fetch<UsageGraph>(USAGE_GRAPH_QUERY, {id}, {perspective: 'published'})
const drafts = await client.fetch<UsageGraph>(USAGE_GRAPH_QUERY, {id}, {perspective: 'drafts'})

assert.ok(published)
assert.ok(drafts)

const current = compileClearance(published)
const proposed = compileClearance(drafts)
const diff = diffProofs(current, proposed)

assert.equal(current.status, 'CLEAR')
assert.equal(proposed.status, 'BLOCK')
assert.equal(diff.from, 'CLEAR')
assert.equal(diff.to, 'BLOCK')
assert.equal(diff.changed, true)

const paid = proposed.findings.find((f) => f.axis === 'paid')
assert.equal(paid?.status, 'BLOCK')
assert.ok(paid?.causedBy.some((id) => id.includes('rights-maya-2026')))

console.log(JSON.stringify({gate: 'SANITY_API_PERSPECTIVE', current, proposed, diff, result: 'PASS'}, null, 2))
