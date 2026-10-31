# Website

The odd-board website lives at **https://claudiocebpaz.github.io/odd-board/** (English) and `/odd-board/es/` (Spanish).

## Where things are

| What | Where |
| --- | --- |
| Source (Astro) | `claudiocebpaz/odd-board-site`, a private repository |
| Build and deploy | `.github/workflows/site.yml` in this repository |
| Hosting | GitHub Pages of this repository |

GitHub Pages serves a project site at `<owner>.github.io/<repository>` of the repository that deploys it. The site is deployed from here so the URL stays `/odd-board/`. The source stays in its own repository, so cloning odd-board does not bring it. Only the built files are published.

Site changes are proposed in [odd-board issues](https://github.com/claudiocebpaz/odd-board/issues), since the source repository is private.

## When it deploys

| Trigger | Deploys |
| --- | --- |
| **Run workflow** on the Site workflow (Actions tab) | Always |
| A push to `main` that changes `.github/workflows/site.yml` | Always |
| Every hour (`:17`) | Only when the site's `main` moved since the commit in the live `version.json` |

To publish a merged site change right away, run the Site workflow by hand:

```bash
gh workflow run site.yml --repo claudiocebpaz/odd-board
```

GitHub disables scheduled workflows after 60 days without activity in the repository. If that happens, enable the Site workflow again from the Actions tab.

## One-time setup (owner only)

1. **Pages source.** In odd-board, open Settings → Pages → Build and deployment → Source, and choose **GitHub Actions**.
2. **Deploy key.** It gives this workflow read-only access to the private site repository and nothing else. Create it on your machine:

   ```bash
   ssh-keygen -t ed25519 -N "" -C "odd-board site deploy" -f site_deploy_key
   ```

   - In `odd-board-site`, open Settings → Deploy keys → Add deploy key. Paste `site_deploy_key.pub` and leave **Allow write access** off.
   - In `odd-board`, open Settings → Secrets and variables → Actions → New repository secret. Name it `SITE_DEPLOY_KEY` and paste the contents of `site_deploy_key`.
   - Delete both local files.
3. **Homepage.** Point the repository's homepage at the site:

   ```bash
   gh repo edit claudiocebpaz/odd-board --homepage https://claudiocebpaz.github.io/odd-board/
   ```

4. **First deploy.** Do steps 1 to 3, and create the site repository, before merging `site.yml`: the merge itself triggers a deploy, which fails without them. If it failed anyway, run the Site workflow by hand once they are in place, then open the URL.

## Rotating the deploy key

1. Create a new key pair as above and add the new public key to `odd-board-site`.
2. Replace the `SITE_DEPLOY_KEY` secret in `odd-board`.
3. Run the Site workflow to confirm it works.
4. Delete the old deploy key from `odd-board-site`.

## Custom domain later

1. In the site repository, set `site` to the new origin and `base: '/'` in `astro.config.mjs` (canonical, OG and sitemap URLs depend on them), and add `public/CNAME` with the domain.
2. Change `SITE_URL` in `.github/workflows/site.yml`.
3. Set the domain in Settings → Pages.
