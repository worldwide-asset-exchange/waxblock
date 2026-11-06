# Install on Kubernetes

This guide runs mainnet and testnet as two Deployments in the namespace `waxblock`, exposed through an
Ingress. It works on any conformant cluster: EKS, GKE, AKS, k3s, kubeadm and others. Files are in
[`deploy/kubernetes/`](../../deploy/kubernetes/).

| File | Contents |
|---|---|
| `waxblock-api-mainnet.yaml` | ConfigMap, Deployment, Service for mainnet |
| `waxblock-api-testnet.yaml` | The same for testnet |
| `ingress.yaml` | Example Ingress for ingress-nginx with cert-manager |

## 1. Get the files

```sh
VERSION=v1.3.1
for f in waxblock-api-mainnet.yaml waxblock-api-testnet.yaml ingress.yaml; do
  curl -fsSO "https://raw.githubusercontent.com/worldwide-asset-exchange/waxblock/${VERSION}/deploy/kubernetes/${f}"
done
```

## 2. Edit

In both `waxblock-api-*.yaml` files:

- **Image:** append the digest from the release notes:
  `ghcr.io/worldwide-asset-exchange/waxblock-api:v1.3.1@sha256:<digest>`.
- **ConfigMap:** point the endpoints at your own WAX nodes where you can
  ([CONFIGURATION.md](../CONFIGURATION.md)).

## 3. Apply

```sh
kubectl create namespace waxblock
kubectl -n waxblock apply -f waxblock-api-mainnet.yaml -f waxblock-api-testnet.yaml
kubectl -n waxblock rollout status deploy/waxblock-api-mainnet --timeout=10m
kubectl -n waxblock rollout status deploy/waxblock-api-testnet --timeout=10m
```

A pod becomes Ready when `/api/v1/health` returns `200`, about 3 minutes after the first start.

```sh
kubectl -n waxblock port-forward svc/waxblock-api-mainnet 8080:80 &
curl -s http://127.0.0.1:8080/api/v1/health     # "status":"ok","network":"mainnet"
```

## 4. What the manifests set, and why

| Setting | Value | Reason |
|---|---|---|
| Replicas | 1 | Each instance polls the chain on its own; one per network is enough. |
| Strategy | RollingUpdate, `maxUnavailable: 0` | The old pod serves until the new one is Ready. |
| Startup / liveness probe | `/api/v1/test` | Restarts the process only when it stops answering. |
| Readiness probe | `/api/v1/health` | Removes the pod from the Service when its data is incomplete or the chain RPC is down. Do **not** use it as the liveness probe: an RPC outage would then restart the pod in a loop. |
| Security context | uid 1000, non-root, read-only root filesystem, no capabilities | The process writes only to its cache volume. |
| Cache | `emptyDir`, 1 GiB limit | Rebuilt in about 3 minutes after a pod is replaced. Use a PersistentVolumeClaim to keep it warm. |
| Resources | request 100m / 256Mi, limit 1 CPU / 1Gi | Measured use is about 0.08 CPU and 200 MiB. |

More than one replica per network works, but your Ingress must keep each WebSocket on one pod (it does by
default: a WebSocket is one long-lived connection).

## 5. Ingress, TLS and access

The controls are the same as for every install ([reverse-proxy.md](reverse-proxy.md)): TLS with a public
certificate, only Cloudflare source addresses, the Cloudflare client certificate (AOP) verified, and
WebSocket on `/socket/` with a 300 s timeout.

`ingress.yaml` does this with ingress-nginx and cert-manager:

1. Replace the two example hostnames.
2. Create the AOP CA secret:

   ```sh
   curl -fsS -o origin-pull-ca.pem https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem
   kubectl -n waxblock create secret generic cloudflare-origin-pull-ca --from-file=ca.crt=origin-pull-ca.pem
   ```

3. Check that the controller sees the real peer address. With a cloud load balancer in front of
   ingress-nginx, set `externalTrafficPolicy: Local` on the controller Service (or enable PROXY protocol).
   Otherwise every request appears to come from a node address and the source-range list refuses them all.
4. `kubectl -n waxblock apply -f ingress.yaml`

The ingress-nginx example requires the client certificate on every path, including `/api/v1/health`. Our
load-balancer monitor presents it, so this works. If your local monitoring needs `/api/v1/health` without
it, probe the Service inside the cluster instead.

With another controller (Gateway API, Traefik, HAProxy, a cloud load balancer), configure the same four
controls with its own settings. On AWS, see [aws.md](aws.md#eks).

## Upgrade

Change the image tag and digest in both files, then apply testnet first:

```sh
kubectl -n waxblock apply -f waxblock-api-testnet.yaml && kubectl -n waxblock rollout status deploy/waxblock-api-testnet --timeout=10m
kubectl -n waxblock apply -f waxblock-api-mainnet.yaml && kubectl -n waxblock rollout status deploy/waxblock-api-mainnet --timeout=10m
```

To go back: `kubectl -n waxblock rollout undo deploy/<name>`.
