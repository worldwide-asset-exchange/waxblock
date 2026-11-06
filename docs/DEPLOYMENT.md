# Deploying and operating the WaxBlock API

This page is for infrastructure providers who run the WaxBlock API behind the WaxBlock Cloudflare load
balancer. The WaxBlock maintainers deploy the frontend to Cloudflare Pages; providers run only the API.

## Install

Pick the guide for your environment in [install/README.md](install/README.md):

| Environment | Guide |
|---|---|
| Bare-metal server or VM, no containers (systemd) | [install/bare-metal.md](install/bare-metal.md) |
| Any Linux host with Docker | [install/docker.md](install/docker.md) |
| Kubernetes | [install/kubernetes.md](install/kubernetes.md) |
| AWS: EC2, ECS Fargate, EKS | [install/aws.md](install/aws.md) |
| TLS, Cloudflare-only access, Authenticated Origin Pulls (all environments) | [install/reverse-proxy.md](install/reverse-proxy.md) |
| Problems | [install/troubleshooting.md](install/troubleshooting.md) |

## Health

| Endpoint | Use it for | Meaning |
|---|---|---|
| `/api/v1/test` | liveness | The process answers HTTP. |
| `/api/v1/health` | readiness, load-balancer monitor | `200` = RPC reachable, head block ≤ 60 s old, caches populated. `503` otherwise. Details in [API.md](API.md#health). |

After a cold start `/api/v1/health` returns `503` for about 3 minutes while the caches fill. The container
image's `HEALTHCHECK` allows 5 minutes for this. Keep the cache on persistent storage to make restarts
warm. Do not use `/api/v1/health` as a liveness check: a chain RPC outage would then restart the process
in a loop instead of letting the load balancer route around it.

## Releases and upgrades

1. We announce a new version: a GitHub release with the tag, the image digest and the commit, plus a
   message to every provider.
2. Upgrade as your guide describes. Each guide upgrades testnet first, then mainnet.
3. The upgrade is done when `/api/v1/health` returns `200` and reports the new `version`.
4. Providers upgrade one at a time, when we ask, so that at least two providers stay healthy.

The API stops cleanly on `SIGTERM` within a second, so a restart costs only the time to start again (about
a minute with a warm cache).

## Logs and monitoring

- Logs go to stdout in plain text: one line per request, plus messages from the polling jobs. systemd
  installs: `journalctl -u waxblock-api@mainnet`. Docker: `docker compose logs`. Kubernetes:
  `kubectl logs`.
- Minimum monitoring: alert when `/api/v1/health` is not `200` for 5 minutes, checked from the host or
  cluster (your public endpoint accepts only Cloudflare).
- Our Cloudflare monitor checks every provider every 60 seconds. We contact you if your origin is marked
  unhealthy.
