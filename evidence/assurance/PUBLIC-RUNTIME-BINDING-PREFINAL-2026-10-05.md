# Public Runtime Binding — Pre-Final Receipt

Date: 2026-10-05  
Provider: Vercel  
Project: `clearance-room`  
Project id: `prj_IzIaWRsgFqosTRmdeQ123iEliaLF`

## Production deployment observed

Deployment:
- id: `dpl_2cNmZcKVMixj2q3iNJQFvb26B1or`
- state: `READY`
- target: `production`
- deployment URL: `clearance-room-71w3x9lwv-faadil1s-projects.vercel.app`
- stable alias: `clearance-room.vercel.app`
- secondary alias: `clearance-room-faadil1s-projects.vercel.app`
- Git branch metadata: `product/judge-workflow-4`
- Git SHA metadata: `e3290d15b902b64ea6e822dbd1b9e424f8335e0a`

The operator confirmed the local tracked tree was clean before this deployment.

## Public runtime health

Observed by unauthenticated operator curl against the stable alias:

- `GET /` → HTTP 200
- `GET /api/health` → `overall: healthy`

Health dependencies observed:
- Context MCP: available
- Knowledge Base: available
- Content Lake read: available
- Content Lake write: available by dry-run
- Live Content: client-observed

Vercel runtime logs for this deployment independently show:
- `GET /api/health` → 200
- `GET /` → 200

## Production endurance finding

Vercel runtime errors exposed an older production deployment of the same SSE implementation timing out on `/api/live` after 300 seconds.

Truth boundary:
- the timeout records belong to the prior deployment `dpl_4JXVgPV6UmHib7un3jAGQZhFVUV9`;
- the stable public runtime otherwise proved healthy;
- because the same indefinite SSE implementation was still present at `e3290d1`, this is treated as a reproducible production-platform endurance risk rather than ignored historical noise.

## Fix

Commit:

`461d67841562648446c46002918f5aee61b991c8`

changes the live SSE route to:
- preserve 15-second heartbeats;
- send an explicit `reconnect` event;
- close and clean up the stream at 240 seconds;
- allow native EventSource reconnection before Vercel's 300-second function timeout;
- perform no business mutation.

## Current verdict

- PUBLIC_RUNTIME_EXISTS: PROVEN
- PUBLIC_ROOT_ACCESS: PROVEN
- PUBLIC_RUNTIME_HEALTH: PROVEN
- STABLE_ALIAS: PROVEN
- EXACT_BINDING_TO_e3290d1: PROVEN
- FINAL_RUNTIME_COMMIT_BINDING: ACTIVE

Reason:
the production-hardening fix advances the candidate head to `461d678...`; one final production deployment from that clean head is required before terminal binding can be promoted.
