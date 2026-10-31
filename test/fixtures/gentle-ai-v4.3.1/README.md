# Real ODD feature documents from gentle-ai v4.3.1

These files are unmodified copies of ODD feature documents written by gentle-ai's own agents while developing gentle-ai. They are the fixtures for `test/gentle-ai.test.js`.

- Source: https://github.com/Gentleman-Programming/gentle-ai, folder `odd/tasks/`
- Tag: `v4.3.1` (released 2026-10-27), commit `2dba7784114fff57864519c4c0d067e952a8c98b`
- License: MIT, Copyright (c) 2025 Gentleman Programming. The full notice is in [`LICENSE`](LICENSE) next to this file.
- Copied on 2026-10-31 with `gh api "repos/Gentleman-Programming/gentle-ai/contents/odd/tasks/<file>?ref=v4.3.1" -H "Accept: application/vnd.github.raw"`.

## What each fixture covers

| Fixture | Task format | Expected card |
| --- | --- | --- |
| `4670-rdd-off-unc.md` | Table with `Status` and `Commit` columns | 1/1, Closed |
| `pi-routing-canon-bundle.md` | Table with a `Work` column; the route cell says "later" before the `Status` cell | 1/2, Implementing |
| `beta-feedback-2026-10.md` | Table with an `Evidence` column; inline `- Next:` line | 9/9, Closed |
| `doctor-executable-health-delivery.md` | `- T1 \| S1-S5 \| ... \| done \| commit: <40-char sha>` items, one `dropped` | 4/4 (dropped not counted), Closed |
| `4739-passive-delta-after-acknowledgement.md` | `- T1 — ...; inline; done, commit <sha>` | 2/2, Closed |
| `ga-2995-cr-edge-detachment.md` | `1. [done] ...` numbered items | 6/6, Closed |
| `gentle-shell-linux-first-ci.md` | Checkboxes; one open task marked `**BLOCKED, NOT RUN**` | 7/8, Implementing, blocked |
| `gentle-shell-dual-mode-install.md` | Open checkboxes only | 0/7, Tracked |
| `claude-native-rdd-models.md` | Checkboxes; top-level `Progress:` line with a pending commit and a failed suite | 2/2, Verifying |
| `pi-sync-mcp-json.md` | Checkboxes; evidence full of TDD `RED: ... failed` lines | 2/2, Closed |
| `telemetry-metrics-cardinality.md` | Checkboxes; failures recorded as "pre-existing, unrelated" | 4/4, Closed |

No feature document in v4.3.1 is written in Spanish. Several quote the user in Spanish ("si, hagamos las 3", "hagamos eso"); Spanish status words are covered by a synthetic test.

## Validation against all 54 documents (2026-10-31)

Every `odd/tasks/*.md` file (53) plus `odd/1635-antigravity-concurrency.md` at v4.3.1 was parsed before and after the parser changes.

| Column | Before | After |
| --- | --- | --- |
| Tracked | 14 | 4 |
| Implementing | 24 | 25 |
| Verifying | 8 | 8 |
| Closed | 8 | 17 |

What the parser got wrong before:

- **8 documents rendered as `unparsed`** (0/0 tasks): their tasks are in a table or in `T1 | ... | done` items, not checkboxes. Now 0.
- **2 more showed 0/0** although every task was done (`1. [done] ...` lists).
- **A next step was found in 15 documents; now 21.** The others write it as an inline `Next:` / `Next step:` line or under `## Remaining/next`.
- **Pending checks fired on 20 documents**, mostly from the TDD `RED` step (ODD records the expected failure as evidence) and from failures the document itself marks as pre-existing or flaky. Two finished features (`pi-sync-mcp-json`, `telemetry-metrics-cardinality`) sat in Verifying only because of that; they are now Closed.
- **A top-level `Progress:` line was ignored**, so `claude-native-rdd-models` ("pending commit and final assessment", a failed suite) showed as Closed. It is now Verifying.
- **One false "blocked"** (`opencode-v2-model-and-plugin-recovery`) from "a request was blocked by the sandbox" and "dependency-blocked tests".
- A task marked `**BLOCKED**` in its own text did not flag the card (`gentle-shell-linux-first-ci`).
- Review lineage IDs (`review-562ea3fd...`) could be taken for commits.

Known remaining disagreements (wording heuristics; the planned cheap-model extractor is the fix):

- Pending checks still fire on past failures that a later log entry resolved (for example `review-runtime-context-budget`, `retire-rtk`, `ga-4882-telemetry-lock`). A heuristic over wording cannot order events.
- Pending checks miss a pending review written as an instruction ("Run the authorized native review", `4504-active-lineage-asset-freshness`) or inside a done task's status cell ("native CI rerun pending", `gentle-shell-macos-parity`).
- `repair-opencode-4471-pr-stack` is flagged blocked because its evidence says the existing PRs "were OPEN/BLOCKED" on GitHub.
- `gentle-shell-core-three-os` and `odd/1635-antigravity-concurrency.md` record work units without any task status, so they show 0/0.
