# Healthcheck endpoint

## Objective
Expose `/health` for uptime monitoring and the CI smoke test.

## Tasks
- [x] T1: `/health` returns status and version — evidence 1ad0b77
- [x] T2: Database ping with timeout — evidence 5f2e9c0
- [x] T3: CI smoke test calls `/health` — evidence e71b3a4
- [x] T4: Document the endpoint — evidence 0c4d812

## Evidence
All checks green on CI run #41.

## Progress
4 of 4 tasks done and verified.

## Next step
None. Ready for PR.
