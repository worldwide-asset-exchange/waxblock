# Deploying the WaxBlock API

This guide is for infrastructure providers who run the WaxBlock API behind the WaxBlock Cloudflare load
balancer. The frontend is not part of it; the WaxBlock maintainers deploy the frontend to Cloudflare Pages.

## What you run

Two containers from the same image, one per network:

| Service | `NETWORK_TYPE` | Public hostname you give us (example) |
|---|---|---|
| Mainnet API | `mainnet` | `waxblock-api.<your-domain>` |
| Testnet API | `testnet` | `waxblock-testnet-api.<your-domain>` |

Image: `ghcr.io/worldwide-asset-exchange/waxblock-api:<version>` (public, `linux/amd64` and `linux/arm64`). Use an exact
release tag, for example `v1.3.0`, and pin the digest that the release notes give
(`ghcr.io/worldwide-asset-exchange/waxblock-api:v1.3.0@sha256:…`). Never use `latest`. Release notes are on
the GitHub releases page.

## Sizing (per network)

| | Minimum | Recommended | Measured in production |
|---|---|---|---|
| CPU | 0.25 vCPU | 1 vCPU | ~0.08 vCPU average |
| Memory | 512 MiB | 1 GiB | ~200 MiB peak |
| Disk | 1 GiB | 1 GiB | cache < 50 MiB |
| Replicas | 1 | 1 | 1 |

One replica per network is enough. If you run more than one replica behind your own balancer, that balancer
must support WebSocket and keep each WebSocket on one replica (connections are long-lived; no other state is
shared).

## Requirements

1. **TLS.** Serve HTTPS on port 443 with a publicly trusted certificate for **your own hostname**
   (for example `waxblock-api.<your-domain>`). Cloudflare connects to your hostname with SNI and the
   `Host` header set to that hostname, and validates the certificate (Full strict).
2. **WebSocket.** Your proxy must pass WebSocket upgrades on path `/socket/` (HTTP/1.1 `Upgrade`, idle
   timeout of at least 100 s).
3. **Paths.** Forward `/api/` and `/socket/` to the container. Nothing else is needed.
4. **Health.** `GET https://<your-hostname>/api/v1/health` must reach the container. Cloudflare's monitor
   probes it every 60 s from several regions (see [Health](#health)).
5. **Source restriction (recommended).** Accept HTTPS only from Cloudflare IP ranges
   (<https://www.cloudflare.com/ips/>). We will also ask you to enable
   [Authenticated Origin Pulls](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/)
   with the certificate we send you, so that only our Cloudflare zone can reach the origin.
6. **Outbound access** to your WAX nodes and to the third-party hosts listed in
   [CONFIGURATION.md](CONFIGURATION.md).
7. **Your own WAX nodes (recommended).** Point `BLOCKCHAIN_*`, `LIGHT_API` and `ATOMICASSETS` at your own
   infrastructure. See [CONFIGURATION.md](CONFIGURATION.md).

## Install with Docker Compose

```sh
git clone https://github.com/worldwide-asset-exchange/waxblock.git
cd waxblock/deploy
# edit env/mainnet.env and env/testnet.env: point the endpoints at your nodes
WAXBLOCK_VERSION=v1.3.0 docker compose up -d
curl -s http://127.0.0.1:8080/api/v1/health   # mainnet: 503 for ~3 min after a cold start, then 200
curl -s http://127.0.0.1:8081/api/v1/health   # testnet
```

The compose file binds to `127.0.0.1`. Put your TLS reverse proxy in front. Example for nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name waxblock-api.example.org;
    ssl_certificate     /etc/ssl/waxblock-api.crt;
    ssl_certificate_key /etc/ssl/waxblock-api.key;

    location /socket/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 300s;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Install on Kubernetes

[`deploy/kubernetes/waxblock-api.yaml`](../deploy/kubernetes/waxblock-api.yaml) is a complete example for one
network (ConfigMap, Deployment, Service). Copy it for testnet and change the names, `NETWORK_TYPE` and the
endpoints. Expose the Service with your Ingress controller (TLS + WebSocket).

The example uses `/api/v1/test` for liveness (the process is alive) and `/api/v1/health` for readiness (data
is complete). Do **not** use `/api/v1/health` for liveness: a chain RPC outage would then restart the pod in a
loop instead of letting the load balancer route around it.

## Health

| Endpoint | Use it for | Meaning |
|---|---|---|
| `/api/v1/test` | liveness | The process answers HTTP. |
| `/api/v1/health` | readiness, load-balancer monitor | `200` = RPC reachable, head block ≤ 60 s old, caches populated. `503` otherwise. |

After a cold start `/api/v1/health` returns `503` for about 2–3 minutes while the caches fill. The container's
built-in `HEALTHCHECK` allows 5 minutes for this. Keep the persisted cache volume to make restarts warm.

## Upgrades

1. We announce a new version (GitHub release + message to providers).
2. Change the image tag and redeploy. With Compose: `WAXBLOCK_VERSION=<new> docker compose up -d`.
3. Wait for `/api/v1/health` to return `200` before you consider the upgrade done.
4. Providers upgrade one at a time when we ask for it, so at least two providers stay healthy.

## Logs and monitoring

- Logs go to stdout in plain text (one line per request, plus job messages).
- Minimum monitoring: alert when `/api/v1/health` is not `200` for 5 minutes.
- Cloudflare's monitor also watches every provider. We contact you if your origin is marked unhealthy.
