# odd-board

A live Kanban board for **ODD (Organic Driven Development)** feature documents.

`odd-board` reads the `odd/tasks/*.md` files that ODD writes in your repository and shows every tracked feature as a card that moves on its own as your agents work. No backend, no database, no account, and zero runtime dependencies.

![odd-board showing features across Tracked, Implementing, Verifying and Closed](docs/screenshot.png)

```bash
npx odd-board            # in a repository that uses ODD
npx odd-board --demo     # try it with example documents
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

Authorize, Explore, Resolve uncertainty and Classify happen inside the agent session and never reach the file system, so they are not columns. Small work never gets a feature document, so it never shows up. That is ODD working as designed.

### What is deterministic and what is a heuristic

ODD does not define a status field or a fixed document schema. So:

- **Deterministic:** task counts and progress come from checkboxes (`- [ ]` / `- [x]`). ODD only checks a task off with observed proof.
- **Heuristic:** "blocked" and "pending checks" are detected from wording in the Progress, Next step and Evidence sections (English and Spanish).
- **Optional override:** if a document has frontmatter with `status: planned | in-progress | verifying | blocked | done`, it wins. This is a convention on top of ODD, not part of it.

Documents odd-board cannot understand are shown as `unparsed`. They are never dropped and never break the board.

## Usage

```
npx odd-board [repo-path] [options]

  -p, --port <n>   Port to listen on (default 4747)
  --host <host>    Host to bind (default 127.0.0.1)
  --json           Print the board as JSON and exit
  --demo           Serve the bundled example documents
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

- Node.js 18.18 or later.
- Tested against feature documents produced by gentle-ai v4.x. ODD's document format is not a stable contract, so the parser is intentionally tolerant. If a new gentle-ai release breaks parsing, please open an issue with a sample document.
- Works with any harness that runs ODD (Claude Code, OpenCode, Codex, Pi and others), because it only reads files.

## Roadmap

- Multi-repo view (one swimlane per repository).
- Optional enrichment with a cheap model through `opencode run` for summaries and blocked detection.
- Optional GitHub column ("In PR") from the feature branch's pull request.
- Claude Code plugin and OpenCode command that launch the board.

See [docs/roadmap.md](docs/roadmap.md).

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md). The most useful contribution early on is a real ODD feature document that the parser gets wrong.

## License

[MIT](LICENSE)
