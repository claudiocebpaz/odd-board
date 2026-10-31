# Agent instructions for odd-board

## What this project is
A read-only, zero-dependency Kanban board for ODD feature documents (`odd/tasks/*.md`).

## Rules
- Never add runtime dependencies. Node standard library only.
- odd-board never writes to a user's `odd/` folder.
- Board columns are derived in `src/columns.js`; never persist column state.
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
- `src/board.js` reads `odd/tasks` and builds the board
- `src/server.js` HTTP + SSE server and file watcher
- `public/index.html` the board UI (no build step)
- `examples/demo-repo` sample ODD documents used by `--demo` and tests
