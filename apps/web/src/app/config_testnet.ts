import {
  endpointWeights,
  firstEndpoint,
  parseEndpointList,
} from "./utilities/env-endpoints";

const apiUrls = parseEndpointList(import.meta.env.VITE_API_URL, [
  "https://testnet-api.waxblock.io",
]);
const socketUrls = parseEndpointList(import.meta.env.VITE_SOCKET_URL, apiUrls);

const config_testnet = {
  app_name: "waxblock.io",
  network: "waxtest",
  network_type: "testnet",
  chain_id: "f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12",
  token_symbol: "WAX",
  token_precision: 8,
  wallets: ["anchor", "wombat", "cleos"],
  endpoints: {
    default: firstEndpoint(import.meta.env.VITE_RPC_ENDPOINTS, [
      "https://testnet.waxsweden.org",
    ]),
    historyV2: endpointWeights(import.meta.env.VITE_HISTORY_ENDPOINTS, [
      "https://test.wax.eosusa.io",
    ]),
    lightapi: endpointWeights(import.meta.env.VITE_LIGHTAPI_ENDPOINTS, [
      "https://testnet-lightapi.eosams.xeos.me",
    ]),
    nfts: {
      simpleassets: import.meta.env.VITE_SIMPLEASSETS || null,
      atomicassets: firstEndpoint(import.meta.env.VITE_ATOMIC_ENDPOINTS, [
        "https://waxtest-aa.eosdac.io",
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

export default config_testnet;
