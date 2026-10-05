import {describe, expect, it} from 'vitest'
import {normalizePerspective} from '../src/contextGraph'
import {canonicalDocumentId} from '../src/evidenceService'

describe('Sanity perspective boundaries', () => {
  it('defaults to drafts and accepts release ids/stacks', () => {
    expect(normalizePerspective()).toBe('drafts')
    expect(normalizePerspective('release-fall-campaign')).toBe('release-fall-campaign')
    expect(normalizePerspective('release-a,release-b')).toBe('release-a,release-b')
  })

  it('rejects perspective strings that could alter the MCP URL shape', () => {
    expect(() => normalizePerspective('drafts&tools=anything')).toThrow(
      'Invalid Sanity perspective',
    )
  })

  it('canonicalizes draft and release-version document ids', () => {
    expect(canonicalDocumentId('drafts.rights-1')).toBe('rights-1')
    expect(canonicalDocumentId('versions.release-fall.rights-1')).toBe('rights-1')
    expect(canonicalDocumentId('rights-1')).toBe('rights-1')
  })
})
