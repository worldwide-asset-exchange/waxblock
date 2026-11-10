# Releasing WaxBlock

This guide is for the WaxBlock maintainers and admins. It covers the two ways to put a change into production:

| | Frontend-only deploy | Release |
|---|---|---|
| Use it for | A UI change that the API does not need | Any API change, or a versioned frontend |
| Deploys | `waxblock.io`, `testnet.waxblock.io`, `local.waxblock.io` | The same, plus the API images |
| Who starts it | A maintainer or an admin | An admin (only admins can create `v*` tags) |
| Who approves it | A different maintainer or admin | A different maintainer or admin |
| Version | None. Production runs the `main` commit | `vX.Y.Z` |

Both go through the `deploy` workflow (`.github/workflows/deploy.yml`) and the `production` environment. A
production job cannot read the Cloudflare token until someone approves it. GitHub does not let the person who
started the run approve it. Admins can bypass the approval; use the bypass only when no other reviewer is
available.

## Before you start

1. The change is merged to `main` through a pull request.
2. The `deploy` run for that push to `main` passed. It deploys a preview at `https://main.waxblock.pages.dev`
   (and `main.waxblock-testnet.pages.dev`, `main.waxblock-localnet.pages.dev`), behind Cloudflare Access.
3. You checked the change on the preview.

## Frontend-only deploy

1. Open **Actions → deploy → Run workflow**.
2. Select branch **`main`** and target **`production`**. Click **Run workflow**.
3. The `pages` jobs wait with the status *Waiting*. Ask a second maintainer to approve.
4. The approver opens the run, checks that the commit is the one that should go live, and clicks
   **Review deployments → production → Approve and deploy**.
5. Wait until every `pages` and `pages-domains` job passes. The run is the deployment record.
6. Open `https://waxblock.io` and check the change.

The run deploys only the frontend. It does not build an API image, so the frontend must work with the API
that providers run now.

## Release

1. Choose the version with [Semantic Versioning](https://semver.org): a new feature is a minor version, a fix
   is a patch version. Check the latest release first:

   ```sh
   gh release list -R worldwide-asset-exchange/waxblock -L 1
   ```

2. Create an annotated tag on the latest `main` and push it:

   ```sh
   git checkout main && git pull --ff-only
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```

3. A second maintainer approves the `production` deployment, as in the frontend-only deploy.
4. Wait until every job passes: `web` ×3, `pages` ×3, `pages-domains` ×3, `api-image`, `api-image-ghcr`.
5. Copy the GHCR digest from the summary of the `api-image-ghcr` job
   (`ghcr.io/worldwide-asset-exchange/waxblock-api:vX.Y.Z@sha256:…`).
6. Create the GitHub release. The notes must contain the pinned image reference, because providers deploy
   by digest. Use the `v1.3.0` release as the template:

   ```sh
   gh release create vX.Y.Z -R worldwide-asset-exchange/waxblock --verify-tag --title vX.Y.Z --notes-file notes.md
   ```

7. Tell the providers that the release is out and when to upgrade. They upgrade one at a time
   ([DEPLOYMENT.md](DEPLOYMENT.md#upgrades)).

WAX's own API deployment is not updated by the tag. It is pinned to the image digest by a separate,
reviewed change in WAX's deployment repository. The `api-image` job summary gives the digest.

## When something fails

- **Never move, delete or re-push a release tag.** The API images for a tag are immutable: the `api-image`
  jobs refuse to overwrite them. Fix the problem on `main` and release the next patch version.
- **Only the `pages` jobs failed** (for example a Cloudflare error): re-run the failed jobs of the same run.
  The re-run needs approval again.
- **The frontend in production is broken:** merge a fix and deploy it. If you need the previous frontend
  back first, open the run of the previous good deployment and click **Re-run all jobs**. It rebuilds that
  commit and deploys it after approval. In a tag run the `api-image` jobs then fail because the images
  already exist; that is expected and changes nothing. (Re-running only the `pages` jobs works for 7 days
  only: after that the build artifact has expired.)
- **The run waits and nobody approves:** a pending run stays for up to 30 days. Cancel it if the change is no
  longer wanted.
