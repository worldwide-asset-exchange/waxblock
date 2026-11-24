import {
  endpointWeights,
  firstEndpoint,
  parseEndpointList,
} from "./utilities/env-endpoints";

// Mainnet API providers, round-robined in the browser: WAX Team, EOS USA, EOSphere. The WAX Team API
// reads chain data from public providers since v1.5.0 (no K-Open).
const apiUrls = parseEndpointList(import.meta.env.VITE_API_URL, [
  "https://waxblock-api.waxblock.io",
  "https://waxblock-api.eosusa.io",
  "https://waxblock-api.eosphere.io",
]);
const socketUrls = parseEndpointList(import.meta.env.VITE_SOCKET_URL, apiUrls);

const config_mainnet = {
  app_name: "waxblock.io",
  network: "wax",
  network_type: "mainnet",
  chain_id: "1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4",
  token_symbol: "WAX",
  token_precision: 8,
  wallets: ["cloudwallet", "anchor", "wombat", "cleos"],
  endpoints: {
    default: firstEndpoint(import.meta.env.VITE_RPC_ENDPOINTS, [
      "https://wax.greymass.com",
    ]),
    historyV2: endpointWeights(import.meta.env.VITE_HISTORY_ENDPOINTS, [
      "https://history.waxsweden.org",
    ]),
    lightapi: endpointWeights(import.meta.env.VITE_LIGHTAPI_ENDPOINTS, [
      "https://wax.light-api.net",
    ]),
    nfts: {
      simpleassets: import.meta.env.VITE_SIMPLEASSETS || null,
      atomicassets: firstEndpoint(import.meta.env.VITE_ATOMIC_ENDPOINTS, [
        "https://atomic.hivebp.io",
      ]),
    },
  },
  // The WaxBlock API runs at several independent providers. VITE_API_URL and VITE_SOCKET_URL are
  // comma-separated lists; the browser spreads requests across them (utilities/round-robin.ts).
  socket: {
    url: socketUrls[0],
    urls: socketUrls,
    path: "/socket",
  },
  api: {
    url: apiUrls[0],
    urls: apiUrls,
    path: "/api/v1",
  },
};

export default config_mainnet;
