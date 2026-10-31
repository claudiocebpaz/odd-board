---
status: verifying
---
# API rate limiting

## Objective
Protect public endpoints with per-key rate limits.

## Tasks
- [x] T1: Token bucket middleware — evidence 3c1d9aa
- [x] T2: Per-key limits from config — evidence 8e7f610
- [x] T3: 429 responses with Retry-After — evidence b2a4c55

## Evidence
Unit tests green. Load test pending verification on staging.

## Progress
All tasks done. Independent verifier review pending.

## Next step
Run the staging load test.
