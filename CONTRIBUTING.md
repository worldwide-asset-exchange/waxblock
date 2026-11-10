# Contributing

1. Open an issue first for anything larger than a small fix, so the approach can be agreed.
2. Create a branch (infrastructure providers can push to this repository; everyone else forks it), and keep
   the change focused. `main` accepts changes only through pull requests approved by a maintainer.
3. From the repository root, before you open a pull request:

   ```sh
   npm ci
   npm run lint
   npm run build
   npm test
   ```

4. Describe what changed and why, and how you tested it. Screenshots help for UI changes.

Conventions are in [AGENTS.md](AGENTS.md) (they apply to people and coding agents alike). New wallet and chain
features use `@wharfkit/antelope`, not `eosjs` or `waxjs`.

Releases are cut by the admins: a `vX.Y.Z` tag deploys the frontend and publishes the API image
`ghcr.io/worldwide-asset-exchange/waxblock-api:vX.Y.Z`. Infrastructure providers then upgrade one at a time
([docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#upgrades)).

A maintainer can also deploy the frontend alone to production: Actions → deploy → Run workflow on `main`, with
target `production`. The run waits until a different maintainer approves the `production` deployment. It deploys
what is on `main` and builds no API image.

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE).
