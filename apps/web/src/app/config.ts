import config_mainnet from "./config_mainnet";
import config_testnet from "./config_testnet";
import config_localnet from "./config_localnet";

export type Config =
  typeof config_mainnet | typeof config_testnet | typeof config_localnet;

let config: Config = config_mainnet;

// Switch config based on network type
if (
  import.meta.env.VITE_NETWORK_TYPE === "testnet" ||
  import.meta.env.VITE_CF_NETWORK_TYPE === "testnet"
) {
  config = { ...config, ...config_testnet };
} else if (
  import.meta.env.VITE_NETWORK_TYPE === "localnet" ||
  import.meta.env.VITE_CF_NETWORK_TYPE === "localnet"
) {
  config = { ...config, ...config_localnet };
} else {
  // Default to mainnet
  config = { ...config, ...config_mainnet };
}

export default config;
