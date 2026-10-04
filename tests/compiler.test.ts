import {describe, expect, it} from 'vitest'
import {compileClearance} from '../src/compiler.js'
import {diffProofs} from '../src/diff.js'
import {publishedGraph, draftsGraph} from '../scripts/fixtures.js'

describe('Technical Reality Gate #1', () => {
  it('compiles published CLEAR and draft BLOCK from the same usage request', () => {
    const current = compileClearance(publishedGraph)
    const proposed = compileClearance(draftsGraph)
    const diff = diffProofs(current, proposed)

    expect(current.status).toBe('CLEAR')
    expect(proposed.status).toBe('BLOCK')
    expect(diff.from).toBe('CLEAR')
    expect(diff.to).toBe('BLOCK')
    expect(diff.changed).toBe(true)
  })

  it('never downgrades an explicit BLOCK to REVIEW', () => {
    expect(compileClearance(draftsGraph).status).toBe('BLOCK')
  })
})
