import assert from 'node:assert/strict'
import {compileClearance} from '../src/compiler.js'
import {diffProofs} from '../src/diff.js'
import {publishedGraph, draftsGraph} from './fixtures.js'

const current = compileClearance(publishedGraph)
const proposed = compileClearance(draftsGraph)
const diff = diffProofs(current, proposed)

assert.equal(current.status, 'CLEAR')
assert.equal(proposed.status, 'BLOCK')
assert.equal(diff.from, 'CLEAR')
assert.equal(diff.to, 'BLOCK')
assert.equal(diff.changed, true)

const paid = proposed.findings.find((f) => f.axis === 'paid')
assert.equal(paid?.status, 'BLOCK')
assert.ok(paid?.causedBy.includes('drafts.rights-maya-2026'))

console.log(JSON.stringify({gate: 'FIXTURE', current, proposed, diff, result: 'PASS'}, null, 2))
