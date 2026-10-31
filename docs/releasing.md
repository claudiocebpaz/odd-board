# Releasing

How a version of odd-board gets to npm. Publishing is done by GitHub Actions (`.github/workflows/release.yml`) when a `v*` tag is pushed: it runs the tests, publishes to npm with provenance and creates the GitHub release with generated notes.

The only step that needs the owner is the npm credential. Everything else can be done by a contributor or an agent.

## One-time setup: npm credential (owner only)

The workflow publishes with the `NPM_TOKEN` repository secret. Agents must never create, read or paste this token.

1. Sign in to [npmjs.com](https://www.npmjs.com/) with the account that will own the package (create it if needed, with two-factor authentication on).
2. Open your avatar → **Access Tokens** → **Generate New Token** → **Granular Access Token**.
3. Fill it in:
   - **Name:** `odd-board GitHub Actions`
   - **Expiration:** the longest allowed. npm limits write tokens, so note the date and renew it before it expires.
   - **Bypass two-factor authentication:** checked. CI cannot answer a 2FA prompt.
   - **Packages and scopes:** **Read and write**, **All packages**. Before the first publish the package does not exist yet, so it cannot be selected by name.
4. Copy the token and store it as a repository secret from your own terminal. The command prompts for the value, so it never lands in your shell history or in a chat:
   ```bash
   gh secret set NPM_TOKEN --repo claudiocebpaz/odd-board
   ```
5. Check it is there (this shows the name, never the value):
   ```bash
   gh secret list --repo claudiocebpaz/odd-board
   ```

### After the first publish: drop the token

npm supports trusted publishing from GitHub Actions (OIDC), which needs no stored token. Once the package exists:

1. On npmjs.com open the package → **Settings** → **Trusted Publisher** → **GitHub Actions**: owner `claudiocebpaz`, repository `odd-board`, workflow `release.yml`.
2. In `release.yml`, make sure the job uses npm 11.5.1 or later and remove the `NODE_AUTH_TOKEN` line. Keep `id-token: write`.
3. Delete the `NPM_TOKEN` secret and the token on npmjs.com.

## Every release

1. On a `chore/release-<version>` branch:
   - Bump `version` in `package.json` (`npm version <version> --no-git-tag-version`).
   - In `CHANGELOG.md`, move the `Unreleased` entries under `## [<version>] - <date>` and leave an empty `## [Unreleased]`.
   - Update "Current version" in `docs/next-steps.md`.
2. Check what will be published (about 16 files, no tests or fixtures):
   ```bash
   npm test
   npm pack --dry-run
   ```
3. Open the PR, let CI pass, merge it.
4. Tag the merge commit on `main` and push the tag:
   ```bash
   git fetch origin
   git tag v<version> origin/main
   git push origin v<version>
   ```
5. Watch the run and check the result:
   ```bash
   gh run watch --repo claudiocebpaz/odd-board
   npm view odd-board version
   ```
   The GitHub release appears under Releases with generated notes.

If the workflow fails before `npm publish`, fix it on `main`, delete the tag (`git push origin :v<version>` and `git tag -d v<version>`) and tag again. If it fails after `npm publish`, the version is taken: npm never lets a version be reused, so release the fix as the next patch version.
