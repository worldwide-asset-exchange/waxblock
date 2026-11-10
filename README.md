# WAX Block Explorer & Integrated Wallet

WaxBlock.io - WAX Blockchain Block Explorer and Integrated Web Wallet, the platform offers a user-friendly interface to monitor and validate transactions on the WAX blockchain.

As a block explorer, users have insights into blocks, transactions, accounts, and more. The explorer shows traces, transaction details and has filters on account pages to filter actions as needed.

In addition, the integrated web wallet allows users to manage their WAX account. The wallet enables users to send, receive, vote, bid for names and various other utilities. The wallet integrates with My Cloud Wallet, Anchor and more such wallets can be integrated in the future.

## Documentation

| Document | For |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the frontend, the API and the multi-provider load balancing fit together |
| [docs/API.md](docs/API.md) | REST routes, `/api/v1/health`, WebSocket events |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | Every environment variable of the API and the frontend |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Running the API in production (Docker Compose, Kubernetes, TLS, health, upgrades) |
| [docs/PROVIDERS.md](docs/PROVIDERS.md) | Infrastructure providers: checklist and handover information |
| [docs/RELEASING.md](docs/RELEASING.md) | Maintainers: frontend-only production deploys and versioned releases |
| [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) | Contributing, reporting vulnerabilities |

## Tech and background

WaxBlock is an npm monorepo containing the React/Vite frontend in
`apps/web` and the Express/Socket.IO API in `apps/api`. Use Node.js 22.22 or newer
and npm (bundled with Node.js). Install dependencies once from the repository
root; both apps share the root `package-lock.json`.

## Server & machine requirements

Getting started with installing a local environment requires the following

1. Download or clone code in this repository to a folder
2. Working nodeos server (the same machine is preferred). This nodeos server can just be a fresh install and does not have to sync with a live blockchain. It is preferable to have nodeos synced to WAX blockchain so this can cover all the features available on the wax blockchain. This will also allow the developer to connect to wallets and send transactions for testing.
3. (Optional) Hyperion server - This can be useful if a developer likes to browse through history of accounts and actions available.
4. (Optional) Light API endpoint - This is used to browse certain sections which are not provided by hyperion.
5. (Optional) Simple assets and Atomic Assets - These are only needed if there are development or changes in the NFT section under accounts.

If hyperion / light api is not available then those relevant pages will not function. However, the other aspects will continue to work.

## Running in a development environment

Once the requirements above are met, follow these steps to run the project locally:

```bash
npm ci
cp apps/web/.env.local.example apps/web/.env
cp apps/api/.env.example apps/api/.env
npm run dev
```

Then navigate to the Vite URL to view the explorer. Start the API in a second
terminal with `npm run dev:api` (port 8080 by default). Configure its blockchain
endpoints in `apps/api/.env`; the frontend's network, API, and socket settings
belong in `apps/web/.env`. See [the API documentation](apps/api/README.md) for
server configuration. Localnet uses the explorer's local network settings;
mainnet/testnet can point `VITE_API_URL` and `VITE_SOCKET_URL` at the local API.

Set `VITE_IPFS_ENDPOINTS` to a comma-separated list of public IPFS gateways, for
example `https://ipfs.filebase.io/ipfs/,https://gateway.pinata.cloud/ipfs/`.
Mainnet/testnet users can select a gateway in Network Settings; the choice is
saved in their browser like the other endpoints. If the variable is unset or
empty, the frontend uses `https://ipfs.filebase.io/ipfs/`. Gateway URLs can include
or omit the `/ipfs/` suffix. NFT images and videos, token logos, and producer/proxy
logos share the selected gateway. Ordinary HTTP media URLs load directly. Images
retain their original resolution; no image resizing service is required. Rebuild
the frontend after changing endpoint environment variables.

Token logos use WAXFP, antelope-tokens, the API backend's token metadata, and
eos-airdrops, in that priority order. Public registries are fetched by the frontend
and cached for an hour, so logos can load while the backend token cache is empty.
If an image fails, the frontend tries the next source before showing a local
placeholder. Mainnet registries are excluded on testnet and localnet.

Run these commands from the repository root:

- `npm run dev` / `npm run dev:web`: start Vite.
- `npm run dev:api`: start the API with Node's watch mode.
- `npm run start:api`: start the API without watch mode.
- `npm run lint`: lint both apps with the shared ESLint configuration.
- `npm run build`: build the frontend into `apps/web/build`. The API runs directly
  from its JavaScript sources and requires no compilation.
- `npm test`: run both apps' tests; `npm run test:web` and `npm run test:api` run them
  separately.
- `npm run format`: apply the shared Prettier configuration.

The imported API's 140 existing ESLint violations are recorded by file and rule
in `eslint-suppressions.json`. New violations fail lint. Remove resolved entries
with `npm run lint -- --prune-suppressions`; do not regenerate the baseline to accept
new violations. The existing frontend build uses Vite's TypeScript transpilation;
standalone TypeScript checking has existing errors and is not part of this build.
ESLint and its core rules package use version 9.39.5, which satisfies the React
plugin's declared peer dependency; npm installations retain peer dependency
validation.

## Docker and deployment

Build both services from the repository root with `docker compose build`, then
run them with `docker compose up -d`. The frontend is served at port 3000 and the
API at port 8080. Compose loads `apps/api/.env` when present and persists the API
cache in a named volume. Blockchain services on the host must be addressed with
`host.docker.internal` instead of `127.0.0.1` from inside the API container.
Configure frontend API/socket URLs before building; Vite bakes them into the SPA.

Individual image builds also use the repository root as context:

```bash
docker build -f apps/web/Dockerfile -t waxblock-frontend .
docker build -f apps/api/Dockerfile -t waxblock-api .
```

## History

This public repository starts from a single commit. The earlier development history is kept privately by WAX.

## Further notes on advanced configuration

The different networks are localnet, testnet and mainnet. The `apps/web/.env` file
lets users set the network they want. However, it is easiest to get setup and
started working on localnet.

Other allowed configurations are

- mainnet chain id is 1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4
- testnet chain id is f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12

Please make sure your local nodeos (at port 8888) is synced with above chain id's if you like to run on these networks.

## Other supporting services and ports

- Default nodeos is expected to run on localhost at port 8888 (http://127.0.0.1:8888)
- Default lightapi is expected to run on localhost at port 8100 (http://127.0.0.1:8100)

## License

[MIT](LICENSE)
