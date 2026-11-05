# API reference

Base URLs: `https://waxblock-api.waxblock.io` (mainnet), `https://testnet-api.waxblock.io` (testnet).
All responses are JSON. All routes are `GET`, read-only and unauthenticated. CORS allows every origin.

## REST routes (`/api/v1`)

| Route | Returns | Source / refresh |
|---|---|---|
| `/health` | Health for load balancers: `200` or `503` with details (below) | live RPC check, cached 10 s |
| `/test` | `{"status":"ok"}` — process liveness only, says nothing about data | — |
| `/producers` | Block producers with rank, votes, bp.json metadata and schedule flags | cache, every 45 min |
| `/proxies` | Voting proxies | cache, every 30 min |
| `/tokens` | Token list with market data | cache, every 30 min |
| `/tokens/stats` | WAX price, market cap and combined token market cap (USD) | cache |
| `/tokens/:key` | One token. `key` = `<symbol>-<chain>-<contract>`, for example `TLM-wax-alien.worlds` | cache |
| `/tokens/topHolders/:key` | Top holders of a token | live RPC/Light API |
| `/tokens/holdersCount/:key` | Number of holders of a token | live RPC/Light API |
| `/cache` | The complete in-memory cache (debugging) | cache |

### `/health`

```json
{
  "status": "ok",
  "network": "mainnet",
  "version": "v1.3.0",
  "chain": { "ok": true, "head_block_num": 464777476, "head_block_age_seconds": 0, "latency_ms": 153 },
  "caches": { "producers": true, "tokens": true }
}
```

- `200` when the configured RPC (`BLOCKCHAIN_DEFAULT`) answers `get_info` in less than 5 s, its head block is
  at most `HEALTH_MAX_HEAD_AGE_SECONDS` (default 60) old, **and** the producer and token caches are populated.
- `503` otherwise, with `status: "unavailable"` and the failing part in `chain` or `caches`.
- After a cold start (empty cache), `/health` returns `503` for about 2–3 minutes until the token list is built.
  This is correct: the instance cannot serve complete data yet.

## WebSocket (`/socket/`)

socket.io v4, path `/socket`, transport `websocket`.

| Direction | Event | Payload |
|---|---|---|
| server → client, on connect | `statistics` | network statistics and WAX market data |
| server → client | `statistics` | updated statistics (several jobs) |
| server → client | `chainInfo` | RPC `get_info` result, every second |
| server → client | `topDapps`, `topPerSecondDapps` | most active contracts |
| server → client | `txsPerSecond` | transactions per second |
| server → client (room) | `transactions` | live transactions, to clients in room `transactions` |
| client → server | `join` / `leave` | room name, for example `transactions` |

The live block jobs run only while at least one client is connected, so an idle instance puts almost no load on the RPC.
