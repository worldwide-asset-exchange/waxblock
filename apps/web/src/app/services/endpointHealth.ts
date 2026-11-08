import config from "../config";
import {
  endpointSettings,
  getEndpointLists,
  resolveNetworkEndpoints,
  selectEndpoint,
  type EndpointKind,
} from "../utilities/network-endpoints";

export interface EndpointHealth {
  ping: number | null;
  coverage?: "full" | "partial" | "unknown";
  dataSince?: number;
}

const healthCache = new Map<
  string,
  { expires: number; result: Promise<EndpointHealth> }
>();
const cacheKey = (kind: EndpointKind, endpoint: string) =>
  `${kind}:${endpoint}`;

export const markEndpointFailed = (kind: EndpointKind, endpoint: string) => {
  healthCache.set(cacheKey(kind, endpoint), {
    expires: Date.now() + 30000,
    result: Promise.resolve({ ping: null }),
  });
};

export const checkEndpointHealth = (
  kind: EndpointKind,
  endpoint: string,
): Promise<EndpointHealth> => {
  const key = cacheKey(kind, endpoint);
  const cached = healthCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;
  const result = (async (): Promise<EndpointHealth> => {
    const started = performance.now();
    const setting = endpointSettings.find((setting) => setting.key === kind)!;
    try {
      const response = await fetch(
        `${endpoint.replace(/\/+$/, "")}${setting.path}`,
        { cache: "no-store", signal: AbortSignal.timeout(5000) },
      );
      if (!response.ok) return { ping: null };
      if (kind === "lightApi") {
        const status = await response.text();
        return {
          ping: /^OK\b/i.test(status.trim())
            ? Math.round(performance.now() - started)
            : null,
        };
      }
      if (kind === "ipfs") {
        await response.arrayBuffer();
        return { ping: Math.round(performance.now() - started) };
      }
      const data = await response.json();
      if (!data || typeof data !== "object" || data.success === false)
        return { ping: null };
      if (
        Array.isArray(data.health) &&
        data.health.some((service) =>
          /^(error|disconnected|down|offline)$/i.test(service?.status),
        )
      )
        return { ping: null };
      if (
        kind === "rpc" &&
        (!data.chain_id ||
          !Number.isFinite(Number(data.head_block_num)) ||
          (config.chain_id && data.chain_id !== config.chain_id))
      )
        return { ping: null };
      const health: EndpointHealth = {
        ping: Math.round(performance.now() - started),
      };
      if (kind === "historyV2") {
        if (!Array.isArray(data.health) || !data.health.length)
          return { ping: null };
        const slices = data.health.map((service) => service.service_data);
        const es = slices.find(
          (slice) => slice?.first_indexed_block !== undefined,
        );
        const node = slices.find(
          (slice) => slice?.head_block_time !== undefined,
        );
        const first = Number(es?.first_indexed_block);
        health.coverage =
          Number.isFinite(first) && first >= 0
            ? first > 10
              ? "partial"
              : "full"
            : "unknown";
        const since =
          Date.parse(node?.head_block_time) -
          (Number(node?.head_block_num) - first) * 500;
        if (Number.isFinite(since) && Number(node?.head_block_num) >= first)
          health.dataSince = since;
      }
      return health;
    } catch {
      return { ping: null };
    }
  })();
  healthCache.set(key, { expires: Date.now() + 30000, result });
  return result;
};

export const findHealthyEndpoint = async (
  kind: EndpointKind,
  failedEndpoint: string,
  excluded: ReadonlySet<string> = new Set(),
  signal?: AbortSignal,
): Promise<string | undefined> => {
  const endpoints = getEndpointLists()[kind];
  const start = endpoints.indexOf(failedEndpoint);
  for (let offset = 1; offset < endpoints.length; offset++) {
    signal?.throwIfAborted();
    const candidate = endpoints[(start + offset) % endpoints.length];
    if (candidate === failedEndpoint || excluded.has(candidate)) continue;
    const health = await checkEndpointHealth(kind, candidate);
    signal?.throwIfAborted();
    if (health.ping !== null) return candidate;
  }
};

export const ensureHealthyEndpoint = async (
  kind: EndpointKind,
  signal?: AbortSignal,
) => {
  if (config.network_type === "localnet") return;
  const setting = endpointSettings.find((setting) => setting.key === kind)!;
  const selected = resolveNetworkEndpoints()[setting.field];
  if (!selected) return;
  const health = await checkEndpointHealth(kind, selected);
  if (health.ping !== null || signal?.aborted) return;
  const fallback = await findHealthyEndpoint(kind, selected, undefined, signal);
  if (fallback && !signal?.aborted) selectEndpoint(kind, fallback, selected);
};
