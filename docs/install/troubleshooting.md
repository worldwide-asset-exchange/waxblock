# Troubleshooting

Start with the health endpoint on the instance itself. It tells you which part fails.

```sh
curl -s http://127.0.0.1:8080/api/v1/health | jq
```

```json
{ "status": "unavailable", "network": "mainnet", "version": "v1.3.1",
  "chain": { "ok": false, "error": "get_info timeout" },
  "caches": { "producers": true, "tokens": true } }
```

## `/api/v1/health` returns 503

| Field | Meaning | Action |
|---|---|---|
| `chain.error: "get_info timeout"` or `"get_info unreachable"` | `BLOCKCHAIN_DEFAULT` does not answer within 5 s. | Check the endpoint from the host: `curl -s <BLOCKCHAIN_DEFAULT value>/v1/chain/get_info`. Check outbound firewall rules and DNS. |
| `chain.error: "get_info HTTP 4xx/5xx"` | The endpoint answers with an error. | Check the URL (no trailing path) and the node. |
| `chain.ok: false` with `head_block_age_seconds` above 60 | Your node is behind the chain. | Fix the node, or point `BLOCKCHAIN_DEFAULT` at a node in sync. Only raise `HEALTH_MAX_HEAD_AGE_SECONDS` if you understand that users then see old data. |
| `caches.producers: false` | The producer list has not loaded yet. | Normal for about 3 minutes after the first start. If it stays false, read the logs for errors from the producer job (it reads the chain and each producer's `bp.json`). |
| `caches.tokens: false` (mainnet) | The token list has not loaded yet. | Normal for about 3 minutes after the first start. If it stays false, check outbound access to `wax.alcor.exchange` and `raw.githubusercontent.com`. |
| `caches.tokens: "not used"` | Testnet does not build a token list. | Nothing to do. |

## The process does not start

| Symptom | Cause | Action |
|---|---|---|
| `EACCES` on the cache directory | The process (uid 1000 in the image, `waxblock` on bare metal) cannot write the cache. | Docker: use the named volume from the Compose file. Kubernetes: keep `fsGroup: 1000`. Bare metal: do not set `CACHE_DIR` yourself; the unit uses `/var/lib/waxblock`. |
| `EISDIR: illegal operation on a directory` | The cache directory contains a sub-directory. The cache library reads every entry as a file. | Stop the process, empty `<CACHE_DIR>/<network>/`, start again. Point `CACHE_DIR` at the parent directory only; the API adds the network name. |
| Pod `CreateContainerConfigError: container has runAsNonRoot and image has non-numeric user` | Old image. | Use v1.3.0 or later. |
| Exits at once: `ORIGIN_AUTH_KEY is not set` | Production mode requires the origin key. | Add `ORIGIN_AUTH_KEY` to the instance's environment ([reverse-proxy.md](reverse-proxy.md#the-origin-key)). |
| Exits at once: `ORIGIN_AUTH_KEY must be at least 32 printable ASCII characters` | The value is truncated, quoted, has spaces, or ends with a newline. A newline comes in when you create the Kubernetes Secret with `--from-file` or write the key with `echo` into a file. | Copy the value again exactly as we sent it, without quotes. In Kubernetes, use `--from-literal` as in [kubernetes.md](kubernetes.md#3-apply). |
| `EADDRINUSE` | Mainnet and testnet use the same port on one host. | Bare metal: testnet uses `PORT=8081` ([bare-metal.md](bare-metal.md#5-configuration)). |

## Requests through Cloudflare fail

| Symptom on your side | Cause | Action |
|---|---|---|
| nginx access log shows `403` for Cloudflare addresses | The Cloudflare IP list is missing or old. | Run `sudo /usr/local/sbin/waxblock-update-cloudflare-ips`. Check `/etc/nginx/waxblock/cloudflare-geo.conf` is not empty. |
| Every request shows the same internal address (Kubernetes) | The ingress controller does not see the peer address. | Set `externalTrafficPolicy: Local` or enable PROXY protocol ([kubernetes.md](kubernetes.md#5-ingress-tls-and-access)). |
| The API answers `403` to `/api/` requests from Cloudflare | The origin key is wrong or missing on one side. | Compare `ORIGIN_AUTH_KEY` in both instances with the value we sent (no quotes, no spaces). Restart after a change. Tell us if it matches. |

| The site works, but the live block feed does not update | The WebSocket on `/socket/` is closed by a proxy. | Check that your proxy passes `Upgrade`/`Connection` and has an idle timeout of at least 100 s (ALB: `idle_timeout.timeout_seconds`). |

## Stopping and restarting

The API exits within a second of `SIGTERM` (at most 10 s with stuck connections). If a stop takes longer,
you run a version older than v1.3.1.

## Ask us

Open an issue on GitHub, or contact the maintainers. Include the output of `/api/v1/health`, the version,
and the relevant log lines. Report security problems privately
([SECURITY.md](../../SECURITY.md)).
