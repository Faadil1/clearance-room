import {getServerSanity} from './serverSanity'

export type StoredProof = {
  _id: string
  status: string
  isStale: boolean
  evaluatedAt?: string
  usageRequestId?: string
  supersedes?: string
}

export type ProofAuditIssue = {
  type:
    | 'MULTIPLE_FRESH_PROOFS'
    | 'STALE_WITHOUT_REPLACEMENT'
    | 'ORPHAN_SUPERSEDES'
  usageRequestId: string | null
  proofIds: string[]
  severity: 'warning' | 'error'
  explanation: string
}

export function analyzeProofIntegrity(proofs: StoredProof[]) {
  const ids = new Set(proofs.map((proof) => proof._id))
  const replacementsByBaseline = new Map<string, StoredProof[]>()

  for (const proof of proofs) {
    if (!proof.supersedes) continue
    const list = replacementsByBaseline.get(proof.supersedes) || []
    list.push(proof)
    replacementsByBaseline.set(proof.supersedes, list)
  }

  const byUsage = new Map<string, StoredProof[]>()
  for (const proof of proofs) {
    const usageId = proof.usageRequestId || 'UNKNOWN_USAGE'
    const list = byUsage.get(usageId) || []
    list.push(proof)
    byUsage.set(usageId, list)
  }

  const issues: ProofAuditIssue[] = []

  for (const [usageRequestId, usageProofs] of byUsage) {
    const fresh = usageProofs.filter((proof) => !proof.isStale)
    if (fresh.length > 1) {
      issues.push({
        type: 'MULTIPLE_FRESH_PROOFS',
        usageRequestId,
        proofIds: fresh.map((proof) => proof._id),
        severity: 'warning',
        explanation:
          'More than one non-stale proof exists for this usage. Historical pre-fix proof noise should be reviewed rather than silently deleted.',
      })
    }
  }

  for (const proof of proofs) {
    if (proof.isStale && !(replacementsByBaseline.get(proof._id)?.length)) {
      issues.push({
        type: 'STALE_WITHOUT_REPLACEMENT',
        usageRequestId: proof.usageRequestId || null,
        proofIds: [proof._id],
        severity: 'error',
        explanation:
          'A stale proof has no superseding replacement. Reconcile the write outcome before relying on the audit chain.',
      })
    }

    if (proof.supersedes && !ids.has(proof.supersedes)) {
      issues.push({
        type: 'ORPHAN_SUPERSEDES',
        usageRequestId: proof.usageRequestId || null,
        proofIds: [proof._id, proof.supersedes],
        severity: 'error',
        explanation:
          'A replacement proof points to a missing baseline proof.',
      })
    }
  }

  return {
    result: issues.some((issue) => issue.severity === 'error')
      ? 'HOLD' as const
      : issues.length
        ? 'PASS_WITH_HISTORICAL_WARNINGS' as const
        : 'PASS' as const,
    summary: {
      proofs: proofs.length,
      usagesWithProofs: byUsage.size,
      freshProofs: proofs.filter((proof) => !proof.isStale).length,
      staleProofs: proofs.filter((proof) => proof.isStale).length,
      issues: issues.length,
    },
    issues,
    truth: {
      action: 'read-only-audit' as const,
      automaticDeletion: false,
      historicalEvidencePreserved: true,
    },
  }
}

export async function auditProofIntegrity() {
  const client = getServerSanity()
  const proofs = await client.fetch<StoredProof[]>(
    `*[_type == "clearanceProof"] | order(evaluatedAt asc){
      _id,
      status,
      isStale,
      evaluatedAt,
      "usageRequestId": usageRequest._ref,
      "supersedes": supersedes._ref
    }`,
  )

  return {
    ...analyzeProofIntegrity(proofs),
    observedAt: new Date().toISOString(),
  }
}
