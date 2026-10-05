import {describe, expect, it} from 'vitest'
import {
  buildProofChain,
  changesForUsage,
  primaryFinding,
  printFieldValue,
  repairPreview,
  rightTitles,
  type CaseFinding,
  type CaseRightsChange,
  type ProofReceipt,
} from '../src/caseFile'

const rightsChanges: CaseRightsChange[] = [
  {
    right: {id: 'rights-maya-2026', title: 'Maya Talent Release 2026', kind: 'talent_release', publishedRev: 'p1', proposedRev: 'd1', proposedDocumentId: 'drafts.rights-maya-2026'},
    fields: [
      {field: 'sourceClause', from: 'Paid permitted.', to: 'Organic only.'},
      {field: 'paidAdvertisingAllowed', from: true, to: false},
    ],
    downstream: [{usage: {id: 'usage-winter-ca'}}, {usage: {id: 'usage-holiday-ca'}}],
  },
  {
    right: {id: 'rights-user-1', title: 'User right', kind: 'license', publishedRev: 'p2', proposedRev: 'd2', proposedDocumentId: 'drafts.rights-user-1'},
    fields: [{field: 'validTo', from: '2026-10-31', to: null}],
    downstream: [{usage: {id: 'usage-user-1'}}],
  },
]

describe('case file: what changed', () => {
  it('returns only the rights changes that reach this usage', () => {
    const changes = changesForUsage('usage-winter-ca', ['paid'], rightsChanges)
    expect(changes.map((change) => change.rightId)).toEqual(['rights-maya-2026'])
  })

  it('puts the field behind the changed axis first and marks it material', () => {
    const [change] = changesForUsage('usage-winter-ca', ['paid'], rightsChanges)
    expect(change.fields[0]).toMatchObject({field: 'paidAdvertisingAllowed', from: 'ALLOWED', to: 'PROHIBITED', material: true})
    expect(change.fields[1]).toMatchObject({field: 'sourceClause', material: false})
  })

  it('shows a missing structured value as NOT DOCUMENTED, never as a permission', () => {
    const [change] = changesForUsage('usage-user-1', ['window'], rightsChanges)
    expect(change.fields[0]).toMatchObject({label: 'Valid through', from: '2026-10-31', to: 'NOT DOCUMENTED', material: true})
    expect(printFieldValue('allowedChannels', [])).toBe('NOT DOCUMENTED')
  })

  it('returns nothing without rights-change data instead of guessing', () => {
    expect(changesForUsage('usage-winter-ca', ['paid'], null)).toEqual([])
  })
})

describe('case file: verdict', () => {
  const findings: CaseFinding[] = [
    {axis: 'territory', status: 'CLEAR', causedBy: ['rights-maya-2026'], reason: 'Every governing right grants CA.'},
    {axis: 'window', status: 'REVIEW', causedBy: ['rights-music-c09'], reason: 'The usage is cleared only through 2026-10-31.'},
    {axis: 'paid', status: 'BLOCK', causedBy: ['rights-maya-2026'], reason: 'At least one governing right explicitly prohibits paid advertising.'},
  ]

  it('explains with the finding on a changed axis, using the evaluator reason verbatim', () => {
    const finding = primaryFinding(findings, ['paid'])
    expect(finding?.axis).toBe('paid')
    expect(finding?.reason).toBe(findings[2].reason)
  })

  it('prefers a changed axis over a more severe unchanged one', () => {
    expect(primaryFinding(findings, ['window'])?.axis).toBe('window')
  })

  it('has no primary finding when every axis is CLEAR', () => {
    expect(primaryFinding([findings[0]], [])).toBeNull()
  })

  it('names causal rights by title and keeps unknown ids visible', () => {
    const rights = [{id: 'rights-maya-2026', title: 'Maya Talent Release 2026', kind: 'talent_release', sourceClause: null, rev: null}]
    expect(rightTitles(['rights-maya-2026', 'rights-x'], rights)).toEqual(['Maya Talent Release 2026', 'rights-x'])
  })
})

describe('case file: supported action', () => {
  it('reads the current value from the usage and the target from the registry mutation', () => {
    const usage = {id: 'u', title: 'Holiday', territory: 'CA', channel: 'instagram_reels', isPaid: true, startDate: '2026-10-15', endDate: '2026-11-30'}
    expect(repairPreview({id: 'shorten_campaign', label: 'Shorten', description: '', mutation: {field: 'endDate', value: '2026-10-31'}, basedOnAxis: 'window'}, usage))
      .toEqual({label: 'Campaign end date', from: '2026-11-30', to: '2026-10-31'})
    expect(repairPreview({id: 'switch_to_organic', label: 'Organic', description: '', mutation: {field: 'isPaid', value: false}, basedOnAxis: 'paid'}, usage))
      .toEqual({label: 'Paid media on this usage', from: 'true', to: 'false'})
  })
})

describe('case file: proof chain', () => {
  const receipt: ProofReceipt = {
    label: 'Switch to organic-only distribution',
    usageRequestId: 'usage-winter-ca',
    mutation: {field: 'isPaid', value: false},
    previousProof: {id: 'proof-a', status: 'BLOCK', stale: true},
    newProof: {id: 'proof-b', status: 'CLEAR', stale: false, supersedes: 'proof-a'},
    observedAt: '2026-10-05T14:23:05Z',
  }

  it('maps each receipt field to one event, in order, with no extra events', () => {
    const chain = buildProofChain(receipt, [
      {_id: 'proof-b', status: 'CLEAR', isStale: false, evaluatedAt: '2026-10-05T14:23:00Z', supersedes: 'proof-a'},
      {_id: 'proof-a', status: 'BLOCK', isStale: true, staleReason: 'Usage request mutated', evaluatedAt: '2026-10-05T14:21:00Z'},
    ])
    expect(chain.map((event) => event.kind)).toEqual(['baseline', 'approval', 'stale', 'replacement'])
    expect(chain[0]).toMatchObject({status: 'BLOCK', at: '2026-10-05T14:21:00Z', proofId: 'proof-a'})
    expect(chain[1]).toMatchObject({at: null, detail: 'Paid media on this usage → false'})
    expect(chain[2]).toMatchObject({detail: 'Usage request mutated'})
    expect(chain[3]).toMatchObject({status: 'CLEAR', at: '2026-10-05T14:23:00Z', proofId: 'proof-b'})
  })

  it('shows the status the recompile returned, whatever it is', () => {
    const chain = buildProofChain({...receipt, newProof: {...receipt.newProof, status: 'REVIEW'}})
    expect(chain.at(-1)?.status).toBe('REVIEW')
  })

  it('omits the stale event when the receipt does not report one and leaves unknown times empty', () => {
    const chain = buildProofChain({...receipt, previousProof: {...receipt.previousProof, stale: false}})
    expect(chain.map((event) => event.kind)).toEqual(['baseline', 'approval', 'replacement'])
    expect(chain[0].at).toBeNull()
    expect(chain.at(-1)?.at).toBe(receipt.observedAt)
  })
})
