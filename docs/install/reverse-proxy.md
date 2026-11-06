# TLS, Cloudflare-only access and Authenticated Origin Pulls

Every install needs the same three controls in front of the API:

| Control | Why |
|---|---|
| **TLS** with a public certificate for each of your hostnames | Cloudflare connects to your hostname with SNI and validates the certificate (Full strict). |
| **Only Cloudflare may connect** | Users reach the API through `waxblock-api.waxblock.io`. A request that comes to your server directly has bypassed our bot protection and rate limits. |
| **Authenticated Origin Pulls (AOP)** | Cloudflare presents a client certificate on each request. Your server checks it. |

This page shows the setup with nginx on a bare-metal, VM or Docker host. For Kubernetes see
[kubernetes.md](kubernetes.md#5-ingress-tls-and-access); for an AWS load balancer see [aws.md](aws.md).

## What the shipped nginx configuration does

Files in [`deploy/nginx/`](../../deploy/nginx/):

| Request | Result |
|---|---|
| From an address outside Cloudflare's ranges (and not from the host itself) | `403` |
| `GET /api/v1/health`, without a client certificate | Passed to the API (so monitors always work) |
| `/api/...` or `/socket/...` without a valid client certificate | `403` |
| Client certificate from another CA | `400` |
| `/api/...` with a valid client certificate | Passed to the API |
| WebSocket upgrade on `/socket/` with a valid client certificate | `101`, idle timeout 300 s |
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

```sh
sudo mkdir -p /etc/nginx/waxblock
cd /opt/waxblock/current/deploy/nginx
sudo cp origin-common.conf locations.conf /etc/nginx/waxblock/
sudo cp waxblock-api.conf /etc/nginx/conf.d/waxblock-api.conf
sudo cp update-cloudflare-ips.sh /usr/local/sbin/waxblock-update-cloudflare-ips
```

With Docker and no source checkout, download the same four files from the release tag:
`https://raw.githubusercontent.com/worldwide-asset-exchange/waxblock/<tag>/deploy/nginx/<file>`.

Edit `/etc/nginx/conf.d/waxblock-api.conf`: replace `waxblock-api.example.org` and
`waxblock-testnet-api.example.org` with your two hostnames (in `server_name` and in the certificate paths).

## 3. AOP certificate

Download Cloudflare's origin-pull CA and check its fingerprint:

```sh
sudo curl -fsS -o /etc/nginx/waxblock/origin-pull-ca.pem \
  https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem
openssl x509 -in /etc/nginx/waxblock/origin-pull-ca.pem -noout -fingerprint -sha256 -enddate
# sha256 Fingerprint=9A:1A:C2:B4:BE:15:F9:F2:7E:EE:20:A7:34:CB:A4:E9:89:8F:61:00:1B:3B:D7:C8:4B:69:B5:6A:3E:25:A2:B9
# notAfter=Nov  1 17:00:00 2029 GMT
```

This CA is shared by every Cloudflare customer. Together with the IP restriction it proves that a request
came through Cloudflare. When we issue a WaxBlock-specific certificate, we send it to you and you replace
this file; nothing else changes.

## 4. Cloudflare IP ranges and start

The script writes the list of Cloudflare ranges, checks the configuration and reloads nginx:

```sh
sudo /usr/local/sbin/waxblock-update-cloudflare-ips
echo '0 4 * * * root /usr/local/sbin/waxblock-update-cloudflare-ips' | sudo tee /etc/cron.d/waxblock-cloudflare-ips
```

The daily run changes nothing unless Cloudflare changes its list. If the download fails, the script keeps
the old list, so a Cloudflare API problem cannot lock Cloudflare out.

## 5. Check

On the server (allowed as a local check):

```sh
curl -s --resolve waxblock-api.<your-domain>:443:127.0.0.1 https://waxblock-api.<your-domain>/api/v1/health
curl -s -o /dev/null -w '%{http_code}\n' --resolve waxblock-api.<your-domain>:443:127.0.0.1 \
  https://waxblock-api.<your-domain>/api/v1/tokens/stats       # 403: no client certificate, as expected
```

From any other machine, every request returns `403`. That is correct: only Cloudflare can reach the API.
We confirm the path through Cloudflare from our side when we add your origin to the load balancer.
