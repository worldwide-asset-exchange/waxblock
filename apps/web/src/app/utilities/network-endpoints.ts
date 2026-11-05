import config from "../config";
import { parseEndpointList } from "./env-endpoints";

export const STORAGE_KEY_PREFIX = "settings_network_";

export const getFirstKey = (obj: Record<string, number>): string => {
  return Object.keys(obj)[0] || "";
};

export const parseEndpoints = (
  envVar: string | undefined,
  fallback: string,
): string[] => {
  return parseEndpointList(envVar, fallback ? [fallback] : []);
};

export const getIpfsEndpoints = (): string[] =>
  parseEndpoints(
    import.meta.env.VITE_IPFS_ENDPOINTS,
    "https://ipfs.filebase.io/ipfs/",
  ).map(
    (endpoint) =>
      `${endpoint.replace(/\/+$/, "").replace(/\/ipfs$/, "")}/ipfs/`,
  );

export const saveIndex = (key: string, index: number) => {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, String(index));
  } catch {
    // do nothing
  }
};

export const loadIndex = (key: string, endpoints: string[]): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (stored !== null) {
      const idx = parseInt(stored, 10);
      if (!isNaN(idx) && idx >= 0 && idx < endpoints.length) {
        return idx;
      }
    }
  } catch {
    // do nothing
  }
  //reset key index if invalid
  saveIndex(key, 0);
  return 0;
};

export interface NetworkEndpoints {
  rpcEndpoint: string;
  lightApiEndpoint: string;
  historyV2Endpoint: string;
  atomicEndpoint: string;
  ipfsEndpoint: string;
}

export const getEndpointLists = () => {
  const defaultRpc = config.endpoints.default;
  const defaultLightApi = getFirstKey(config.endpoints.lightapi);
  const defaultHistoryV2 = getFirstKey(config.endpoints.historyV2);
  const defaultAtomic = config.endpoints.nfts.atomicassets || "";

  return {
    rpc: parseEndpoints(import.meta.env.VITE_RPC_ENDPOINTS, defaultRpc),
    lightApi: parseEndpoints(
      import.meta.env.VITE_LIGHTAPI_ENDPOINTS,
      defaultLightApi,
    ),
    historyV2: parseEndpoints(
      import.meta.env.VITE_HISTORY_ENDPOINTS,
      defaultHistoryV2,
    ),
    atomic: parseEndpoints(
      import.meta.env.VITE_ATOMIC_ENDPOINTS,
      defaultAtomic,
    ),
    ipfs: getIpfsEndpoints(),
  };
};

export const resolveNetworkEndpoints = (): NetworkEndpoints => {
  const lists = getEndpointLists();
  return {
    rpcEndpoint: lists.rpc[loadIndex("rpc", lists.rpc)] || "",
    lightApiEndpoint:
      lists.lightApi[loadIndex("lightapi", lists.lightApi)] || "",
    historyV2Endpoint:
      lists.historyV2[loadIndex("historyv2", lists.historyV2)] || "",
    atomicEndpoint: lists.atomic[loadIndex("atomic", lists.atomic)] || "",
    ipfsEndpoint: lists.ipfs[loadIndex("ipfs", lists.ipfs)],
  };
};
