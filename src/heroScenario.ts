import {compileClearance} from './compiler'
import {diffProofs} from './diff'
import {proofDocument} from './proof'
import {USAGE_GRAPH_QUERY} from './query'
import {getServerSanity} from './serverSanity'
import type {UsageGraph} from './types'

export const HERO_USAGE_ID = 'usage-winter-ca'
export const HERO_BASELINE_PROOF_ID = 'proof-usage-winter-ca-proposed'
export const HERO_REMEDIATED_PROOF_ID = 'proof-usage-winter-ca-organic'

export async function getHeroGraphs() {
  const serverSanity = getServerSanity()
  const [published, drafts] = await Promise.all([
    serverSanity.fetch<UsageGraph>(
      USAGE_GRAPH_QUERY,
      {id: HERO_USAGE_ID},
      {perspective: 'published'},
    ),
    serverSanity.fetch<UsageGraph>(
      USAGE_GRAPH_QUERY,
      {id: HERO_USAGE_ID},
      {perspective: 'drafts'},
    ),
  ])

  if (!published || !drafts) {
    throw new Error('Hero usage graph is missing from Sanity')
  }

  return {published, drafts}
}

export async function analyzeHeroImpact({persist = false} = {}) {
  const serverSanity = getServerSanity()
  const {published, drafts} = await getHeroGraphs()
  const current = compileClearance(published)
  const proposed = compileClearance(drafts)
  const diff = diffProofs(current, proposed)

  let persistedProof: {id: string; rev?: string} | null = null

  if (persist) {
    const saved = await serverSanity.createOrReplace(
      proofDocument(HERO_BASELINE_PROOF_ID, drafts, proposed, {
        perspective: 'drafts',
      }),
    )
    persistedProof = {id: saved._id, rev: saved._rev}
  }

  const proposedPaidFinding = proposed.findings.find((finding) => finding.axis === 'paid')
  const proposedRight =
    drafts.asset.rights.find((right) =>
      proposedPaidFinding?.causedBy.includes(right._originalId || right._id),
    ) ||
    drafts.asset.rights.find((right) =>
      (right._originalId || right._id).includes('rights-maya-2026'),
    )

  return {
    usage: {
      id: drafts._id,
      title: drafts.title,
      assetId: drafts.asset._id,
      assetTitle: drafts.asset.title,
      territory: drafts.territory,
      channel: drafts.channel,
      isPaid: drafts.isPaid,
      startDate: drafts.startDate,
      endDate: drafts.endDate,
    },
    current,
    proposed,
    diff,
    source: proposedRight
      ? {
          id: proposedRight._originalId || proposedRight._id,
          title: proposedRight.title,
          kind: proposedRight.kind,
          sourceClause: proposedRight.sourceClause || null,
          rev: proposedRight._rev || null,
        }
      : null,
    persistedProof,
  }
}
