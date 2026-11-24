# Configuration

## API (`apps/api`)

The API reads environment variables. For local runs it also reads `apps/api/.env` (variables already set in
the environment take precedence). Ready-made files: [`deploy/env/mainnet.env`](../deploy/env/mainnet.env) and
[`deploy/env/testnet.env`](../deploy/env/testnet.env).

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `NETWORK_TYPE` | yes | `mainnet` | `mainnet` or `testnet`. Selects chain constants and the cache sub-directory. |
| `PORT` | no | `8080` | HTTP and WebSocket listen port. |
| `HOST` | no | `127.0.0.1` | Public base URL of this API (informational). |
| `BLOCKCHAIN_DEFAULT` | **yes** | `http://127.0.0.1:8888` | Chain API for `/health` (`get_info`). The old name `BLOCKCHAIN_DEAFULT` is still accepted. Provider list. |
| `BLOCKCHAIN_STATE` | yes | as above | Chain API for `get_info` (every 1 s), `get_abi`, `get_account`, `get_table_by_scope`. Provider list. |
| `BLOCKCHAIN_BLOCK` | yes | as above | Chain API for `get_block` (live feed, recent blocks only). Provider list. |
| `BLOCKCHAIN_TRANSACTION` | yes | as above | `/v1/history/get_transaction`. Needs a v1 history API (Hyperion or history plugin). Provider list. |
| `BLOCKCHAIN_HISTORY` | yes | as above | `/v1/chain/get_table_rows` (all statistics, producers, tokens) and `/v1/history/get_actions`. Provider list. |
| `LIGHT_API` | yes | `http://127.0.0.1:8100` | Light API (token holders, account balances). Provider list. |
| `ATOMICASSETS` | yes | `http://127.0.0.1:8600` | AtomicAssets API (`/atomicassets/v1/assets*`, `/atomicassets/v1/transfers/_count`). Provider list. |
| `SIMPLEASSETS` | no | — | SimpleAssets API (optional, legacy). Provider list. |
| `ASSETS_COUNT`, `ASSETS_COUNT_TIMESTAMP` | no | built-in | Seed values for the NFT counter before the first AtomicAssets poll. |
| `CACHE_DIR` | no | `cache` (relative to `apps/api`) | Where the warm cache is persisted. |
| `HEALTH_MAX_HEAD_AGE_SECONDS` | no | `60` | `/health` fails when the RPC head block is older than this. |
| `APP_VERSION` | no | set by the image | Reported by `/health`. |

### Provider lists

Every chain and NFT endpoint variable above takes a list of providers:

```text
primary[,primary...][;backup[,backup...]]
```

- A single URL is a list with one primary. Existing configurations work unchanged.
- The API sends each request to the next primary in turn. The starting provider is random per process, so
  replicas do not all start on the first entry.
- A provider fails when it gives a network error, a timeout, HTTP `408`, `429` or `5xx`, or a `200` that is
  not JSON. The request is then sent to the next provider, and the failed provider is skipped for 30 s by
  every request in that process.
- A `4xx` answer is an answer, not a failure. A chain assertion (HTTP `500` with a chain error code, for
  example a missing table) is also an answer.
- Backups get traffic only when every primary failed or is in its 30 s cooldown.
- Each attempt has an 8 s timeout. Every chain read the API makes answers in less than 1.5 s on the
  recommended providers (measured 2026-11-24), so 8 s does not mark a slow but healthy provider as failed, and
  one dead provider cannot stall the 1 s block poller for long. The AtomicAssets count queries use 30 s,
  because a count from an old seed timestamp took 16 s on a healthy provider.
- `get_block` may go to a provider that is one or two blocks behind the provider that gave the head block.
  An "unknown block" answer from it is sent to the next provider without a cooldown.
- The API does not broadcast transactions. If a caller is added, a transaction is resent only after a
  connection error where the request certainly did not arrive (`ECONNREFUSED`, `ENOTFOUND`, ...). It is
  never resent after a timeout or a `5xx`.
- `/health` tries the `BLOCKCHAIN_DEFAULT` providers in turn within 5 s. It is healthy when one of them
  answers with a fresh head block. The response names that provider in `chain.provider`.
- The API sends `User-Agent: waxblock-api/1.0 (+https://github.com/worldwide-asset-exchange/waxblock)`. Some
  providers return `403` to a bare or scripting user agent.

The code is `apps/api/src/services/roundRobin.js` and `apps/api/src/services/fetchManager.js`. It mirrors the
web app's round robin (`apps/web/src/app/utilities/round-robin.ts`).

### Recommended public providers (mainnet)

Each path the API uses was checked against each provider with real requests on 2026-11-24:

