# Install on bare metal or a VM (no containers)

This guide installs the API from the release tag as two systemd services, `waxblock-api@mainnet` and
`waxblock-api@testnet`, behind nginx. It works on a physical server and on any VM (including AWS EC2).
To run containers on the same server instead, use [docker.md](docker.md).

Tested on Ubuntu 24.04 LTS with nginx 1.24 and Node.js 22. Debian 12 works the same way. Run every command
as a user with `sudo`.

## 1. Packages

```sh
sudo apt-get update
sudo apt-get install -y git curl ca-certificates xz-utils jq nginx certbot
```

## 2. Node.js 22

Install the official Node.js binary and check its checksum. Use the version in the repository's `.nvmrc`
major line (22).

```sh
NODE_VERSION=v22.22.0
ARCH=$(uname -m | sed 's/x86_64/x64/; s/aarch64/arm64/')
cd /tmp
curl -fsSLO "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-${ARCH}.tar.xz"
curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt" \
  | grep " node-${NODE_VERSION}-linux-${ARCH}.tar.xz\$" | sha256sum -c -
sudo tar -xJf "node-${NODE_VERSION}-linux-${ARCH}.tar.xz" -C /usr/local --strip-components=1
node -v    # v22.x
```

The systemd unit runs `/usr/local/bin/node`. If you install Node.js another way, change `ExecStart` in the
unit.

## 3. Service user and directories

```sh
sudo useradd --system --no-create-home --shell /usr/sbin/nologin waxblock
sudo mkdir -p /opt/waxblock/releases /etc/waxblock
```

The code in `/opt/waxblock` belongs to root and is read-only for the service. The service writes only to
`/var/lib/waxblock` (systemd creates it).

## 4. Install the release

Replace `v1.3.1` with the version we announce. Compare the commit with the one in the release notes.

```sh
VERSION=v1.3.1
sudo git clone --depth 1 --branch "$VERSION" \
  https://github.com/worldwide-asset-exchange/waxblock.git "/opt/waxblock/releases/$VERSION"
sudo git -C "/opt/waxblock/releases/$VERSION" rev-parse HEAD   # must match the release notes
cd "/opt/waxblock/releases/$VERSION"
sudo npm ci --workspace=apps/api --omit=dev --ignore-scripts
sudo ln -sfn "/opt/waxblock/releases/$VERSION" /opt/waxblock/current
echo "APP_VERSION=$VERSION" | sudo tee /etc/waxblock/release.env
```

## 5. Configuration

Start from the example files. The two instances share the server, so testnet listens on 8081.

```sh
sudo install -m 0600 -o root -g root /opt/waxblock/current/deploy/env/mainnet.env /etc/waxblock/mainnet.env
sudo install -m 0600 -o root -g root /opt/waxblock/current/deploy/env/testnet.env /etc/waxblock/testnet.env
sudo sed -i 's/^PORT=.*/PORT=8081/' /etc/waxblock/testnet.env
sudoedit /etc/waxblock/mainnet.env /etc/waxblock/testnet.env
```

In both files:

- Point the endpoints at your own WAX nodes where you can ([CONFIGURATION.md](../CONFIGURATION.md)).
- Add the origin key we send you: `ORIGIN_AUTH_KEY=<value>` ([reverse-proxy.md](reverse-proxy.md#the-origin-key)).

The files are readable by root only; systemd reads them before it starts the service.

Do not set `CACHE_DIR` or `BIND_ADDRESS` in these files. The unit sets the cache to `/var/lib/waxblock`
(the API adds the network name: `/var/lib/waxblock/mainnet`, `/var/lib/waxblock/testnet`) and makes the API
listen on `127.0.0.1` only.

## 6. Start the services

```sh
sudo cp /opt/waxblock/current/deploy/systemd/waxblock-api@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now waxblock-api@mainnet waxblock-api@testnet
```

Check them. The API opens its port a few seconds after the start; until then `curl` prints nothing (exit
code 7). `/api/v1/health` then returns `503` for about 3 minutes after the first start, then `200`.

```sh
systemctl status waxblock-api@mainnet waxblock-api@testnet --no-pager
curl -s http://127.0.0.1:8080/api/v1/health    # "status":"ok","network":"mainnet"
curl -s http://127.0.0.1:8081/api/v1/health    # "status":"ok","network":"testnet"
journalctl -u waxblock-api@mainnet -f          # logs
```

The services listen on `127.0.0.1` only (`ss -ltn | grep -E ':808[01]'`). nginx is the only public entry.

## 7. nginx, TLS and access

Continue with [reverse-proxy.md](reverse-proxy.md). It sets up the certificates, allows only Cloudflare,
and checks the setup with the origin key.

## 8. Firewall (recommended)

nginx already refuses everything that does not come from Cloudflare. Closing port 443 at the host or
network firewall as well means that other clients cannot even open a TLS connection. With `ufw`:

```sh
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp                       # only for Let's Encrypt HTTP-01 renewals
for net in $(curl -fsS https://api.cloudflare.com/client/v4/ips | jq -r '.result.ipv4_cidrs[], .result.ipv6_cidrs[]'); do
  sudo ufw allow proto tcp from "$net" to any port 443
done
sudo ufw enable
```

Re-run the loop when Cloudflare changes its list. This is rare; the daily nginx script from step 7 prints
`updated ... Cloudflare ranges` (mailed to root by cron) when it happens.

## Upgrade

Install the new release next to the old one, switch the link, and restart one network at a time.

```sh
VERSION=v1.3.2
sudo git clone --depth 1 --branch "$VERSION" \
  https://github.com/worldwide-asset-exchange/waxblock.git "/opt/waxblock/releases/$VERSION"
(cd "/opt/waxblock/releases/$VERSION" && sudo npm ci --workspace=apps/api --omit=dev --ignore-scripts)
sudo ln -sfn "/opt/waxblock/releases/$VERSION" /opt/waxblock/current
echo "APP_VERSION=$VERSION" | sudo tee /etc/waxblock/release.env
sudo cp /opt/waxblock/current/deploy/systemd/waxblock-api@.service /etc/systemd/system/ && sudo systemctl daemon-reload
sudo systemctl restart waxblock-api@testnet && sleep 60 && curl -s http://127.0.0.1:8081/api/v1/health
sudo systemctl restart waxblock-api@mainnet && sleep 60 && curl -s http://127.0.0.1:8080/api/v1/health
```

The cache survives the restart, so `/api/v1/health` is normally back to `200` within a minute. To go back,
point the link at the previous release and restart. Delete old release directories when you no longer
need them.
