#!/bin/sh
# Writes /etc/nginx/waxblock/cloudflare-geo.conf from Cloudflare's published IP ranges and reloads nginx.
# Run once at install, then daily (for example from /etc/cron.d). Keeps the old file if the download fails
# or looks wrong, so a Cloudflare API outage cannot lock Cloudflare out. Exits non-zero on any failure.
set -eu
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin   # cron runs with a minimal PATH
OUT=${OUT:-/etc/nginx/waxblock/cloudflare-geo.conf}
NGINX=${NGINX:-nginx}
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

curl -fsS --max-time 30 https://api.cloudflare.com/client/v4/ips \
  | jq -r '.result.ipv4_cidrs[], .result.ipv6_cidrs[] | "\(.) 1;"' > "$TMP"

COUNT=$(wc -l < "$TMP")
if [ "$COUNT" -lt 10 ]; then
  echo "waxblock: only $COUNT Cloudflare ranges received; keeping $OUT unchanged." >&2
  exit 1
fi

if [ -f "$OUT" ] && cmp -s "$TMP" "$OUT"; then
  exit 0
fi

BACKUP=""
if [ -f "$OUT" ]; then BACKUP="$OUT.previous"; cp -p "$OUT" "$BACKUP"; fi
install -m 0644 "$TMP" "$OUT"
if ! "$NGINX" -t -q; then
  echo "waxblock: nginx -t failed with the new Cloudflare list; restoring the previous one." >&2
  if [ -n "$BACKUP" ]; then cp -p "$BACKUP" "$OUT"; fi
  exit 1
fi
"$NGINX" -s reload
echo "waxblock: updated $OUT with $COUNT Cloudflare ranges and reloaded nginx."
