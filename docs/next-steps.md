# Next steps

Current version: **0.2.0**. Repository: https://github.com/claudiocebpaz/odd-board (not yet on npm). Pick up from here.

## 1. Publish (manual, needs the owner)

1. ~~Create the GitHub repository and push~~ Done: https://github.com/claudiocebpaz/odd-board
2. Make sure the repository is public if it is not yet.
3. Add the `NPM_TOKEN` secret to the GitHub repository (npm automation token).
4. Release:
   ```bash
   git tag v0.2.0 && git push --tags
   ```
   `.github/workflows/release.yml` runs the tests, publishes to npm with provenance and creates the GitHub release.
5. Check the name is still free right before publishing: `npm view odd-board` should return 404.

## 2. Validate with real ODD output (highest priority after publishing)

1. Install gentle-ai with ODD for Claude Code in a test repository, run a substantial feature, and copy the resulting `odd/tasks/<feature>.md`.
2. Add it as a fixture and a test. Fix the parser where it disagrees with reality.
3. Record the tested gentle-ai version in the README "Compatibility" section.

## 3. README demo GIF

Run `npx odd-board --demo --open` (or `npm run demo`) and record about 20 seconds: the subagent finishing (agents 3 → 2) and csv-export tasks advancing. Save as `docs/demo.gif` and put it at the top of the README.

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
