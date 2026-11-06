# Install with Docker (bare metal, VM or any cloud)

This guide runs the release image with Docker Compose on one Linux host: mainnet on `127.0.0.1:8080`,
testnet on `127.0.0.1:8081`. nginx on the host terminates TLS. It works on a physical server, a VM and any
cloud instance.

## 1. Docker

Install Docker Engine and the Compose plugin from Docker's repository
(<https://docs.docker.com/engine/install/>). Check:

```sh
docker version --format '{{.Server.Version}}'
docker compose version
```

## 2. Files

```sh
VERSION=v1.3.1
sudo mkdir -p /opt/waxblock && cd /opt/waxblock
for f in docker-compose.yml env/mainnet.env env/testnet.env; do
  sudo curl -fsS --create-dirs -o "$f" \
    "https://raw.githubusercontent.com/worldwide-asset-exchange/waxblock/${VERSION}/deploy/${f}"
done
```

Edit `env/mainnet.env` and `env/testnet.env`: point the endpoints at your own WAX nodes where you can
([CONFIGURATION.md](../CONFIGURATION.md)). Keep `PORT=8080` in both; Compose maps testnet to 8081 on the
host.

## 3. Pin the image

Take the tag and digest from the release notes and write them to `.env` next to the Compose file:

```sh
echo 'WAXBLOCK_VERSION=v1.3.1@sha256:<digest from the release notes>' | sudo tee /opt/waxblock/.env
```

Compose reads `.env` automatically. With the digest, Docker refuses an image that does not match.

## 4. Start

```sh
cd /opt/waxblock
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps       # both services "healthy" after about 3 minutes
curl -s http://127.0.0.1:8080/api/v1/health    # "status":"ok","network":"mainnet"
curl -s http://127.0.0.1:8081/api/v1/health    # "status":"ok","network":"testnet"
sudo docker compose logs -f
```

The containers run as uid 1000, restart automatically, keep their cache in the named volumes
`mainnet-cache` and `testnet-cache`, and use Docker's health check on `/api/v1/health`. The ports are bound
to `127.0.0.1` only.

## 5. nginx, TLS and access

Install nginx on the host and follow [reverse-proxy.md](reverse-proxy.md). The nginx configuration already
points at `127.0.0.1:8080` and `127.0.0.1:8081`.

If you already run a reverse proxy in a container (Traefik, Caddy, nginx), connect it to the Compose
network instead, and keep the same rules: TLS, only Cloudflare, AOP client certificate, WebSocket on
`/socket/` with a 300 s timeout, `/api/v1/health` reachable without the client certificate.

## Upgrade

```sh
cd /opt/waxblock
echo 'WAXBLOCK_VERSION=v1.3.2@sha256:<new digest>' | sudo tee .env
sudo docker compose pull
sudo docker compose up -d waxblock-api-testnet && sleep 60 && curl -s http://127.0.0.1:8081/api/v1/health
sudo docker compose up -d waxblock-api-mainnet && sleep 60 && curl -s http://127.0.0.1:8080/api/v1/health
```

The volumes keep the cache, so `/api/v1/health` is normally back to `200` within a minute. To go back, put
the previous tag and digest in `.env` and run `docker compose up -d` again.
