# Configuration

## API (`apps/api`)

The API reads environment variables. For local runs it also reads `apps/api/.env` (variables already set in
the environment take precedence). Ready-made files: [`deploy/env/mainnet.env`](../deploy/env/mainnet.env) and
[`deploy/env/testnet.env`](../deploy/env/testnet.env).

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `NETWORK_TYPE` | yes | `mainnet` | `mainnet` or `testnet`. Selects chain constants and the cache sub-directory. |
| `PORT` | no | `8080` | HTTP and WebSocket listen port. |
| `ORIGIN_AUTH_KEY` | yes, for providers | — | Secret value of the `X-WaxBlock-Origin-Auth` header that only our Cloudflare zone sends. At least 32 printable ASCII characters. When set, every request except `/api/v1/health` and `/api/v1/test` needs it (`403` otherwise), including every socket.io request. With `NODE_ENV=production` (the container image and the systemd unit set it) the API **refuses to start** without it. See [install/reverse-proxy.md](install/reverse-proxy.md#the-origin-key). |
| `ORIGIN_AUTH` | no | — | `off` lets a production instance start without `ORIGIN_AUTH_KEY`, with no origin check. Only for an instance that is not behind the WaxBlock Cloudflare zone. |
| `BIND_ADDRESS` | no | all interfaces | Listen address. Bare-metal installs use `127.0.0.1` so that only the local reverse proxy can connect. Leave it unset in containers. |
| `HOST` | no | `127.0.0.1` | Public base URL of this API (informational). |
| `BLOCKCHAIN_DEFAULT` | **yes** | `http://127.0.0.1:8888` | Chain RPC (nodeos `chain_api_plugin`). Also used by `/health`. The old name `BLOCKCHAIN_DEAFULT` is still accepted. |
| `BLOCKCHAIN_STATE` | yes | as above | RPC used for table reads. |
| `BLOCKCHAIN_BLOCK` | yes | as above | RPC used for `get_block` (live feed). |
| `BLOCKCHAIN_TRANSACTION` | yes | as above | RPC used for transaction lookups. |
| `BLOCKCHAIN_HISTORY` | yes | as above | Hyperion v2 history API. |
| `LIGHT_API` | yes | `http://127.0.0.1:8100` | Light API (token holders, account balances). |
| `ATOMICASSETS` | yes | `http://127.0.0.1:8600` | AtomicAssets API. |
| `SIMPLEASSETS` | no | — | SimpleAssets API (optional, legacy). |
| `ASSETS_COUNT`, `ASSETS_COUNT_TIMESTAMP` | no | built-in | Seed values for the NFT counter before the first AtomicAssets poll. |
| `CACHE_DIR` | no | `cache` (relative to `apps/api`) | Parent directory of the warm cache. The API adds the network name (`<CACHE_DIR>/mainnet`). That directory must contain only cache files. |
| `HEALTH_MAX_HEAD_AGE_SECONDS` | no | `60` | `/health` fails when the RPC head block is older than this. |
| `APP_VERSION` | no | set by the image | Reported by `/health`. |

**Use your own nodes.** Infrastructure providers should point all endpoints at their own WAX nodes and
history services. The public endpoints in the example files are a fallback. Each API instance makes about one
RPC request per second per endpoint type while users are connected.

### Outbound access

Outbound internet access is also required to: `api.coingecko.com`, `wax.alcor.exchange`,
`raw.githubusercontent.com`, `www.alohaeos.com`, and every producer's `bp.json` host.

## Frontend (`apps/web`)

Build-time variables (Vite). Set them before `npm run build`. Examples: `apps/web/.env.*.example`.

| Variable | Meaning |
|---|---|
| `VITE_NETWORK_TYPE` | `mainnet`, `testnet` or `localnet` |
| `VITE_CHAIN_ID` | Chain ID of the network |
| `VITE_API_URL` | WaxBlock API base URL, for example `https://waxblock-api.waxblock.io` |
| `VITE_SOCKET_URL` | WaxBlock API base URL for the WebSocket (normally the same as `VITE_API_URL`) |
| `VITE_RPC_ENDPOINTS` | Comma-separated chain RPC endpoints the browser may use |
| `VITE_HISTORY_ENDPOINTS` | Comma-separated Hyperion endpoints |
| `VITE_LIGHTAPI_ENDPOINTS` | Comma-separated Light API endpoints |
| `VITE_ATOMIC_ENDPOINTS` | Comma-separated AtomicAssets endpoints |
| `VITE_SIMPLEASSETS` | SimpleAssets endpoint (optional) |
| `VITE_IPFS_ENDPOINTS` | Comma-separated IPFS gateways for NFT media |
| `VITE_CF_NETWORK_TYPE` | Network label used by the Cloudflare Pages build |
