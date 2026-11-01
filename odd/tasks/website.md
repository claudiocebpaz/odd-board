# Feature: project website

Objective: publish the odd-board website at https://claudiocebpaz.github.io/odd-board/, built with Astro from the private repository `claudiocebpaz/odd-board-site` and deployed to GitHub Pages by this repository.
Branch: `feat/website`. Delivery: one PR here (workflow + docs) plus a chain of PRs in `odd-board-site`. Tests: `npm test`.

## Specs

- S1. "me gustaría publicar un sitio web de la misma forma que el sitio del ODD plantea su website. Me gustaría hacer algo en Astro y publicarlo en GitHub Pages, porque quiero que viva todo en GitHub."
- S2. Site source in a separate repository, "Repo aparte, publica odd-board", and "el nuevo repo no necesita ser publico": `claudiocebpaz/odd-board-site`, private. Cloning odd-board does not bring the site.
- S3. The URL stays "https://claudiocebpaz.github.io/odd-board/". odd-board's own workflow checks out the private repo with a read-only deploy key (secret `SITE_DEPLOY_KEY`), builds it and deploys it to Pages. Deploys on manual run, on changes to the workflow, and hourly when the site repo's `main` moved.
- S4. Languages: "Inglés y español": English at the root, Spanish under `/es/`.
- S5. Structure: "https://gentlemanprogramming.com/ sigamos esa estructura": hero, why, how it works, validated (open data), features, install, FAQ, final CTA, footer. Structure and quality only, never its branding.
- S6. "Quiero esa prolijidad … Quiero ser muy profesional": repo hygiene equal to odd-board (Conventional Commits, PR template, AI policy), full meta/OG tags, sitemap, hreflang, verified build.
- S7. odd-board docs reflect the setup: README link, `package.json#homepage`, AGENTS.md, CONTRIBUTING.md, CONTEXT.md, next-steps.md, `.env.example` CI section, a website runbook.

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S3 | inline | done | `.github/workflows/site.yml`; YAML and shell syntax ok; trigger decision simulated for 4 cases; independent verifier found no blockers; commit `ci(site)` on `feat/website` |
| T2 | S7 | inline | done | `docs/website.md`, README, AGENTS, CONTRIBUTING, CONTEXT, next-steps, `.env.example`, `package.json` homepage; `npm test` 42/42; same commit |
| T3 | S2, S6 | inline | done | user said "Yes, create it"; https://github.com/claudiocebpaz/odd-board-site created private, empty |
| T4 | S1, S5, S6 | inline | done, not pushed | odd-board-site `59016b9` on `main`: Astro 7.4.4, CI, `verify.mjs`; negative probe (a `.map` file and a broken `src`) fails verify as expected |
| T5 | S5 | inline | done, not pushed | odd-board-site `910e688` on `feat/landing`; check 0 errors, build 3 pages, verify ok |
| T6 | S4, S6 | inline | done, not pushed | same commit: es landing, OG banner, 404, sitemap, hreflang; browser check en/es, 375 px, dark/light, no horizontal overflow |
| T7 | S3 | owner | pending | Pages source "GitHub Actions", deploy key, first manual deploy |

## Log

- L1 (2026-10-31, user): "Quiero que hagamos un plan para entender, porque me gustaría publicar un sitio web de la misma forma que el sitio del ODD plantea su website. Me gustaría hacer algo en Astro y publicarlo en GitHub Pages, porque quiero que viva todo en GitHub. Pero quiero que analices el repo padre que te voy a pasar y veas si ellos están utilizando ahí mismo el código fuente del sitio web, y analices si lo está haciendo ahí o lo está haciendo en otro lado. Preferiría que sea todo autocontenido, así que lo analicemos y planifiquemos. repo padre: https://github.com/Gentleman-Programming/gentle-ai sitio web: https://gentlemanprogramming.com/ sitio web está referenciado dentro del repositorio. Quiero esa prolijidad, quiero la misma prolijidad que tiene este sitio web y este repositorio GitHub. Quiero ser muy profesional"
- L2 (2026-10-31): analysis. gentle-ai holds no website source; the org keeps each site in its own repo (`gentle-ai-community-docs` is Astro on Netlify with en/es; `gentlemanprogramming.com` is Astro on Apache, source not public). Vite/Vitest/Bun/Prettier/Jest keep the site in-repo; Astro/Biome/pnpm keep it apart.
- L3 (2026-10-31, user): "Ubicación: Repo aparte, publica odd-board"; "Dominio: github.io por ahora"; "Idiomas: Inglés y español"; "Alcance: https://gentlemanprogramming.com/ sigamos esa estructura"; "el nuevo repo no necesita ser publico". Plan approved.
- L4 (2026-10-31): decision. The deploy workflow writes `version.json` (site repo SHA) into the build itself, so the site repo needs no knowledge of it; scheduled runs compare it with the live file and skip unchanged builds.
- L5 (2026-10-31): T1-T2 verified. Independent verifier on `site.yml`: S3 and S7 pass, no blockers. Applied advisories: no-cache read of `version.json`, runbook says the merge itself triggers the first deploy (so setup and the site repo must exist first), custom domain note covers `site`. Carried to T4: `npm run verify` must fail when `dist` holds `*.map` files, so private source never ships. Versions on this date: astro 7.4.4 (Node >=22.23.4), @astrojs/sitemap 3.7.4, @astrojs/check 0.9.12. Risk: item 5 (new deploy workflow) and item 2 (deploy key secret).
- L6 (2026-10-31): native review (RDD) on commit `ci(site)`: user granted, 4 lenses, approved and acknowledged (lineage review-0af10bc4bcbfcb40), no correction. Non-blocking warnings carried as later work: (a) the hourly run fails red until setup is done; mitigated by doing T7 before merging, optional follow-up is to make scheduled runs skip quietly when `SITE_DEPLOY_KEY` is missing; (b) `site/dist` is uploaded unguarded; T4's `npm run verify` must reject `*.map` and anything outside expected site files; (c) suggestions: pin actions by SHA, extract the compare logic into a tested script.
- L7 (2026-10-31, user): "Yes, create it". Repo created private. Site built locally in `~/Docker/odd-board-site`; nothing pushed (push and PR are the user's decision). Browser check found a horizontal overflow from long `<pre>` lines in grid cells; fixed with `minmax(0, 1fr)` columns. Spanish copy switched to a neutral register (tú). The landing commit is about 1,600 lines (CSS and two copy files), over the 400-line guideline: proposed as a `size:exception` PR because splitting copy from the components that render it would leave unbuildable slices. `version.json` is written by the odd-board workflow, not by the site.
