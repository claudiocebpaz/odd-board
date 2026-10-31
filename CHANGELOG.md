# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
