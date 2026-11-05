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
| Steering | dynamic (lowest latency among healthy origins); an unhealthy origin gets no traffic |
| Session affinity | cookie, 1 h (safety net; the frontend uses WebSocket only) |
| Traffic you can expect | measured before the migration: ~45,000 API requests/day on mainnet, ~10,000 on testnet, split across providers |

## Checklist for a provider

1. Deploy the mainnet and testnet API as described in [DEPLOYMENT.md](DEPLOYMENT.md), at the release tag we
   give you.
2. Point the endpoints at your own WAX infrastructure where you can ([CONFIGURATION.md](CONFIGURATION.md)).
3. Serve both on HTTPS with a public certificate for your own hostnames, with WebSocket on `/socket/`.
4. Restrict HTTPS to Cloudflare IP ranges, and enable Authenticated Origin Pulls with the certificate we send.
5. Check from outside:

   ```sh
   curl -s https://waxblock-api.<your-domain>/api/v1/health          # expect 200 and "network":"mainnet"
   curl -s https://waxblock-testnet-api.<your-domain>/api/v1/health  # expect 200 and "network":"testnet"
   curl -s https://waxblock-api.<your-domain>/api/v1/tokens/stats    # expect a WAX price
   ```

6. Send us the **handover information** below.

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
