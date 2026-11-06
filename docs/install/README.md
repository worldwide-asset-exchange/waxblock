# Installing the WaxBlock API

These guides are for infrastructure providers who run the WaxBlock API behind the WaxBlock Cloudflare load
balancer. The frontend is not part of the install; the WaxBlock maintainers deploy it to Cloudflare Pages.

## What you run

Two instances of the same application, one per network:

| Instance | `NETWORK_TYPE` | Example public hostname | Local port in these guides |
|---|---|---|---|
| Mainnet API | `mainnet` | `waxblock-api.<your-domain>` | 8080 |
| Testnet API | `testnet` | `waxblock-testnet-api.<your-domain>` | 8081 |

The application is a Node.js 22 process. It has no database, no message queue and no secrets. It keeps a
small cache (under 50 MiB) on disk and rebuilds it in about 3 minutes if it is lost.

## Choose your environment

| Environment | Guide | Runs the API as |
|---|---|---|
| Bare-metal server or VM, no containers | [bare-metal.md](bare-metal.md) | Node.js process under systemd, built from the release tag |
| Any Linux host with Docker (bare metal, VM, any cloud) | [docker.md](docker.md) | Container from the release image, Docker Compose |
| Kubernetes (any distribution, including EKS, GKE, AKS, k3s) | [kubernetes.md](kubernetes.md) | Container from the release image |
| AWS | [aws.md](aws.md) | EC2 (bare-metal or Docker guide), ECS Fargate behind an ALB, or EKS |

Every guide ends with the same TLS and access setup: [reverse-proxy.md](reverse-proxy.md). Problems:
[troubleshooting.md](troubleshooting.md).

## Requirements for every environment

| Requirement | Detail |
|---|---|
| CPU and memory | Per network: minimum 0.25 vCPU and 512 MiB; recommended 1 vCPU and 1 GiB. Measured use is about 0.08 vCPU and 200 MiB. |
| Disk | 1 GiB per network for the cache. |
| Architecture | `linux/amd64` or `linux/arm64`. |
| Inbound | HTTPS on port 443, from Cloudflare only. Port 80 only if you use HTTP-01 certificate validation. |
| Outbound | HTTPS to your WAX endpoints and to the hosts in [CONFIGURATION.md](../CONFIGURATION.md#outbound-access). |
| TLS | A publicly trusted certificate for each of your two hostnames (for example Let's Encrypt). |
| WebSocket | Upgrades on `/socket/`, idle timeout of at least 100 s (300 s recommended). |
| WAX endpoints | Your own nodes where you can: chain API, Hyperion v2, Light API, AtomicAssets. |

## Versions

- Run the release we announce. Every release has a tag (`vX.Y.Z`), release notes, and an image digest.
- Container installs pin the digest: `ghcr.io/worldwide-asset-exchange/waxblock-api:<tag>@sha256:<digest>`.
  Never use `latest`.
- Source installs check out the tag and compare the commit with the release notes.

## When you are done

Do the checks in [PROVIDERS.md](../PROVIDERS.md#checklist-for-a-provider) and send us the handover
information.
