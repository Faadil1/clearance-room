# Sanity Native Depth Evaluation

Date: 2026-10-04  
Status: CURRENT_SCOPE_DECISION  
Primary challenge path: Path One — agent + Sanity Context

## Decision rule

A Sanity surface is added only when it creates a material user/product capability that is not already carried by the shared product core.

The current product already has load-bearing:
- Sanity Context MCP structured graph reads;
- Sanity Context Knowledge Base evidence;
- Sanity Live Content API invalidation;
- Sanity Content Lake transactions;
- Sanity Content Agent narrative layer;
- published/drafts comparison;
- release-perspective read support in the product.

## App SDK

Verdict: **N/A_CURRENT_SCOPE_WITH_REASON**

Official capability:
- Sanity App SDK builds custom React applications hosted in the Sanity Dashboard.
- Its document retrieval is live by default and it supports editing/permissions.

Why not add it in the current bounded build:
- Clearance Room already has a complete operator application surface.
- A second App SDK UI would duplicate the same portfolio/impact/Scenario Lab workflow rather than add a new rights decision capability.
- The current Path One product requires server-side organization-token Context MCP access and protected mutation/recovery boundaries; duplicating those into a second browser application would increase divergence and security surface.
- No current material depth gap requires a Sanity Dashboard-hosted duplicate shell.

Reactivation trigger:
- multi-user native Dashboard distribution becomes a primary requirement;
- a Sanity-native document hook or permission surface is required that the current product cannot provide;
- judging explicitly requires Path Two/App SDK rather than the locked Path One.

Official references:
- https://www.sanity.io/docs/app-sdk
- https://www.sanity.io/docs/app-sdk/sdk-introduction
- https://www.sanity.io/docs/app-sdk/sdk-deployment

## Editorial Workflows

Verdict: **N/A_CURRENT_SCOPE_WITH_REASON**

Official capability:
- Editorial Workflows coordinates people, agents and applications around shared process state, assignments, next steps and durable history.

Why not add it now:
- Clearance Room's core protected action is one explicit operator approval tied to a deterministic proof and mutation.
- Team assignment/stage routing is additive collaboration infrastructure, not required to determine blast radius or safely execute the currently-supported repairs.
- Availability/enablement is organization-dependent and has not been observed on this project.
- Adding workflow state without a real multi-actor requirement would create parallel authority to the existing proof/approval chain.

Reactivation trigger:
- rights/legal/marketing approval becomes genuinely multi-party;
- handoffs/assignments/SLA become a material user problem;
- project account exposes Workflows and a real workflow is needed.

Official reference:
- https://www.sanity.io/editorial-workflows

## Content Releases / release perspectives

Verdict: **ACTIVE_IMPLEMENTED_RUNTIME_AVAILABILITY_PENDING**

Official capability:
- Sanity perspectives can layer one or more Content Releases.
- Context MCP's `perspective` request parameter accepts `published`, `drafts`, `raw`, or a release id.

Product implementation:
- proposed perspective is now selectable;
- default remains `drafts`;
- a release id can be analyzed read-only through the same Context MCP + deterministic compiler;
- change-centric and usage-centric analysis both receive the selected perspective;
- Content Release analysis is deliberately **analysis-only**;
- consequential remediation/proof persistence remains locked to `drafts` until release-write semantics are separately designed and proven.

Runtime truth:
- platform capability: OBSERVED in current official Sanity docs;
- product code support: IMPLEMENTED;
- this project's actual release-id availability: UNKNOWN until a real release exists and is queried.

Official references:
- https://www.sanity.io/docs/ai/sanity-context-mcp
- https://www.sanity.io/docs/content-lake/presenting-and-previewing-content
- https://www.sanity.io/docs/apis-and-sdks/content-releases-cheat-sheet

## Content Agent

Verdict: **ACTIVE_IMPLEMENTED_RUNTIME_PROOF_PENDING**

Official capability:
- Content Agent API provides a programmable AI model through Sanity and can be used with the Vercel AI SDK.
- Project Editor token authentication is supported.

Clearance Room boundary:
- Context MCP + deterministic evaluator run first;
- Knowledge Base/structured evidence is gathered;
- only the resulting receipts are sent to the AI explanation layer;
- Content Agent's own read and write capabilities are disabled for this flow;
- AI narrative cannot create a status or execute a mutation;
- if narrative contains a status outside the deterministic current/proposed receipt, it is rejected;
- writes remain on the existing explicit human-approved mutation path.

Official references:
- https://www.sanity.io/docs/apis-and-sdks/content-agent-api
- https://www.sanity.io/docs/ai/sanity-context

## Conclusion

No additional Sanity-native surface is justified merely for breadth.

Current material Sanity depth priorities are:
1. runtime-prove UNKNOWN/missing evidence;
2. runtime-prove Content Agent narrative over Context receipts;
3. runtime-prove release-id perspective if an actual release is available;
4. runtime-prove degraded dependency and write-reconciliation paths.

The product remains Path One-first and uses Sanity integrations as load-bearing capabilities rather than presentation badges.
