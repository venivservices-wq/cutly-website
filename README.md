# Cutly AI website

The public front page of Cutly AI (plain HTML, CSS and JavaScript, no build step).

- `public/` is the whole site. Cloudflare Pages serves this folder (build output directory = `public`, no build command).
- `public/_headers` sets the security headers Cloudflare Pages sends.
- `public/app-demo/` is a copy of the editor's look for the demo on the page. Refresh it with `python tools/build.py` (needs the app folder next to this one).
- `tools/` is for scripts that are not part of the site.

## How changes go live
1. A change is pushed to a branch (never straight to `main`).
2. Cloudflare Pages builds a preview link for that branch.
3. The owner opens the preview, and merges the pull request when it looks right.
4. Merging to `main` deploys to the live site.

No secret, key or password belongs in this repo, and none is needed. It is public on purpose.
