# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- `.env.example` lists every environment variable the project reads (none at runtime today, plus the `NPM_TOKEN` CI secret); `.env` is gitignored. A test fails when `bin/` or `src/` reads a variable missing from `.env.example`. `AGENTS.md` and `CONTRIBUTING.md` require keeping them in sync.

## [0.2.1] - 2026-10-31

Validated against the 54 real ODD feature documents in gentle-ai v4.3.1. A representative set is now a test fixture (`test/fixtures/gentle-ai-v4.3.1/`).

### Added
- `docs/releasing.md`: npm credential setup and the release procedure.
- README links the npm package, adds Install (npx, global, from source) and a "Requirements and dependencies" section: Node.js 18.18+, optional git 2.28+, a browser, optional gentle-ai, and zero runtime dependencies.
- README opens with a red "Unofficial community project" callout stating odd-board is not affiliated with Gentleman Programming or gentle-ai.
- README opens with a demo GIF (`docs/demo.gif`) of `--demo`: a subagent finishing and CSV export tasks advancing.
- Optional project-scoped gentle-ai ODD setup for contributors using Claude Code (`.claude/`, `.mcp.json`) or OpenCode (`opencode.json`, `.opencode/`). Requirements are documented in `CONTRIBUTING.md`. The published package is unchanged.
- Contribution workflow modeled on gentle-ai: issue templates (Parsing Problem, Bug Report, Feature Request) with blank issues off, a structured PR template with AI-assistance disclosure, `AI_POLICY.md`, `CONTRIBUTORS.md`, and a label catalog (`type:`, `status:`, `priority:`, `area:`).
- `CONTRIBUTING.md` now documents the issue-first workflow, labels, Conventional Commits, branch naming and the PR size budget.
- Task state from the formats real gentle-ai documents use besides checkboxes, inside a tasks section: tables with a `Status` column, `- T1 | ... | done | commit: <sha>` items, `1. [done] ...` items and `- T1 — ...; inline; done, commit <sha>` items. Status words in English and Spanish.
- Dropped or superseded tasks stay on the card, marked "dropped", and are not counted.
- An open task marked blocked (for example `**BLOCKED, NOT RUN**`) flags the card as blocked.
- Next step from an inline `Next:` / `Next step:` line or a `## Remaining/next` section.
- Top-level `Progress:` / `Status:` lines count as progress.
- Task IDs like `T2b`, `T-01`, `OSP-1`, `GO-1a` and `T-C1`.

### Fixed
- Eight real documents rendered as `unparsed` and two more as 0/0 because their tasks were not checkboxes.
- The RED step of test-first work ("RED: go test ... failed") and failures marked pre-existing, unrelated or flaky no longer count as pending checks, so finished features reach Closed.
- "A blocked request" and "dependency-blocked tests" no longer flag a card as blocked.
- Review lineage IDs (`review-562ea3fd…`) and `sha256:` digests are no longer read as commits.
- Numbers in task text (for example "10000000 rows") are no longer read as commits. A bare hash must mix letters and digits; hashes next to `evidence`/`commit` or in backticks are always accepted.
- Indented checkboxes under a task (acceptance criteria) no longer count as tasks.
- Checkboxes and headings inside code blocks are ignored.
- "No longer blocked", "ya no está bloqueado" and "waiting for CI" no longer flag a card as blocked.
- Test summaries with zero failures ("42 passed, 0 failed", "failures: 0") no longer count as pending checks, so finished features reach Closed.

## [0.2.0] - 2026-10-31

### Added
- Parallel work from git: reads `odd/tasks` in every worktree and links worktrees to features by branch name (primary and subagent workers).
- Active agent detection with a configurable window (`--window`, default 10 minutes).
- "N agents working" on cards, worker list per feature, and active agent count in the header.
- Lanes view: one row per worktree with feature, current task, changed files and last activity.
- `--demo` now builds a temporary repository with worktrees and simulates agents working in parallel.
- Works from a subfolder of a repository (monorepos).

### Changed
- The board polls every 2 seconds and pushes only when something changed, instead of watching a single folder.
- The feature document is read from its own branch first; modification time alone is no longer trusted.

## [0.1.0] - 2026-10-31

### Added
- Live board for `odd/tasks/*.md` with Server-Sent Events updates.
- Columns derived from ODD stages: Tracked, Implementing, Verifying, Closed.
- Blocked flag and pending-check detection (English and Spanish wording).
- Optional `status` frontmatter override.
- `--json` output and library exports (`buildBoard`, `parseFeatureDoc`, `columnFor`).
- `--demo` mode with example documents.
