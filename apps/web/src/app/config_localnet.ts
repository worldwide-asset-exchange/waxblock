const config_localnet = {
  app_name: "waxblock.io",
  network: "localnet",
  network_type: "localnet",
  chain_id: null,
  token_symbol: "WAX",
  token_precision: 8,
  wallets: ["anchor", "wombat", "cleos"],
  endpoints: {
    default: "",
    historyV2: {},
    lightapi: {},
    nfts: {
      simpleassets: null,
      atomicassets: null,
    },
  },
  socket: {
    url: null,
    path: null,
  },
  api: {
    url: null,
    path: null,
  },
};

export default config_localnet;
