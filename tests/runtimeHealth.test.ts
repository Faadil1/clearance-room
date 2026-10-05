import {describe, expect, it} from 'vitest'
import {deriveRuntimeHealth} from '../src/runtimeHealth'

describe('runtime degraded-mode policy', () => {
  it('is healthy when all server dependencies are available', () => {
    const health = deriveRuntimeHealth({
      contextGraph: 'available',
      knowledgeBase: 'available',
      contentLakeRead: 'available',
      contentLakeWrite: 'available',
    }, '2026-10-04T00:00:00.000Z')

    expect(health.overall).toBe('healthy')
    expect(health.dependencies.contentLakeWrite.dryRun).toBe(true)
  })

  it('fails closed when Context MCP is unavailable', () => {
    const health = deriveRuntimeHealth({
      contextGraph: 'unavailable',
      knowledgeBase: 'available',
      contentLakeRead: 'available',
      contentLakeWrite: 'available',
    })

    expect(health.overall).toBe('degraded')
    expect(health.dependencies.contextGraph.recovery).toContain('fail-closed')
  })

  it('degrades evidence only when Knowledge Base is unavailable', () => {
    const health = deriveRuntimeHealth({
      contextGraph: 'available',
      knowledgeBase: 'unavailable',
      contentLakeRead: 'available',
      contentLakeWrite: 'available',
    })

    expect(health.overall).toBe('degraded')
    expect(health.dependencies.knowledgeBase.recovery).toContain('Deterministic status remains usable')
  })

  it('disables consequential remediation when writes are unavailable', () => {
    const health = deriveRuntimeHealth({
      contextGraph: 'available',
      knowledgeBase: 'available',
      contentLakeRead: 'available',
      contentLakeWrite: 'unavailable',
    })

    expect(health.overall).toBe('degraded')
    expect(health.dependencies.contentLakeWrite.recovery).toContain('Disable consequential remediation')
  })

  it('does not misclassify an empty dataset write probe as a write failure', () => {
    const health = deriveRuntimeHealth({
      contextGraph: 'available',
      knowledgeBase: 'available',
      contentLakeRead: 'available',
      contentLakeWrite: 'unverified',
    })

    expect(health.overall).toBe('healthy')
    expect(health.dependencies.contentLakeWrite.state).toBe('unverified')
  })
})