| Path | greymass | eosusa | eosphere | eosnation | eosdac |
|---|---|---|---|---|---|
| `/v1/chain/get_info`, `get_table_rows`, `get_table_by_scope`, `get_abi`, `get_account` | yes | yes | yes | yes | yes |
| `/v1/chain/get_block`, recent blocks (head, head − 5,000,000) | yes | yes | yes | yes | yes |
| `/v1/chain/get_block`, block 300,000,000 (March 2024) | no (`400`) | no (`400`) | yes | yes | yes |
| `/v1/history/get_transaction`, recent transaction | yes | yes | yes | no (`410`) | yes |
| `/v1/history/get_transaction`, 2023 transaction | yes | no (`200` with `tx_not_found`) | yes | no (`410`) | yes |
| `/v1/history/get_actions` | yes | yes | yes | no (`410`) | yes |

Hosts: `wax.greymass.com`, `wax.eosusa.io`, `wax.eosphere.io`, `wax.api.eosnation.io`, `wax.eosdac.io`.

- EOS Nation has no `/v1/history/*`. It answers `410`, which is a `4xx` answer and does not fail over. Do
  not put it in `BLOCKCHAIN_TRANSACTION` or `BLOCKCHAIN_HISTORY`.
- EOS USA has partial transaction history. Its "not found" is an HTTP `200`, so the API cannot detect it.
  It is a backup only in `BLOCKCHAIN_TRANSACTION`.
- All five AtomicAssets providers served `assets/_count`, `transfers/_count`, `assets?owner=` and
  `assets/{id}`.

```sh
BLOCKCHAIN_DEFAULT=https://wax.greymass.com,https://wax.eosusa.io,https://wax.eosphere.io,https://wax.api.eosnation.io,https://wax.eosdac.io
BLOCKCHAIN_STATE=https://wax.greymass.com,https://wax.eosusa.io,https://wax.eosphere.io,https://wax.api.eosnation.io,https://wax.eosdac.io
BLOCKCHAIN_BLOCK=https://wax.greymass.com,https://wax.eosusa.io,https://wax.eosphere.io,https://wax.api.eosnation.io,https://wax.eosdac.io
BLOCKCHAIN_TRANSACTION=https://wax.greymass.com,https://wax.eosphere.io,https://wax.eosdac.io;https://wax.eosusa.io
BLOCKCHAIN_HISTORY=https://wax.greymass.com,https://wax.eosusa.io,https://wax.eosphere.io,https://wax.eosdac.io
ATOMICASSETS=https://wax.api.atomicassets.io,https://wax.eosusa.io,https://wax-aa.eosdac.io;https://wax-atomic-api.eosphere.io,https://atomic.wax.eosrio.io
```

`LIGHT_API` also takes a list. Its providers were not checked in this change.

Providers change. Check each path again before you change a list:

```sh
curl -s -A waxblock-api/1.0 -H 'Content-Type: application/json' -X POST https://<host>/v1/chain/get_info -d '{}'
curl -s -A waxblock-api/1.0 'https://<host>/atomicassets/v1/transfers/_count?after=0'
```

**Use your own nodes.** Infrastructure providers should point all endpoints at their own WAX nodes and
history services. The public endpoints in the example files are a fallback. Each API instance makes about one
RPC request per second per endpoint type while users are connected.

Outbound internet access is also required to: `api.coingecko.com`, `wax.alcor.exchange`,
`raw.githubusercontent.com`, `www.alohaeos.com`, and every producer's `bp.json` host.

## Frontend (`apps/web`)

Build-time variables (Vite). Set them before `npm run build`. Examples: `apps/web/.env.*.example`.

| Variable | Meaning |
|---|---|
| `VITE_NETWORK_TYPE` | `mainnet`, `testnet` or `localnet` |
| `VITE_CHAIN_ID` | Chain ID of the network |
| `VITE_API_URL` | WaxBlock API base URL, or a comma-separated list that the UI round-robins, for example `https://waxblock-api.eosusa.io,https://waxblock-api.eosphere.io` |
| `VITE_SOCKET_URL` | WaxBlock API base URL for the WebSocket (normally the same as `VITE_API_URL`) |
| `VITE_RPC_ENDPOINTS` | Comma-separated chain RPC endpoints the browser may use |
| `VITE_HISTORY_ENDPOINTS` | Comma-separated Hyperion endpoints |
| `VITE_LIGHTAPI_ENDPOINTS` | Comma-separated Light API endpoints |
| `VITE_ATOMIC_ENDPOINTS` | Comma-separated AtomicAssets endpoints |
| `VITE_SIMPLEASSETS` | SimpleAssets endpoint (optional) |
| `VITE_IPFS_ENDPOINTS` | Comma-separated IPFS gateways for NFT media |
| `VITE_CF_NETWORK_TYPE` | Network label used by the Cloudflare Pages build |
