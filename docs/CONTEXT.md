# Project context

Everything a new session (human or agent) needs to continue odd-board without the original conversation. Read this first, then `docs/next-steps.md`.

## Why this exists

ODD (Organic Driven Development) is the default workflow of gentle-ai (Gentleman Programming), installed into Claude Code, OpenCode, Codex, Pi and other harnesses. For substantial work it keeps one feature document per feature in `odd/tasks/<feature>.md`, mirrored in Engram. There is no visual way to see the state of all features, or which agents are working in parallel. odd-board is that view: a read-only board built only from what ODD and git already write.

The author (Claudio Ceballos Paz) uses Claude Code as the main engine, OpenCode with cheap models as executors, and is building an agent "software factory" where planning happens in Claude Code and runners execute features overnight in git worktrees. odd-board is meant to be the visual control surface for that, and a standalone open source tool for anyone using ODD.

## What we verified about ODD (gentle-ai v4.x, October 2026)

Sources: gentle-ai README, `docs/usage.md`, `docs/intended-usage.md`, `docs/quickstart.md`, docs-gentle-ai.netlify.app, gentle-shell README.

- **Seven stages:** Authorize, Explore, Resolve uncertainty, Classify, Track (before the first write), Implement task by task, Close with verified results.
- **Only Track, Implement and Close leave a trace on disk.** The first four happen inside the agent session. Small work (understood, contained risk, resumable from the diff) never gets a feature document.
- **The feature document has sections, not a schema:** objective, problem and why, scope, constraints, an actionable checklist with stable IDs and acceptance criteria, verification evidence, progress, next step. Progress and next step are free text.
- **There is no status field, no frontmatter, and no task-state enum.** The documented task marker is a checkbox, checked "only with observed proof". In practice (gentle-ai v4.3.1's own documents) agents also write task state as a `Status` table column, `T1 | ... | done | commit: <sha>` items, `1. [done] ...` and `; done, commit <sha>` clauses, plus a `## Specs` and an append-only `## Log` section. Tasks can be added or reopened with a reason. The commit that holds each task is recorded as evidence.
- **Engram mirror:** topic `odd/<feature>/tasks` holds a full copy of the document plus the file locator. If memory is unavailable, ODD records a pending sync instead of claiming success.
- **Commits:** every completed task closes with a reviewable work-unit commit on the feature branch (about 400 changed lines per slice). Push, PR and merge are separate user decisions.
- **No worktree per task.** ODD works task by task on the feature branch. Parallel writers are used only for independent units with disjoint edit surfaces. gentle-shell shows "subagent worktrees"; in Claude Code, worktree isolation is a Claude Code feature (`isolation: worktree` on a subagent), not something ODD documents.
- **RDD review** is on by default (`gentle-ai review mode disable` to opt out) and records a risk tier and outcome per task. It is the only fixed-value data in the document, and it describes review, not progress.
- **SDD** is still available but only when the user explicitly says "use SDD".

## Design decisions

| Decision | Why |
| --- | --- |
| Read-only, never writes to `odd/` | ODD is the only writer; writing would break its reconciliation with Engram |
| Columns are derived, never stored | ODD has no status field; a card is in a column because the document says so |
| Columns follow ODD stages that leave a trace: Tracked, Implementing, Verifying, Closed | The four pre-Track stages are invisible on disk |
| Blocked is a flag, not a column | Shows in which stage work stalled |
| Task counts from the state each task records | Deterministic; ODD only marks done with proof. Real documents use checkboxes, status tables, `T1 \| ... \| done` items, `1. [done]` and `; done, commit <sha>` clauses; non-checkbox formats are read only inside a tasks section. Dropped tasks are not counted |
| Blocked and pending checks from wording (EN and ES) | Heuristic; the only source available. A cheap-model extractor is planned to improve it |
| Optional `status` frontmatter override | A convention on top of ODD for users who want determinism; never required |
| Parallel work comes only from git | ODD records nothing about parallelism; git knows worktrees and activity for certain |
| Worktree ↔ feature link by branch name | `feat/<feature>` is primary, `feat/<feature>-<suffix>` or a nested worktree is a subagent |
| Feature document read from its own branch first, then main, then newest | A worktree created later holds an older copy with a newer mtime |
| Active = changed within a window (default 10 min) | Uncommitted file mtimes or a recent commit; configurable with `--window` |
| Zero runtime dependencies, no build step, single HTML UI | Smallest possible `npx` tool (about 17 kB); Vite was considered and dropped for v0.x |
| Polling every 2 s, push over SSE only on change | Works across many worktrees without per-folder watchers |
| MIT, "unofficial community project" disclaimer, no "Gentle" in the name | Matches the ecosystem's license; Gentle AI and Engram are trademarks of Alan Buscaglia ([TRADEMARKS.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/TRADEMARKS.md)); only truthful, nominative references are allowed |
| Name `odd-board` | Free on npm when checked on 2026-10-31 (`oddboard` and `odd-kanban` too) |

## Conventions users must follow for the best result

- Feature branches named `feat/<feature>`, where `<feature>` is the file name of `odd/tasks/<feature>.md`.
- Subagent worktrees either nested inside the feature worktree or on a branch that contains the feature name.
- If they want deterministic columns, a `status:` frontmatter line in the feature document (can be required through the project's `CLAUDE.md`).

## How it fits the author's factory (context, not scope)

Planned flow, not part of odd-board itself:

1. Pairing in Claude Code produces the ODD feature document ("track it, do not implement").
2. A handoff command commits the document on `feat/<feature>`, pushes, and opens a GitHub issue that points to it (labels as a state machine: `runner:ready` → `runner:claimed` → `runner:pr-open` / `runner:blocked`).
3. A runner claims the issue, creates a git worktree on the branch and runs `opencode run "Resume feature <feature> from odd/tasks/<feature>.md"`.
4. odd-board shows the feature moving and the runner as an active agent.

The planned GitHub column ("In PR") and issue links in `docs/roadmap.md` come from this flow.

## Known risks

- ~~**Not yet validated against a real gentle-ai feature document.**~~ Validated on 2026-10-31 against all 54 feature documents in gentle-ai v4.3.1; fixtures in `test/fixtures/gentle-ai-v4.3.1/`. Remaining disagreements are listed in that folder's README.
- ODD's document format can change between gentle-ai releases. Keep the parser tolerant and pin tested versions in the README.
- Blocked and pending-check detection is wording-based and can miss or misfire. On real documents the main miss is history: ODD logs are append-only, and wording cannot tell a failure that was fixed later from a current one.
- In a monorepo, worktree activity counts changes anywhere in the repository, not only under the subfolder.
