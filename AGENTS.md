# Agent instructions for odd-board

## Start here
1. `docs/CONTEXT.md` — why the project exists, what was verified about ODD, every design decision and known risks.
2. `docs/next-steps.md` — current version, what is pending and in which order.
3. `docs/roadmap.md` — planned versions.

## What this project is
A read-only, zero-dependency Kanban board for ODD feature documents (`odd/tasks/*.md`).

## Rules
- Never add runtime dependencies. Node standard library only.
- odd-board never writes to a user's `odd/` folder.
- Board columns are derived in `src/columns.js`; never persist column state.
- Parallel work comes only from git (worktrees, status, last commit). Never infer it from document text.
- Parsing must never throw for a single bad document. Unknown documents render as `unparsed`.
- Every parsing fix ships with a test using a real-looking document.
- Keep `README.md` and `CHANGELOG.md` in sync with behavior changes.

## Commands
- Tests: `npm test`
- Demo: `npm run demo`
- Board as JSON: `node bin/odd-board.js --demo --json`

## Layout
- `bin/odd-board.js` CLI
- `src/parse.js` feature document parser
- `src/columns.js` column derivation
- `src/board.js` reads `odd/tasks` in every worktree and builds the board
- `src/git.js` worktrees and activity (the only source for parallel work)
- `src/demo.js` temporary demo repo with simulated agents
- `src/server.js` HTTP + SSE server and file watcher
- `public/index.html` the board UI (no build step)
- `examples/demo-repo` sample ODD documents used by `--demo` and tests
