# Contributing to odd-board

Thanks for helping. odd-board is small on purpose: zero runtime dependencies, read-only, and tolerant of whatever ODD writes.

## Table of Contents

- [Ground Rules](#ground-rules)
- [Issue-First Workflow](#issue-first-workflow)
- [Reporting a Parsing Problem](#reporting-a-parsing-problem)
- [AI-Assisted Contributions](#ai-assisted-contributions)
- [Label System](#label-system)
- [Development Setup](#development-setup)
- [Commit Convention](#commit-convention)
- [Branch Naming](#branch-naming)
- [Pull Request Rules](#pull-request-rules)
- [Code of Conduct](#code-of-conduct)

## Ground Rules

- **Read-only.** odd-board never writes to `odd/`. ODD is the only writer of feature documents.
- **Columns are derived, never stored.** New column rules go in `src/columns.js`.
- **Parallel work comes only from git.** Never infer it from document text.
- **Never break the board.** A document that cannot be parsed shows as `unparsed`; it must not throw.
- **Zero runtime dependencies.** Node's standard library only. Dev tooling is fine.

## Issue-First Workflow

**Every PR links to an issue.**

1. **Open an issue** with the right template: [Parsing Problem](https://github.com/claudiocebpaz/odd-board/issues/new?template=parsing_problem.yml), [Bug Report](https://github.com/claudiocebpaz/odd-board/issues/new?template=bug_report.yml) or [Feature Request](https://github.com/claudiocebpaz/odd-board/issues/new?template=feature_request.yml).
2. **Check the status.** `status:approved` is not required to open a PR while the project has a single maintainer, but issues labelled `status:needs-info` or `status:needs-design` need discussion first, or the work may be thrown away.
3. **Comment on the issue** to say you are taking it.
4. **Open a PR** that references the issue (`Closes #<number>` or `Refs #<number>`).

Questions go to [Discussions](https://github.com/claudiocebpaz/odd-board/discussions), not issues. Problems with ODD itself belong to [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai/issues).

### Looking for something to work on?

Everything labelled [`up-for-grabs`](https://github.com/claudiocebpaz/odd-board/issues?q=is%3Aissue+is%3Aopen+label%3Aup-for-grabs) is scoped, approved and unclaimed. The [roadmap](docs/roadmap.md) shows what is planned.

## Reporting a Parsing Problem

The most valuable issue is a real feature document that odd-board gets wrong. Use the [Parsing Problem](https://github.com/claudiocebpaz/odd-board/issues/new?template=parsing_problem.yml) template and include:

1. The document (redact anything private, keep the structure).
2. The gentle-ai version that produced it (`gentle-ai version`).
3. Which column or values you expected.

## AI-Assisted Contributions

**AI assistance is allowed, but you must understand and own the complete submission.** Before opening a PR:

- [ ] Confirm the change matches the issue scope.
- [ ] Inspect every changed line.
- [ ] Remove invented, unverifiable, or unrelated output.
- [ ] Run the tests and report the actual results.
- [ ] Disclose material AI assistance in the PR.

This repository includes `AGENTS.md` with the project rules; Claude Code, OpenCode and other agents pick it up. See the [AI-Assisted Contribution Policy](AI_POLICY.md) for the details.

## Label System

### Type Labels (Issues and PRs)

| Label | Meaning |
|-------|---------|
| `type:bug` | Something does not work |
| `type:feature` | New capability |
| `type:docs` | Documentation only |
| `type:refactor` | Code change with no behavior change |
| `type:chore` | Build, CI, or tooling |
| `type:breaking-change` | Changes existing behavior or output |

Every PR carries exactly one `type:*` label.

### Status Labels (Issues)

| Label | Meaning |
|-------|---------|
| `status:needs-review` | New, not triaged yet |
| `status:approved` | Scoped and accepted; a PR can be opened |
| `status:needs-info` | Waiting on the reporter |
| `status:needs-design` | Needs a decision before implementation |
| `status:duplicate` | Already reported |
| `status:invalid` | Not a problem with odd-board |
| `status:wontfix` | Out of scope |

### Priority Labels

`priority:high`, `priority:medium`, `priority:low`.

### Area Labels

| Label | Covers |
|-------|--------|
| `area:parser` | `src/parse.js` and feature document handling |
| `area:columns` | `src/columns.js` column derivation |
| `area:git` | `src/git.js`, worktrees and activity |
| `area:ui` | `public/index.html` |
| `area:server` | `src/server.js`, SSE and the file watcher |
| `area:cli` | `bin/odd-board.js` |

### Other Labels

| Label | Meaning |
|-------|---------|
| `up-for-grabs` | Approved and unclaimed |
| `good first issue` | Small and well scoped |
| `size:exception` | PR over about 400 changed lines, accepted on purpose |

## Development Setup

### Prerequisites

- Node.js 18.18 or later
- git

### Clone and Run

```bash
git clone https://github.com/claudiocebpaz/odd-board.git
cd odd-board
npm test
npm run demo
```

### Testing

Tests use Node's built-in test runner (`npm test`). When you fix a parsing case, add the document to `test/fixtures/` or `examples/` with a test so it never regresses. CI runs the tests on Node 18, 20 and 22, plus `node bin/odd-board.js --demo --json`.

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

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9\._-]+\))?!?: .+
```

### Format

```
<type>(<optional-scope>)!: <description>

[optional body]

[optional footer]
```

### Examples

```
feat(git): detect subagents in nested worktrees
fix(parse): ignore checkboxes inside code blocks
docs: add quickstart
test(columns): cover blocked cards in Verifying
ci: run the demo on every Node version
```

### Breaking Changes

Add `!` after the type or scope and a `BREAKING CHANGE:` footer. Changes to the `--json` output shape are breaking.

```
feat(cli)!: rename --window to --active-window

BREAKING CHANGE: --window is now --active-window.
```

## Branch Naming

```
^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$
```

All lowercase, hyphens as separators. Examples: `feat/multi-repo`, `fix/blocked-wording`, `docs/quickstart`.

## Pull Request Rules

- **One change per PR, with tests.** Fill in the [PR template](.github/pull_request_template.md).
- **About 400 changed lines at most.** Larger work goes in a chain of smaller PRs, or carries `size:exception` with a reason.
- **One commit per finished unit of work**, each one reviewable on its own.
- **Docs move with behavior.** Update `README.md` and `CHANGELOG.md` (under Unreleased) in the same PR.

## Code of Conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
