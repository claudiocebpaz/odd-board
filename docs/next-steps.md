# Next steps

Current version: **0.2.1**. Repository: https://github.com/claudiocebpaz/odd-board (public, not yet on npm). Pick up from here.

## 1. Publish to npm

The full procedure is in [docs/releasing.md](releasing.md).

1. ~~Create the GitHub repository and push~~ Done: https://github.com/claudiocebpaz/odd-board
2. ~~Make the repository public~~ Done on 2026-10-31.
3. **Owner:** create an npm granular access token and store it as the `NPM_TOKEN` secret ([docs/releasing.md](releasing.md#one-time-setup-npm-credential-owner-only)). This is the only step an agent cannot do.
4. Tag and push `v0.2.1` from `main`; `.github/workflows/release.yml` tests, publishes with provenance and creates the GitHub release. `npm view odd-board` returned 404 on 2026-10-31, so the name is still free.
5. After the first publish, switch to trusted publishing and delete the token.

## 2. ~~Validate with real ODD output~~ Done (gentle-ai v4.3.1)

1. ~~Get real feature documents.~~ gentle-ai's own repository keeps 54 of them under `odd/`; all were parsed at tag `v4.3.1`.
2. ~~Add fixtures and tests, fix the parser.~~ 11 fixtures in `test/fixtures/gentle-ai-v4.3.1/` (its README lists what each covers and the remaining known misses), tests in `test/gentle-ai.test.js`.
3. ~~Record the tested version.~~ README "Compatibility" says v4.3.1.

When a new gentle-ai release ships, re-run the same check: fetch `odd/tasks/*.md` at the new tag and compare the board with what the documents say.

## 3. ~~README demo GIF~~ Done

`docs/demo.gif` (960×420, 30 s, about 100 kB) is at the top of the README: the subagent finishing (agents 3 → 2) and csv-export going from 3/6 to 5/6. It was recorded from a fresh `--demo` with headless Chrome (one screenshot every 250 ms over the DevTools protocol), cropped and encoded with ffmpeg. Re-record when the UI changes.

## 4. v0.3 (see docs/roadmap.md)

- **Multi-repo:** `npx odd-board ~/repos` builds one board per repository under a folder, with a section per repository and a global active-agent count.
- **Cheap-model enrichment (opt-in):** on document change (hash + 30 s debounce), call `opencode run -m <cheap-model>` to extract `{ summary, nextStep, blocked, blockers }` as JSON; validate, retry once, cache in `.kanban/<feature>.json`, fall back to the heuristics. Task counts stay deterministic. Check the exact `opencode run` flags with `opencode run --help`.

## 5. v0.4

- GitHub: an "In PR" column when `feat/<feature>` has an open pull request; link to the issue from `issue:` frontmatter.
- Claude Code plugin (`/odd-board:open`) and an OpenCode command that launch the board. Write once and translate with rulesync.

## 6. Launch

- Announce in the Gentleman Programming community and open an issue in gentle-ai presenting odd-board as a community tool.
- LinkedIn and X post with the GIF.

## Suggested way to continue in Claude Code

Open this repository with `claude` and ask, for example:

> "Read docs/CONTEXT.md and docs/next-steps.md. Implement the multi-repo view from section 4 following AGENTS.md rules, with tests."

If gentle-ai is installed, ODD will track it as a feature document in `odd/tasks/`, and `npx odd-board .` will show odd-board's own progress.
