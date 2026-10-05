# Clearance Room

**See what breaks before a rights change goes live.**

This README is an operator/developer runbook. Canonical product truth lives in:
- `state/CURRENT.yaml`
- `state/HANDOVER.yaml`
- `product/LIVING-PRD.md`
- `state/CONDITIONAL-GATEWAY-REGISTRY.yaml`
- `evidence/REALITY-LEDGER.md`

## Current product core

Clearance Room compares published rights with a proposed Sanity perspective and deterministically evaluates downstream usage.

Load-bearing integrations:
- Sanity Context MCP — structured graph read;
- Sanity Context Knowledge Base — source evidence only;
- Sanity Live Content API — automatic invalidation;
- Sanity Content Lake — proof persistence and explicit human-approved writes;
- Sanity Content Agent — AI explanation layer over deterministic receipts.

Status authority:
`CLEAR / BLOCK / REVIEW / UNKNOWN` comes only from the deterministic compiler.

The AI explanation layer:
- cannot create or override status;
- cannot execute a write;
- can expose only registry-backed repair proposals;
- must abstain when structured evidence is missing.

## Requirements

- Node.js 22.12+
- npm
- Sanity project/dataset with deployed schema
- project API token with Editor/write access for server-side mutations and Content Agent
- organization API token with Context Viewer for Context MCP
- configured Context MCP graph endpoint
- configured Knowledge Base evidence endpoint

## Fresh environment

```bash
npm install
```

Copy `.env.example` and configure the required values server-side. Never commit tokens.

Check configuration names without printing secret values:

```bash
npm run verify:runtime-env
```

The current schema includes remediation-recovery metadata on `clearanceProof`. After pulling a schema change:

```bash
npm run schema:deploy
```

## Regression verification

```bash
npm run verify:product
```

Equivalent to:

```bash
npm test
npm run app:build
```

## Run the operator product

```bash
npm run app:dev
```

Open the Next.js port.

Primary live workflow:
1. create or edit a user-owned Scenario Lab case;
2. scan the live blast radius;
3. inspect a rights-change or usage impact;
4. inspect deterministic findings;
5. retrieve source evidence;
6. optionally run the bounded agent investigation;
7. select only a supported repair;
8. explicitly approve a consequential mutation;
9. observe stale baseline proof → deterministic recompile → replacement proof.

## Proposed perspectives

Default:
```text
drafts
```

The product can also pass a Content Release id to Sanity Context MCP for read-only impact analysis.

Release analysis is deliberately read-only in Clearance Room:
- no remediation mutation;
- no proof persistence;
- no claim that release-write semantics are implemented.

## Degraded operation

The Runtime Health panel checks:
- Context MCP graph;
- Knowledge Base;
- Content Lake read;
- Content Lake write permission using dry-run only;
- browser-observed live stream state.

Rules:
- Context MCP unavailable → status computation fails closed.
- Knowledge Base unavailable → status may continue from structured graph; evidence explanation degrades.
- Live stream offline → manual Context MCP scan remains available; stale UI is never promoted as current.
- write outcome uncertain → do not retry blindly; use write reconciliation.
- reconciliation may rebuild only a missing audit proof after the already-approved business mutation is observed.

## Proof integrity

Use the in-product **Proof Integrity Audit**. It is read-only and never deletes historical evidence.

It detects:
- multiple fresh proofs;
- stale proofs without replacement;
- orphan supersession links.

## User-created scenarios

User scenarios are real Sanity content:
- `rights-user-*`
- `drafts.rights-user-*`
- `asset-user-*`
- `usage-user-*`

They support:
- one to six governing rights;
- current and proposed terms;
- live editing;
- adding/removing governing rights;
- explicit `NOT DOCUMENTED` structured state;
- independent deletion.

The canonical seeded Maya/C09 scenario remains only a reproducibility fallback. Do not use it as the product Definition of Done.

## Legacy gate probes

These remain available for regression/evidence:

```bash
npm run gate:fixture
npm run gate:sanity
npm run gate:context
npm run gate:proof
npm run gate:remediate
```

Do not run `seed` unless intentionally restoring the legacy reproducibility fixture.

## Dependency reproducibility

A committed `package-lock.json` is required before terminal clean-room assurance.

If it is missing after a fresh pull:

```bash
npm install
git add package-lock.json
git commit -m "chore: lock verified product dependencies"
git push
```

This is an operational reproducibility requirement, not a product capability claim.

## Canonical baseline

Project pin:
- version: `0.1.56-canonical-baseline-drift-tripwire-promoted`
- baseline continuity SHA: `8a7e8a4ff5461641c595e2cf052a95fdc32a6340`
- central active-project reconciliation wave: `fb062d6cd792cab8e27c342120824f285120bc2f`
- Product Reality: `v1.5`

The project remains in `PRODUCT_EXPLOITATION` while material depth gaps remain.
