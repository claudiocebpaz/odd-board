# Releasing

Releases are fully automatic. Nobody bumps versions, tags or runs `npm publish` by hand.

On every push to `main`, `.github/workflows/release.yml` runs the tests and asks `scripts/release.js` whether the commits since the last `v*` tag deserve a release. The commit types decide (they follow [Conventional Commits](https://www.conventionalcommits.org/), see `CONTRIBUTING.md`):

| Commits since the last tag | Result |
| --- | --- |
| Only `docs`, `chore`, `ci`, `test`, `refactor`, `style`, `build` | Nothing is published |
| At least one `fix` or `perf` | Patch release (`0.2.1` → `0.2.2`) |
| At least one `feat` | Minor release (`0.2.1` → `0.3.0`) |
| A breaking change (`feat!:`, or a `BREAKING CHANGE:` footer) | Major release; before 1.0.0, minor |

When it releases, the job:

1. Sets `version` in `package.json`, moves the `## [Unreleased]` entries of `CHANGELOG.md` under `## [<version>] - <date>` (or builds them from the `feat`/`fix` subjects when Unreleased is empty), and updates "Current version" in `docs/next-steps.md`.
2. Commits `chore(release): <version>` to `main` and pushes the `v<version>` tag.
3. Publishes to npm with provenance.
4. Creates the GitHub release with the changelog entries as notes.

So the only thing a contributor does is write good commit messages and keep `## [Unreleased]` in `CHANGELOG.md` up to date. To ship a release, merge a `feat` or `fix` to `main`. To ship documentation to the npm page without a code change, wait for the next `feat` or `fix`.

Publishing uses npm **trusted publishing** (OIDC): GitHub Actions proves to npm that the run comes from this repository and this workflow, so there is no stored token, no 2FA prompt, and provenance is added automatically.

## One-time setup: Trusted Publisher (owner only)

1. Sign in to [npmjs.com](https://www.npmjs.com/) with the account that owns `odd-board` (two-factor authentication on).
2. Open the package → **Settings** → **Trusted Publisher** → **GitHub Actions** and fill in:
   - **Organization or user:** `claudiocebpaz`
   - **Repository:** `odd-board`
   - **Workflow filename:** `release.yml`
   - **Environment:** leave empty
3. Save. Optionally, under **Publishing access**, choose "Require two-factor authentication and disallow tokens" so only this workflow (or you with 2FA) can publish.
4. Delete the old `NPM_TOKEN` repository secret if it exists, and revoke that token on npmjs.com:
   ```bash
   gh secret delete NPM_TOKEN --repo claudiocebpaz/odd-board
   ```

The workflow installs npm 11 (trusted publishing needs npm 11.5.1 or later) and keeps `id-token: write`.

The first version, 0.2.1, was published by hand on 2026-10-31 because trusted publishing can only be configured for a package that already exists.

## When something fails

- **Tests fail:** nothing is committed, tagged or published. Fix it on `main`; the next push retries.
- **Publish fails after the tag was pushed** (for example, the Trusted Publisher is not configured yet): the version is already tagged, so later runs will not retry it. Fix the cause, then publish that one version by hand from a clean checkout of the tag (`git checkout v<version> && npm publish --access public`, with your 2FA) and create its GitHub release (`gh release create v<version> --generate-notes`). The next `feat` or `fix` is automatic again.
- npm never lets a version be reused. If a broken version was published, release the fix as the next version.
