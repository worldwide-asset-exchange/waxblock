# TLS, Cloudflare-only access and the origin key

Every install needs the same three controls in front of the API:

| Control | Where | Why |
|---|---|---|
| **TLS** with a public certificate for each of your hostnames | Your reverse proxy or load balancer | Cloudflare connects to your hostname with SNI and validates the certificate (Full strict). |
| **Only Cloudflare IP addresses** may connect | Your reverse proxy, firewall or security group | Users reach the API through `waxblock-api.waxblock.io`. A request that comes to your server directly has bypassed our bot protection and rate limits. |
| **Origin key** | The API (`ORIGIN_AUTH_KEY`) | Cloudflare adds the header `X-WaxBlock-Origin-Auth` to every request for the WaxBlock API hostnames. The API refuses `/api/` and `/socket/` without the right value. This stops a request that comes through someone else's Cloudflare account, which the IP list alone cannot stop. |

`/api/v1/health` and `/api/v1/test` work without the origin key, so monitors and orchestrators can always
reach them. They return no user data.

This page shows the setup with nginx on a bare-metal, VM or Docker host. For Kubernetes see
[kubernetes.md](kubernetes.md#5-ingress-tls-and-access); for AWS load balancers see [aws.md](aws.md).

## The origin key

We send the origin key to each provider privately (not in GitHub, not in chat). Treat it as a secret:

- Bare metal: in `/etc/waxblock/mainnet.env` and `testnet.env`, owned by root, mode `0600`.
- Docker: in `env/mainnet.env` and `env/testnet.env`, mode `0600`.
- Kubernetes: in the Secret `waxblock-origin-auth`. ECS: in AWS Secrets Manager.

```sh
ORIGIN_AUTH_KEY=<the value we send you>
```

Without it the API accepts every request; the startup log shows `Origin authentication: off`. When we
rotate the key, we send the new value and give a date; update both instances and restart them.

## What the shipped nginx configuration does

Files in [`deploy/nginx/`](../../deploy/nginx/). Tested with nginx 1.24.

| Request | Result |
|---|---|
| From an address outside Cloudflare's ranges (and not from the host itself) | `403` |
| `/api/...` and `/socket/...` from Cloudflare | Passed to the API with `Host`, `X-Forwarded-For` (the user's address from `CF-Connecting-IP`) and `X-Forwarded-Proto` |
| WebSocket upgrade on `/socket/` | `101`, idle timeout 300 s |
| Any other path | `404` |
| Port 80 | Let's Encrypt challenges; everything else redirects to HTTPS |

## 1. Certificates

Get a certificate for each hostname first. This uses Let's Encrypt with an HTTP-01 challenge: both
hostnames must point at this server and port 80 must be reachable. A temporary site answers the challenge.

```sh
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/www/html
sudo tee /etc/nginx/conf.d/acme-temporary.conf >/dev/null <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    location /.well-known/acme-challenge/ { root /var/www/html; }
}
NGINX
sudo nginx -t && sudo systemctl reload nginx
sudo certbot certonly --webroot -w /var/www/html -d waxblock-api.<your-domain> \
  --deploy-hook "systemctl reload nginx"
sudo certbot certonly --webroot -w /var/www/html -d waxblock-testnet-api.<your-domain> \
  --deploy-hook "systemctl reload nginx"
sudo rm /etc/nginx/conf.d/acme-temporary.conf
```

`certbot` installs a renewal timer; the deploy hook reloads nginx after each renewal. A DNS-01 challenge or
another CA works too; only the certificate paths in step 2 change.

## 2. Install the configuration

From a source checkout (bare-metal install):

```sh
sudo mkdir -p /etc/nginx/waxblock
cd /opt/waxblock/current/deploy/nginx
sudo cp origin-common.conf locations.conf /etc/nginx/waxblock/
sudo cp waxblock-api.conf /etc/nginx/conf.d/waxblock-api.conf
sudo install -m 0755 update-cloudflare-ips.sh /usr/local/sbin/waxblock-update-cloudflare-ips
```

Without a source checkout (Docker install), download the same files from the release tag:

```sh
VERSION=v1.3.1
BASE="https://raw.githubusercontent.com/worldwide-asset-exchange/waxblock/${VERSION}/deploy/nginx"
sudo mkdir -p /etc/nginx/waxblock
sudo curl -fsS -o /etc/nginx/waxblock/origin-common.conf "$BASE/origin-common.conf"
sudo curl -fsS -o /etc/nginx/waxblock/locations.conf     "$BASE/locations.conf"
sudo curl -fsS -o /etc/nginx/conf.d/waxblock-api.conf    "$BASE/waxblock-api.conf"
sudo curl -fsS -o /usr/local/sbin/waxblock-update-cloudflare-ips "$BASE/update-cloudflare-ips.sh"
sudo chmod 0755 /usr/local/sbin/waxblock-update-cloudflare-ips
```

Edit `/etc/nginx/conf.d/waxblock-api.conf`: replace `waxblock-api.example.org` and
`waxblock-testnet-api.example.org` with your two hostnames (in `server_name` and in the certificate paths).

## 3. Cloudflare IP ranges and start

The script writes the list of Cloudflare ranges, checks the configuration with `nginx -t` and reloads
nginx:

```sh
sudo /usr/local/sbin/waxblock-update-cloudflare-ips
echo 'MAILTO=root
0 4 * * * root /usr/local/sbin/waxblock-update-cloudflare-ips' | sudo tee /etc/cron.d/waxblock-cloudflare-ips
```

The daily run changes nothing unless Cloudflare changes its list. If the download fails, or the new list
does not pass `nginx -t`, the script keeps the previous list, exits with an error and prints the reason
(cron mails it to root).

## 4. Check

On the server (the host itself is allowed for local checks):

```sh
D=waxblock-api.<your-domain>
curl -s --resolve "$D:443:127.0.0.1" "https://$D/api/v1/health"     # "status":"ok"
curl -s -o /dev/null -w '%{http_code}\n' --resolve "$D:443:127.0.0.1" "https://$D/api/v1/producers"
# 403: no origin key, as expected
curl -s -o /dev/null -w '%{http_code}\n' --resolve "$D:443:127.0.0.1" \
  -H "X-WaxBlock-Origin-Auth: $(sudo sed -n 's/^ORIGIN_AUTH_KEY=//p' /etc/waxblock/mainnet.env)" \
  "https://$D/api/v1/producers"                                      # 200
```

(On a Docker install read the key from `/opt/waxblock/env/mainnet.env`.)

From any other machine, every request returns `403`. That is correct: only Cloudflare can reach the API.
We confirm the path through Cloudflare from our side when we add your origin to the load balancer.
