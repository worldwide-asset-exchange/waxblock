#!/bin/sh
# Writes /etc/nginx/waxblock/cloudflare-geo.conf from Cloudflare's published IP ranges and reloads nginx.
# Run once at install, then daily (for example from /etc/cron.daily). Keeps the old file if the
# download fails or looks wrong, so a Cloudflare API outage cannot lock Cloudflare out.
set -eu
OUT=${OUT:-/etc/nginx/waxblock/cloudflare-geo.conf}
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

curl -fsS --max-time 30 https://api.cloudflare.com/client/v4/ips \
  | jq -r '.result.ipv4_cidrs[], .result.ipv6_cidrs[] | "\(.) 1;"' > "$TMP"

COUNT=$(wc -l < "$TMP")
if [ "$COUNT" -lt 10 ]; then
  echo "Only $COUNT ranges received; keeping $OUT unchanged." >&2
  exit 1
fi

if [ -f "$OUT" ] && cmp -s "$TMP" "$OUT"; then
  exit 0
fi
install -m 0644 "$TMP" "$OUT"
nginx -t -q && nginx -s reload
echo "Updated $OUT with $COUNT Cloudflare ranges."
