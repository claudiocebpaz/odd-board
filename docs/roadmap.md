# Roadmap

## v0.3
- Multi-repo: `npx odd-board ~/repos` scans every repository under a folder, one section per repository.
- Optional enrichment: on change (hashed and debounced), call `opencode run` with a cheap model to extract summary, next step and blocked state as JSON, validated and cached in `.kanban/`. Counts stay deterministic from checkboxes.

## v0.4
- Optional GitHub integration: an "In PR" column when the feature branch has an open pull request, and a link to the issue from `issue:` frontmatter.
- Claude Code plugin (`/odd-board:open`) and OpenCode command that launch the board.

## Later
- Per-repo stage history to show how long features stay in each column.
- Desktop wrapper.
