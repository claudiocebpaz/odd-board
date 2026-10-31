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
git clone https://github.com/OWNER/odd-board.git
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

## Code of conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
