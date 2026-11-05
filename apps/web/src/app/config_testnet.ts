import { endpointWeights, firstEndpoint } from "./utilities/env-endpoints";

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
  socket: {
    url: import.meta.env.VITE_SOCKET_URL || "https://testnet-api.waxblock.io",
    path: "/socket",
  },
  api: {
    url: import.meta.env.VITE_API_URL || "https://testnet-api.waxblock.io",
    path: "/api/v1",
  },
};

export default config_testnet;
