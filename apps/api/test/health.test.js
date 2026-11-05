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

  before(function (done) {
    rpc = http.createServer((req, res) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ head_block_num: 123, head_block_time: headTime }));
    });
    rpc.listen(0, done);
  });
  after(function (done) {
    config.endpoints.default = original;
    rpc.close(done);
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
});
