# Contributing to odd-board

Thanks for helping. odd-board is small on purpose: zero runtime dependencies, read-only, and tolerant of whatever ODD writes.

## Ground rules

- **Read-only.** odd-board never writes to `odd/`. ODD is the only writer of feature documents.
- **Columns are derived, never stored.** New column rules go in `src/columns.js`.
- **Never break the board.** A document that cannot be parsed shows as `unparsed`; it must not throw.
- **Zero runtime dependencies.** Node's standard library only. Dev tooling is fine.

## Reporting a parsing problem

The most valuable issue is a real feature document that odd-board gets wrong. Please include:

1. The document (redact anything private).
2. The gentle-ai version that produced it (`gentle-ai version`).
3. Which column or values you expected.

## Development

```bash
git clone https://github.com/claudiocebpaz/odd-board.git
cd odd-board
npm test
npm run demo
```

Tests use Node's built-in test runner. When you fix a parsing case, add the document to `examples/` or as an inline test in `test/` so it never regresses.

## Pull requests

- One change per PR, with tests.
- Update `CHANGELOG.md` under "Unreleased".
- Keep the README accurate if behavior or options change.

## Working with AI agents

This repository includes `AGENTS.md` with the rules above. If you use Claude Code, OpenCode or another agent, it will pick them up.

### Optional: ODD with gentle-ai

The repository also ships a project-scoped [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) setup, so agents working on odd-board follow ODD and odd-board can show its own progress. Everything lives in the repository and nothing is installed globally:

- Claude Code: `.claude/` (instructions, agents, skills, hooks) and `.mcp.json`.
- OpenCode: `opencode.json` and `.opencode/`.

To use it, install these and make sure they are on your `PATH`:

- `gentle-ai` (tested with 4.3.1). The Claude Code hooks call it, so without it they report errors.
- `engram` (tested with 3.6.0), the memory server both agents start. Set `ENGRAM_BIN` if your binary has another name or location.

Then:

- Claude Code asks you to approve the project MCP servers in `.mcp.json` the first time.
- OpenCode needs its plugin dependencies once: `npm install --prefix .opencode`.

Do not run `gentle-ai install` or `gentle-ai sync` in this repository. Even with workspace scope they write to your global agent configuration, and the files here are already set up.

## Code of conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
