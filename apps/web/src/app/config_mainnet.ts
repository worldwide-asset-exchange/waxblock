import { endpointWeights, firstEndpoint } from "./utilities/env-endpoints";

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
      "https://lightapi.waxnet.io",
    ]),
    nfts: {
      simpleassets: import.meta.env.VITE_SIMPLEASSETS || null,
      atomicassets: firstEndpoint(import.meta.env.VITE_ATOMIC_ENDPOINTS, [
        "https://atomic.hivebp.io",
      ]),
    },
  },
  socket: {
    url: import.meta.env.VITE_SOCKET_URL || "https://waxblock-api.waxblock.io",
    path: "/socket",
  },
  api: {
    url: import.meta.env.VITE_API_URL || "https://waxblock-api.waxblock.io",
    path: "/api/v1",
  },
};

export default config_mainnet;
