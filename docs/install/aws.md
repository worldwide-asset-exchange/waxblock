# Install on AWS

Three ways to run the API on AWS. All of them meet the same requirements as every install
([README.md](README.md#requirements-for-every-environment)).

| Option | Use it when | Guide |
|---|---|---|
| [EC2](#ec2) | You want one small instance and full control | EC2 + [bare-metal.md](bare-metal.md) or [docker.md](docker.md) |
| [ECS Fargate](#ecs-fargate-behind-an-alb) | You want managed containers and no servers | This page |
| [EKS](#eks) | You already run Kubernetes on AWS | [kubernetes.md](kubernetes.md) + this page |

Every option uses two **managed prefix lists** with Cloudflare's IP ranges, so that only Cloudflare reaches
port 443. Create them once per region:

```sh
CF=$(curl -fsS https://api.cloudflare.com/client/v4/ips)
aws ec2 create-managed-prefix-list --prefix-list-name cloudflare-ipv4 --address-family IPv4 --max-entries 20 \
  --entries $(echo "$CF" | jq -r '.result.ipv4_cidrs[] | "Cidr=\(.)"') --query PrefixList.PrefixListId --output text
aws ec2 create-managed-prefix-list --prefix-list-name cloudflare-ipv6 --address-family IPv6 --max-entries 10 \
  --entries $(echo "$CF" | jq -r '.result.ipv6_cidrs[] | "Cidr=\(.)"') --query PrefixList.PrefixListId --output text
```

A security group rule that references a prefix list counts as `max-entries` rules toward the quota of 60
inbound rules per group; 20 + 10 leaves room. When Cloudflare changes its list, update the entries with
`aws ec2 modify-managed-prefix-list`.

## EC2

1. Launch an Ubuntu 24.04 LTS instance. `t4g.small` (arm64, 2 vCPU, 2 GiB) runs both networks; use
   `t3.small` for x86. 20 GiB gp3 root volume.
2. Attach an Elastic IP, so your DNS records stay valid when the instance is replaced.
3. Security group:

   | Direction | Port | Source |
   |---|---|---|
   | Inbound | 443 | prefix lists `cloudflare-ipv4` and `cloudflare-ipv6` |
   | Inbound | 80 | `0.0.0.0/0` — only for Let's Encrypt HTTP-01; drop it if you use DNS-01 |
   | Outbound | 443 | `0.0.0.0/0` (WAX endpoints and the hosts in [CONFIGURATION.md](../CONFIGURATION.md#outbound-access)) |

   Use Session Manager for shell access instead of opening port 22.
4. Point your two hostnames at the Elastic IP.
5. Follow [bare-metal.md](bare-metal.md) (systemd) or [docker.md](docker.md) (containers), then
   [reverse-proxy.md](reverse-proxy.md). Skip the `ufw` step; the security group does the same.

## ECS Fargate behind an ALB

```text
Cloudflare ──443, client cert──▶ ALB (TLS, mTLS verify, host rules) ──8080──▶ Fargate task (mainnet)
                                                                    └─8080──▶ Fargate task (testnet)
```

### 1. Task definitions

[`deploy/aws/ecs-task-definition-mainnet.json`](../../deploy/aws/ecs-task-definition-mainnet.json) and
[`-testnet.json`](../../deploy/aws/ecs-task-definition-testnet.json): 0.5 vCPU, 1 GiB, ARM64, uid 1000,
read-only root filesystem, cache on task storage, container health check, logs to CloudWatch.

Edit both files:

- `image`: add the digest from the release notes (`...:v1.3.1@sha256:<digest>`).
- `executionRoleArn`: your account's ECS task execution role (it needs only CloudWatch Logs; the image is
  public).
- `awslogs-region`: your region.
- `environment`: your own WAX endpoints where you can.

```sh
aws ecs register-task-definition --cli-input-json file://ecs-task-definition-mainnet.json
aws ecs register-task-definition --cli-input-json file://ecs-task-definition-testnet.json
```

### 2. Certificates and AOP trust store

1. Request an ACM certificate for each hostname (DNS validation).
2. Upload Cloudflare's origin-pull CA to S3 and create an ALB trust store:

   ```sh
   curl -fsS -o origin-pull-ca.pem https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem
   aws s3 cp origin-pull-ca.pem s3://<your-bucket>/waxblock/origin-pull-ca.pem
   aws elbv2 create-trust-store --name waxblock-cloudflare-aop \
     --ca-certificates-bundle-s3-bucket <your-bucket> --ca-certificates-bundle-s3-key waxblock/origin-pull-ca.pem
   ```

   Read [reverse-proxy.md](reverse-proxy.md#3-aop-certificate) for what this CA proves.

### 3. Load balancer

| Resource | Settings |
|---|---|
| Security group `waxblock-alb` | Inbound 443 from prefix lists `cloudflare-ipv4` and `cloudflare-ipv6` |
| Security group `waxblock-tasks` | Inbound 8080 from `waxblock-alb` only |
| ALB | Internet-facing, two public subnets, security group `waxblock-alb`, attribute `idle_timeout.timeout_seconds=300` (WebSocket) |
| Target groups `waxblock-mainnet`, `waxblock-testnet` | Type `ip`, HTTP, port 8080, health check `GET /api/v1/health` expecting `200`, interval 30 s, healthy 2, unhealthy 3, deregistration delay 30 s |
| Listener 443 | HTTPS, both ACM certificates (SNI), mutual authentication **verify** with trust store `waxblock-cloudflare-aop` |
| Listener rules | Host `waxblock-api.<your-domain>` → `waxblock-mainnet`; host `waxblock-testnet-api.<your-domain>` → `waxblock-testnet`; default → fixed response 404 |

With mutual authentication in **verify** mode the ALB refuses every TLS connection without a valid client
certificate. Our Cloudflare monitor presents the certificate. The ALB's own target health checks are not
affected.

### 4. Services

```sh
for net in mainnet testnet; do
  aws ecs create-service --cluster <cluster> --service-name "waxblock-api-$net" \
    --task-definition "waxblock-api-$net" --desired-count 1 --launch-type FARGATE \
    --deployment-configuration "minimumHealthyPercent=100,maximumPercent=200" \
    --health-check-grace-period-seconds 300 \
    --network-configuration "awsvpcConfiguration={subnets=[<subnet-a>,<subnet-b>],securityGroups=[<waxblock-tasks>],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=<waxblock-$net target group ARN>,containerName=api,containerPort=8080"
done
```

Tasks need outbound internet: public subnets with `assignPublicIp=ENABLED` (as above), or private subnets
with a NAT gateway.

Point your two hostnames at the ALB's DNS name (CNAME).

### 5. Check

```sh
aws elbv2 describe-target-health --target-group-arn <waxblock-mainnet target group ARN>   # healthy after ~3 min
aws ecs describe-services --cluster <cluster> --services waxblock-api-mainnet waxblock-api-testnet \
  --query 'services[].{name:serviceName,running:runningCount,events:events[0].message}'
```

### Upgrade

Change the image in both task definitions, register them, and update testnet first:

```sh
aws ecs register-task-definition --cli-input-json file://ecs-task-definition-testnet.json
aws ecs update-service --cluster <cluster> --service waxblock-api-testnet --task-definition waxblock-api-testnet
aws ecs wait services-stable --cluster <cluster> --services waxblock-api-testnet
```

Then the same for mainnet. ECS keeps the old task until the new one passes the target-group health check.

## EKS

Follow [kubernetes.md](kubernetes.md) for the Deployments. For the entry point you can keep ingress-nginx
(behind an NLB with `externalTrafficPolicy: Local`), or use the AWS Load Balancer Controller with the same
ALB settings as the ECS option above. [`deploy/kubernetes/ingress-aws-alb.yaml`](../../deploy/kubernetes/ingress-aws-alb.yaml)
is an example: it sets the certificate, the Cloudflare source ranges, the idle timeout, the health-check path
and mutual authentication with the trust store from [step 2](#2-certificates-and-aop-trust-store).
