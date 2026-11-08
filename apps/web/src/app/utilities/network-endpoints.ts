import config from "../config";
import { parseEndpointList } from "./env-endpoints";

export const STORAGE_KEY_PREFIX = "settings_network_";
const unsavedIndexes = new Map<string, number>();
export const ENDPOINT_CHANGE_EVENT = "network-endpoints-changed";

export const endpointSettings = [
  {
    key: "rpc",
    storageKey: "rpc",
    field: "rpcEndpoint",
    label: "RPC Endpoint",
    path: "/v1/chain/get_info",
  },
  {
    key: "lightApi",
    storageKey: "lightapi",
    field: "lightApiEndpoint",
    label: "Light API Endpoint",
    path: "/api/status",
  },
  {
    key: "historyV2",
    storageKey: "historyv2",
    field: "historyV2Endpoint",
    label: "History Endpoint",
    path: "/v2/health",
  },
  {
    key: "atomic",
    storageKey: "atomic",
    field: "atomicEndpoint",
    label: "Atomic Endpoint",
    path: "/health",
  },
  // An empty identity CID checks the gateway without fetching a large remote file.
  {
    key: "ipfs",
    storageKey: "ipfs",
    field: "ipfsEndpoint",
    label: "IPFS Endpoint",
    path: "/bafkqaaa",
  },
] as const;

export type EndpointSetting = (typeof endpointSettings)[number];
export type EndpointKind = EndpointSetting["key"];

// Keep the configured lists intact when the active endpoints change.
const defaults = {
  rpc: [config.endpoints.default],
  lightApi: Object.keys(config.endpoints.lightapi),
  historyV2: Object.keys(config.endpoints.historyV2),
  atomic: config.endpoints.nfts.atomicassets
    ? [config.endpoints.nfts.atomicassets]
    : [],
};

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
    unsavedIndexes.delete(key);
  } catch {
    unsavedIndexes.set(key, index);
  }
};

export const loadIndex = (key: string, endpoints: string[]): number => {
  const unsaved = unsavedIndexes.get(key);
  if (unsaved !== undefined && unsaved >= 0 && unsaved < endpoints.length)
    return unsaved;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (stored !== null) {
      const idx = parseInt(stored, 10);
      if (!isNaN(idx) && idx >= 0 && idx < endpoints.length) {
        return idx;
      }
    }
  } catch {
    // Keep the default available when browser storage is blocked.
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
  return {
    rpc: parseEndpointList(import.meta.env.VITE_RPC_ENDPOINTS, defaults.rpc),
    lightApi: parseEndpointList(
      import.meta.env.VITE_LIGHTAPI_ENDPOINTS,
      defaults.lightApi,
    ),
    historyV2: parseEndpointList(
      import.meta.env.VITE_HISTORY_ENDPOINTS,
      defaults.historyV2,
    ),
    atomic: parseEndpointList(
      import.meta.env.VITE_ATOMIC_ENDPOINTS,
      defaults.atomic,
    ),
    ipfs: getIpfsEndpoints(),
  };
};

export const selectEndpoint = (
  kind: EndpointKind,
  endpoint: string,
  expectedEndpoint?: string,
) => {
  if (config.network_type === "localnet") return;
  const setting = endpointSettings.find((setting) => setting.key === kind)!;
  const endpoints = getEndpointLists()[kind];
  const index = endpoints.indexOf(endpoint);
  const current = resolveNetworkEndpoints()[setting.field];
  if (
    index < 0 ||
    (expectedEndpoint !== undefined && current !== expectedEndpoint)
  )
    return;
  saveIndex(setting.storageKey, index);
  switch (kind) {
    case "rpc":
      config.endpoints.default = endpoint;
      break;
    case "lightApi":
      config.endpoints.lightapi = { [endpoint]: 100 };
      break;
    case "historyV2":
      config.endpoints.historyV2 = { [endpoint]: 100 };
      break;
    case "atomic":
      config.endpoints.nfts.atomicassets = endpoint;
      break;
  }
  window.dispatchEvent(new Event(ENDPOINT_CHANGE_EVENT));
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
