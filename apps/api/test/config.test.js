const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

// A fresh process avoids the config mocks used by the other API test suites.
const loadConfig = (env, args = []) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        "-e",
        "process.stdout.write(JSON.stringify(require('./src/config/config')))",
        "config-test",
        ...args,
      ],
      {
        cwd: path.join(__dirname, ".."),
        env: { ...process.env, ...env },
        encoding: "utf8",
      },
    ),
  );

const sharedEnv = {
  NODE_ENV: "production",
  HOST: "0.0.0.0",
  PORT: "9080",
  BLOCKCHAIN_DEAFULT: "https://rpc.example",
  BLOCKCHAIN_STATE: "https://state.example",
  BLOCKCHAIN_BLOCK: "https://block.example",
  BLOCKCHAIN_TRANSACTION: "https://transaction.example",
  BLOCKCHAIN_HISTORY: "https://history.example",
  LIGHT_API: "https://light.example",
  SIMPLEASSETS: "https://simple.example",
  ATOMICASSETS: "https://atomic.example",
  ASSETS_COUNT: "12345",
  ASSETS_COUNT_TIMESTAMP: "1765252639411",
};

describe("API network configuration", () => {
  for (const networkType of ["mainnet", "testnet"]) {
    it(`uses shared environment variables for ${networkType}`, () => {
      const config = loadConfig({ ...sharedEnv, NETWORK_TYPE: networkType });

      assert.equal(config.network_type, networkType);
      assert.equal(config.network, networkType === "testnet" ? "waxtest" : "wax");
      assert.equal(config.host, sharedEnv.HOST);
      assert.equal(config.port, sharedEnv.PORT);
      assert.deepEqual(config.endpoints, {
        default: sharedEnv.BLOCKCHAIN_DEAFULT,
        state: sharedEnv.BLOCKCHAIN_STATE,
        block: sharedEnv.BLOCKCHAIN_BLOCK,
        transaction: sharedEnv.BLOCKCHAIN_TRANSACTION,
        history: sharedEnv.BLOCKCHAIN_HISTORY,
        lightapi: sharedEnv.LIGHT_API,
        nfts: {
          simpleassets: sharedEnv.SIMPLEASSETS,
          atomicassets: sharedEnv.ATOMICASSETS,
        },
      });
      assert.deepEqual(config.data.atomicassets, {
        assets_count: sharedEnv.ASSETS_COUNT,
        assets_count_timestamp: sharedEnv.ASSETS_COUNT_TIMESTAMP,
      });
    });

    it(`keeps the default port when PORT is empty for ${networkType}`, () => {
      const config = loadConfig({
        ...sharedEnv,
        NETWORK_TYPE: networkType,
        PORT: "",
      });
      assert.equal(config.port, 8080);
    });
  }

  it("defaults to mainnet when no network type is set", () => {
    const config = loadConfig({ ...sharedEnv, NETWORK_TYPE: "" });
    assert.equal(config.network_type, "mainnet");
    assert.equal(config.network, "wax");
  });

  it("supports the testnet CLI argument with the shared variables", () => {
    const config = loadConfig(
      { ...sharedEnv, NETWORK_TYPE: "mainnet" },
      ["testnet"],
    );
    assert.equal(config.network_type, "testnet");
    assert.equal(config.network, "waxtest");
    assert.equal(config.port, sharedEnv.PORT);
    assert.equal(config.endpoints.default, sharedEnv.BLOCKCHAIN_DEAFULT);
  });
});
