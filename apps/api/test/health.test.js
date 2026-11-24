const http = require("http");
const request = require("supertest");
const { expect } = require("chai");
const globals = require("node-global-storage");
const config = require("../src/config/config");

// The health route caches its upstream probe for 10 s; load a fresh copy per case.
function freshApp() {
  delete require.cache[require.resolve("../src/routes/api/v1/health")];
  delete require.cache[require.resolve("../src/routes/api/v1/index")];
  delete require.cache[require.resolve("../src/routes/api/index")];
  delete require.cache[require.resolve("../src/routes/index")];
  delete require.cache[require.resolve("../src/app")];
  return require("../src/app");
}

describe("GET /api/v1/health", function () {
  let rpc;
  let headTime;
  const original = config.endpoints.default;
  const originalNetwork = config.network_type;

  before(function (done) {
    rpc = http.createServer((req, res) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ head_block_num: 123, head_block_time: headTime }));
    });
    rpc.listen(0, done);
  });
  after(function (done) {
    config.endpoints.default = original;
    config.network_type = originalNetwork;
    rpc.close(done);
  });

  afterEach(function () {
    config.network_type = originalNetwork;
  });

  const populated = () => globals.set("cacheData", { producers: [{ owner: "a" }], tokens: [{ key: "t" }] });

  it("returns 200 when the chain answers with a recent head block and caches are populated", async function () {
    config.endpoints.default = `http://127.0.0.1:${rpc.address().port}`;
    headTime = new Date().toISOString().slice(0, -1);
    populated();
    const res = await request(freshApp()).get("/api/v1/health");
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal("ok");
    expect(res.body.chain.head_block_num).to.equal(123);
  });

  it("returns 503 when the head block is stale", async function () {
    config.endpoints.default = `http://127.0.0.1:${rpc.address().port}`;
    headTime = new Date(Date.now() - 10 * 60 * 1000).toISOString().slice(0, -1);
    populated();
    const res = await request(freshApp()).get("/api/v1/health");
    expect(res.status).to.equal(503);
    expect(res.body.chain.ok).to.equal(false);
  });

  it("returns 200 when one provider in a list is down and the next one answers", async function () {
    config.endpoints.default = `http://127.0.0.1:1,http://127.0.0.1:${rpc.address().port}`;
    headTime = new Date().toISOString().slice(0, -1);
    populated();
    const res = await request(freshApp()).get("/api/v1/health");
    expect(res.status).to.equal(200);
    expect(res.body.chain.ok).to.equal(true);
    expect(res.body.chain.provider).to.equal(`127.0.0.1:${rpc.address().port}`);
    expect(res.body.chain.providers).to.equal(2);
  });

  it("returns 503 when the chain RPC is unreachable", async function () {
    config.endpoints.default = "http://127.0.0.1:1";
    populated();
    const res = await request(freshApp()).get("/api/v1/health");
    expect(res.status).to.equal(503);
    expect(res.body.chain.error).to.match(/unreachable|timeout/);
  });

  it("returns 503 when the caches are still empty", async function () {
    config.endpoints.default = `http://127.0.0.1:${rpc.address().port}`;
    headTime = new Date().toISOString().slice(0, -1);
    globals.set("cacheData", { producers: [], tokens: [] });
    const res = await request(freshApp()).get("/api/v1/health");
    expect(res.status).to.equal(503);
    expect(res.body.caches).to.deep.equal({ producers: false, tokens: false });
  });
  it("returns 503 on mainnet when the tokens cache is empty", async function () {
    config.network_type = "mainnet";
    config.endpoints.default = `http://127.0.0.1:${rpc.address().port}`;
    headTime = new Date().toISOString().slice(0, -1);
    globals.set("cacheData", { producers: [{ owner: "a" }], tokens: [] });
    const res = await request(freshApp()).get("/api/v1/health");
    expect(res.status).to.equal(503);
    expect(res.body.caches.tokens).to.equal(false);
  });

  // The tokens cron runs on mainnet only, so the tokens cache is always empty on testnet.
  it("returns 200 on testnet with an empty tokens cache", async function () {
    config.network_type = "testnet";
    config.endpoints.default = `http://127.0.0.1:${rpc.address().port}`;
    headTime = new Date().toISOString().slice(0, -1);
    globals.set("cacheData", { producers: [{ owner: "a" }], tokens: [] });
    const res = await request(freshApp()).get("/api/v1/health");
    expect(res.status).to.equal(200);
    expect(res.body.network).to.equal("testnet");
    expect(res.body.caches.tokens).to.equal(true);
  });

  it("returns 503 on testnet when the producers cache is empty", async function () {
    config.network_type = "testnet";
    config.endpoints.default = `http://127.0.0.1:${rpc.address().port}`;
    headTime = new Date().toISOString().slice(0, -1);
    globals.set("cacheData", { producers: [], tokens: [] });
    const res = await request(freshApp()).get("/api/v1/health");
    expect(res.status).to.equal(503);
    expect(res.body.caches.producers).to.equal(false);
  });
});
