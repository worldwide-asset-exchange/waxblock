# Infrastructure providers

WaxBlock's API is served by several independent infrastructure providers. Cloudflare Load Balancing sends
each request for `waxblock-api.waxblock.io` and `testnet-api.waxblock.io` to a healthy provider.

## Providers

| Provider | Mainnet API origin | Testnet API origin | Status |
|---|---|---|---|
| EOS USA | — | — | onboarding |
| EOSphere | — | — | onboarding |
| EOS Sweden | — | — | onboarding |

The maintainers update this table when a provider's origins pass the checks below and are added to the load
balancer.

## How the load balancer uses your origin

| Setting | Value |
|---|---|
| Pools | `waxblock-api-mainnet` and `waxblock-api-testnet`, one origin per provider in each |
| Origin address | your hostname, for example `waxblock-api.<your-domain>` |
| Host header / SNI sent to you | your hostname (not `waxblock-api.waxblock.io`) |
| Health monitor | `GET https://<your-hostname>/api/v1/health`, expect `200`, every 60 s, timeout 10 s, 2 retries, from several regions |
| Origin key | Every request for the WaxBlock API hostnames carries `X-WaxBlock-Origin-Auth` (Cloudflare Transform Rule). We send you the value privately; you set it as `ORIGIN_AUTH_KEY` |
| Steering | dynamic (lowest latency among healthy origins); an unhealthy origin gets no traffic |
| Session affinity | cookie, 1 h (safety net; the frontend uses WebSocket only) |
| Traffic you can expect | measured before the migration: ~45,000 API requests/day on mainnet, ~10,000 on testnet, split across providers |

## Checklist for a provider

1. Install the mainnet and testnet API with the guide for your environment
   ([install/README.md](install/README.md): bare metal, Docker, Kubernetes, AWS), at the release we give you.
2. Point the endpoints at your own WAX infrastructure where you can ([CONFIGURATION.md](CONFIGURATION.md)).
3. Set up TLS, Cloudflare-only access and the origin key
   ([install/reverse-proxy.md](install/reverse-proxy.md), or the Kubernetes and AWS equivalents).
4. Check on your host or cluster:

   ```sh
   curl -s http://127.0.0.1:8080/api/v1/health    # 200, "network":"mainnet" (Kubernetes: through port-forward)
   curl -s http://127.0.0.1:8081/api/v1/health    # 200, "network":"testnet"
   curl -s http://127.0.0.1:8080/api/v1/tokens/stats   # a WAX price
   ```

   From the internet your hostnames answer `403`: only Cloudflare can reach them. That is correct.
5. Send us the **handover information** below. We add your origins to the load balancer and confirm that
   the Cloudflare monitor sees them healthy.

## Handover information (send to the WaxBlock maintainers)

```text
Provider name:
Mainnet API hostname:               https://
Testnet API hostname:               https://
Image version deployed:             v
Region / data centre:
WAX endpoints used (own / public):
Origin IP ranges (for our records):
GitHub usernames (for the provider team):
Technical contact (name, email, Telegram):
Escalation contact (24/7, if any):
Planned maintenance window:
```

## GitHub access

Each provider has a team in the `worldwide-asset-exchange` organization with **write** access to this
repository. Everyone else has read access.

- You can push branches and open pull requests in this repository. You do not need a fork.
- `main` is protected. Every change needs a pull request, passing checks and an approval from a WaxBlock
  maintainer (`.github/CODEOWNERS`).
- Only maintainers can create `v*` tags. A tag is a release: it deploys the frontend and publishes the API
  image. Providers cannot create releases.
- Deployment credentials are environment secrets that only `main` and `v*` tags can read. A workflow on your
  branch has no access to them.
- Ask the maintainers for a release when your change is merged.

## Operating rules

- Run the version we announce, pinned by the image digest in its release notes. Upgrade when asked, one
  provider at a time.
- Tell us before planned maintenance. Cloudflare drains traffic automatically when your health check fails,
  but planned work should not overlap with another provider's.
- Run only released images. Change the code through pull requests to this repository, never by patching
  your deployment. Report problems as GitHub issues or to the maintainers.
- Keep your origin reachable only through Cloudflare.
- Security issues: see [SECURITY.md](../SECURITY.md).
