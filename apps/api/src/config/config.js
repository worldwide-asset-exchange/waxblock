const dotenv = require("dotenv");
const path = require("path");

dotenv.config({path: path.join(__dirname, "../../.env")});

const isTestnet = process.env.NETWORK_TYPE === "testnet" || process.argv[2] === "testnet";

const config = {
    env: process.env.NODE_ENV || "production",
    host: process.env.HOST || "127.0.0.1",
    port: process.env.PORT || 8080,
    // Listen address. Unset = all interfaces (containers). Bare-metal installs set 127.0.0.1 so that only
    // the local reverse proxy can reach the API.
    bind_address: process.env.BIND_ADDRESS || undefined,
    origin_auth_key: process.env.ORIGIN_AUTH_KEY || "",
    network: isTestnet ? "waxtest" : "wax",
    network_type: isTestnet ? "testnet" : "mainnet",
    cache_dir: process.env.CACHE_DIR || "cache",
    token_symbol: "WAX",
    token_precision: 8,
    endpoints: {
        // BLOCKCHAIN_DEAFULT (sic) is the original name; both are accepted.
        default: process.env.BLOCKCHAIN_DEFAULT || process.env.BLOCKCHAIN_DEAFULT || "http://127.0.0.1:8888",
        state: process.env.BLOCKCHAIN_STATE || "http://127.0.0.1:8888",
        block: process.env.BLOCKCHAIN_BLOCK || "http://127.0.0.1:8888",
        transaction: process.env.BLOCKCHAIN_TRANSACTION || "http://127.0.0.1:8888",
        history: process.env.BLOCKCHAIN_HISTORY || "http://127.0.0.1:8888",
        lightapi: process.env.LIGHT_API || "http://127.0.0.1:8100",
        nfts: {
            simpleassets: process.env.SIMPLEASSETS || "http://127.0.0.1:8500",
            atomicassets: process.env.ATOMICASSETS || "http://127.0.0.1:8600",
        },
    },
    data: {
        atomicassets:{
            assets_count: process.env.ASSETS_COUNT || 295873953,
            assets_count_timestamp: process.env.ASSETS_COUNT_TIMESTAMP || 1658903477000
        }
    }
};
module.exports = config;
