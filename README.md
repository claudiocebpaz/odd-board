# odd-board

A live Kanban board for **ODD (Organic Driven Development)** feature documents, with parallel agents made visible.

`odd-board` reads the `odd/tasks/*.md` files that ODD writes, in your repository and in every git worktree, and shows each tracked feature as a card that moves on its own as your agents work. It also shows which agents are working right now and on what. No backend, no database, no account, and zero runtime dependencies.

![odd-board showing features across Tracked, Implementing, Verifying and Closed](docs/screenshot.png)

```bash
npx odd-board            # in a repository that uses ODD
npx odd-board --demo     # temporary repo with simulated agents working in parallel
```

> **Unofficial community project.** odd-board is not affiliated with or endorsed by Gentleman Programming. ODD, Gentle-AI and Engram are their projects; this tool only reads the files ODD produces.

## How it works

ODD tracks substantial work in one feature document per feature (`odd/tasks/<feature>.md`) with objective, scope, a task checklist, evidence, progress and the next step. odd-board watches that folder and pushes every change to the browser over Server-Sent Events.

Columns are **never stored**. They are derived from each document every time it changes, following the ODD stages that leave a trace on disk:

| Column | ODD stage | Rule |
| --- | --- | --- |
| Tracked | Track | Document exists, no task checked yet |
| Implementing | Implement | Some tasks checked, some open |
| Verifying | Close (in progress) | All tasks checked, but checks or review still pending |
| Closed | Close | All tasks checked, no pending checks |

**Blocked** is a flag, not a column: the card stays in the stage where it stalled and is outlined in red.

## Parallel work

ODD records nothing about parallelism, so odd-board reads it from git, which knows it for certain:

1. `git worktree list` finds every checkout of the repository.
2. Each worktree is linked to a feature by its branch name. `feat/csv-export` is the feature's **primary** worker; `feat/csv-export-agent-2` (or any worktree nested inside the feature's worktree) is a **subagent** of the same feature.
3. A worktree is **active** when it changed in the last 10 minutes (uncommitted files or a recent commit). Change the window with `--window <minutes>`.

On the board, a card with active workers shows a pulsing "N agents working" line and lists its workers when expanded. The header counts active agents across the whole repository. A card that is in Implementing but has no active worker is in progress but stalled.

The **Lanes** view shows one row per worktree: branch, feature, current task, changed files and last activity. It is the quickest way to see what is running in parallel tonight.

![Lanes view with three active worktrees and one idle](docs/lanes.png)

The feature document is read from the feature's own branch when that worktree exists, then from the main checkout. File modification time alone is not trusted, because a worktree created later holds an older copy with a newer timestamp.

Authorize, Explore, Resolve uncertainty and Classify happen inside the agent session and never reach the file system, so they are not columns. Small work never gets a feature document, so it never shows up. That is ODD working as designed.

### What is deterministic and what is a heuristic

ODD does not define a status field or a fixed document schema. So:

- **Deterministic:** task counts and progress come from checkboxes (`- [ ]` / `- [x]`). ODD only checks a task off with observed proof. Indented checkboxes under a task (acceptance criteria) and checkboxes inside code blocks are not counted as tasks.
- **Commits:** a task's commit is a hash next to `evidence`/`commit` or in backticks. A bare hash must mix letters and digits, so numbers in the task text are not taken for commits.
- **Heuristic:** "blocked" and "pending checks" are detected from wording in the Progress, Next step and Evidence sections (English and Spanish). Negations ("no longer blocked"), waiting on CI, and test summaries with zero failures ("42 passed, 0 failed") are ignored.
- **Optional override:** if a document has frontmatter with `status: planned | in-progress | verifying | blocked | done`, it wins. This is a convention on top of ODD, not part of it.

Documents odd-board cannot understand are shown as `unparsed`. They are never dropped and never break the board.

## Usage

```
npx odd-board [repo-path] [options]

  -p, --port <n>   Port to listen on (default 4747)
  --host <host>    Host to bind (default 127.0.0.1)
  --window <min>   Minutes since the last change for a worktree to count
                   as an active agent (default 10)
  --json           Print the board as JSON and exit
  --demo           Temporary repo with worktrees and simulated parallel agents
  --open           Open the board in your browser
```

`--json` is handy for scripts, a morning summary, or another agent:

```bash
npx odd-board --json | jq '.columns[] | {column: .id, features: [.cards[].feature]}'
```

It also works as a library:

```js
import { buildBoard } from 'odd-board';
const board = await buildBoard('/path/to/repo');
```

## Compatibility

- Node.js 18.18 or later. Git is optional: without it, odd-board reads a single folder and shows no agent activity.
- Tested against feature documents produced by gentle-ai v4.x. ODD's document format is not a stable contract, so the parser is intentionally tolerant. If a new gentle-ai release breaks parsing, please open an issue with a sample document.
- Works with any harness that runs ODD (Claude Code, OpenCode, Codex, Pi and others), because it only reads files.

## Roadmap

- Multi-repo view (one section per repository).
- Optional enrichment with a cheap model through `opencode run` for summaries and blocked detection.
- Optional GitHub column ("In PR") from the feature branch's pull request.
- Claude Code plugin and OpenCode command that launch the board.

See [docs/roadmap.md](docs/roadmap.md).

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md). The most useful contribution early on is a real ODD feature document that the parser gets wrong. The repository ships an optional, project-scoped gentle-ai ODD setup for Claude Code and OpenCode; its requirements are in CONTRIBUTING.md.

## License

[MIT](LICENSE)
