const assert = require("node:assert/strict");
const http = require("node:http");
const {
  parseEndpoints,
  createRoundRobin,
  getPool,
  resetPools,
} = require("../src/services/roundRobin");
const FetchManager = require("../src/services/fetchManager");

describe("provider list parsing", () => {
  it("reads one URL as one primary (back-compat)", () => {
    assert.deepEqual(parseEndpoints("https://a.example"), {
      primaries: ["https://a.example"],
      backups: [],
    });
  });

  it("reads primaries and backups, trims, drops empty entries, trailing slashes and duplicates", () => {
    assert.deepEqual(
      parseEndpoints(" https://a.example/ , https://b.example,,https://a.example ; https://c.example,https://b.example "),
      {
        primaries: ["https://a.example", "https://b.example"],
        backups: ["https://c.example"],
      },
    );
  });

  it("reads an empty value as no providers", () => {
    assert.deepEqual(parseEndpoints(""), { primaries: [], backups: [] });
    assert.deepEqual(parseEndpoints(undefined), { primaries: [], backups: [] });
  });
});

describe("round robin", () => {
  const list = "a,b,c;x,y";

  it("starts at a random primary and moves to the next one per request", () => {
    const rr = createRoundRobin(list, { random: () => 0.5 });
    assert.deepEqual(rr.order().slice(0, 3), ["b", "c", "a"]);
    assert.deepEqual(rr.order().slice(0, 3), ["c", "a", "b"]);
    assert.deepEqual(rr.order().slice(0, 3), ["a", "b", "c"]);
  });

  it("keeps a random value of 1 inside the list", () => {
    const rr = createRoundRobin("a,b", { random: () => 1 });
    assert.equal(rr.order()[0], "b");
  });

  it("puts backups after every healthy primary", () => {
    const rr = createRoundRobin(list, { random: () => 0 });
    assert.deepEqual(rr.order(), ["a", "b", "c", "x", "y"]);
  });

  it("moves a failed provider to the end for 30 s, then brings it back", () => {
    let time = 1000;
    const rr = createRoundRobin(list, { random: () => 0, now: () => time });
    rr.markFailed("a");
    assert.deepEqual(rr.order(), ["b", "c", "x", "y", "a"]);
    time += 29_999;
    assert.equal(rr.isCoolingDown("a"), true);
    time += 1;
    assert.equal(rr.isCoolingDown("a"), false);
    assert.ok(rr.order().indexOf("a") < 3);
  });

  it("uses backups first only when every primary is cooling down", () => {
    const rr = createRoundRobin(list, { random: () => 0, now: () => 0 });
    rr.markFailed("a");
    rr.markFailed("b");
    assert.deepEqual(rr.order().slice(0, 2), ["c", "x"]);
    rr.markFailed("c");
    const order = rr.order();
    assert.deepEqual([...order.slice(0, 2)].sort(), ["x", "y"]);
    assert.deepEqual([...order.slice(2)].sort(), ["a", "b", "c"]);
  });

  it("orders cooling primaries before cooling backups", () => {
    const rr = createRoundRobin("a;x", { now: () => 0 });
    rr.markFailed("a");
    rr.markFailed("x");
    assert.deepEqual(rr.order(), ["a", "x"]);
  });

  it("ignores markFailed for an unknown provider", () => {
    const rr = createRoundRobin("a", { now: () => 0 });
    rr.markFailed("zzz");
    assert.deepEqual(rr.order(), ["a"]);
  });

  it("shares one round robin per configured value", () => {
    resetPools();
    assert.equal(getPool("a,b"), getPool("a,b"));
    assert.notEqual(getPool("a,b"), getPool("a"));
  });
});

describe("FetchManager with a provider list", () => {
  // Each fake provider answers with a scripted status/body and records what it received.
  const servers = [];
  const hits = {};
  const behaviours = {};
  const url = (name) => `http://127.0.0.1:${servers.find((s) => s.name === name).port}`;

  const startServer = (name) =>
    new Promise((resolve) => {
      const server = http.createServer((req, res) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          (hits[name] = hits[name] || []).push({ url: req.url, ua: req.headers["user-agent"], body });
          const behaviour = behaviours[name] || { status: 200, body: { from: name } };
          if (behaviour.hang) return; // never answers: exercises the per-attempt timeout
          res.statusCode = behaviour.status;
          res.setHeader("content-type", "application/json");
          res.end(typeof behaviour.body === "string" ? behaviour.body : JSON.stringify(behaviour.body));
        });
      });
      server.listen(0, "127.0.0.1", () => {
        servers.push({ name, server, port: server.address().port });
        resolve();
      });
    });

  before(async () => {
    for (const name of ["a", "b", "c"]) await startServer(name);
  });
  after(() => {
    for (const { server } of servers) {
      server.closeAllConnections();
      server.close();
    }
  });
  beforeEach(() => {
    for (const key of Object.keys(hits)) delete hits[key];
    for (const key of Object.keys(behaviours)) delete behaviours[key];
  });

  // A round robin that always starts at "a", then "b", then "c" (no random start).
  const pool = (value = `${url("a")},${url("b")};${url("c")}`, now = () => 0) =>
    createRoundRobin(value, { random: () => 0, now });

  const getInfo = (p, extra = {}) =>
    FetchManager.post(p, { path: "/v1/chain/get_info", data: {}, ...extra });

  it("returns the first provider's answer and sends a real User-Agent", async () => {
    const result = await getInfo(pool());
    assert.deepEqual(result, { from: "a" });
    assert.match(hits.a[0].ua, /^waxblock-api\//);
    assert.equal(hits.b, undefined);
  });

  for (const status of [500, 502, 503, 504, 429, 408]) {
    it(`fails over on HTTP ${status} and skips the failed provider`, async () => {
      behaviours.a = { status, body: { message: "busy" } };
      const p = pool();
      assert.deepEqual(await getInfo(p), { from: "b" });
      assert.equal(p.isCoolingDown(url("a")), true);
    });
  }

  it("does not fail over on a 4xx answer", async () => {
    behaviours.a = { status: 400, body: { code: 400, message: "Unknown Block" } };
    const p = pool();
    await assert.rejects(getInfo(p), { message: "BadRequest" });
    assert.equal(hits.b, undefined);
    assert.equal(p.isCoolingDown(url("a")), false);
  });

  it("does not fail over on a chain assertion error (HTTP 500 with an error code)", async () => {
    behaviours.a = {
      status: 500,
      body: { code: 500, message: "Internal Service Error", error: { code: 3050003, name: "eosio_assert_message_exception" } },
    };
    await assert.rejects(getInfo(pool()), { message: "Server" });
    assert.equal(hits.b, undefined);
  });

  it("fails over on a 200 that is not JSON", async () => {
    behaviours.a = { status: 200, body: "<html>maintenance</html>" };
    assert.deepEqual(await getInfo(pool()), { from: "b" });
  });

  it("fails over on a network error", async () => {
    const p = pool(`http://127.0.0.1:1,${url("b")}`);
    assert.deepEqual(await getInfo(p), { from: "b" });
    assert.equal(p.isCoolingDown("http://127.0.0.1:1"), true);
  });

  it("fails over when an attempt times out", async () => {
    behaviours.a = { hang: true };
    assert.deepEqual(await getInfo(pool(), { timeout: 200 }), { from: "b" });
  });

  it("uses a backup only after every primary failed", async () => {
    behaviours.a = { status: 503, body: {} };
    behaviours.b = { status: 503, body: {} };
    assert.deepEqual(await getInfo(pool()), { from: "c" });
    assert.equal(hits.a.length, 1);
    assert.equal(hits.b.length, 1);
  });

  it("skips providers in cooldown on the next request", async () => {
    behaviours.a = { status: 503, body: {} };
    const p = pool();
    await getInfo(p); // a fails, b answers
    delete behaviours.a;
    const before = (hits.a || []).length;
    await getInfo(p); // a is cooling down: b or c answers first
    assert.equal(hits.a.length, before);
  });

  it("rejects with the last error when every provider fails", async () => {
    for (const name of ["a", "b", "c"]) behaviours[name] = { status: 502, body: {} };
    await assert.rejects(getInfo(pool()), { message: "Unknown" });
    assert.equal(hits.a.length + hits.b.length + hits.c.length, 3);
  });

  it("never resends a transaction after a 5xx", async () => {
    behaviours.a = { status: 503, body: {} };
    await assert.rejects(
      FetchManager.post(pool(), { path: "/v1/chain/send_transaction", data: {} }),
      { message: "ServiceUnavailable" },
    );
    assert.equal(hits.b, undefined);
  });

  it("never resends a transaction after a timeout", async () => {
    behaviours.a = { hang: true };
    await assert.rejects(
      FetchManager.post(pool(), { path: "/v1/chain/push_transaction", data: {}, timeout: 200 }),
      { message: "Timeout" },
    );
    assert.equal(hits.b, undefined);
  });

  it("resends a transaction after a connection error (request never delivered)", async () => {
    const result = await FetchManager.post(pool(`http://127.0.0.1:1,${url("b")}`), {
      path: "/v1/chain/send_transaction",
      data: {},
    });
    assert.deepEqual(result, { from: "b" });
  });

  it("keeps the single-URL string form as one attempt (back-compat)", async () => {
    behaviours.a = { status: 503, body: {} };
    await assert.rejects(FetchManager.get(url("a"), { path: "/x" }), { message: "ServiceUnavailable" });
    assert.equal(hits.b, undefined);
    delete behaviours.a;
    assert.deepEqual(await FetchManager.get(url("a"), { path: "/x", params: { q: "1" } }), { from: "a" });
    assert.equal(hits.a[1].url, "/x?q=1");
  });

  it("asks the next provider, without a cooldown, when tryNextOn accepts the answer", async () => {
    behaviours.a = {
      status: 400,
      body: { code: 400, message: "Unknown Block", error: { code: 3100002, name: "unknown_block_exception" } },
    };
    const p = pool();
    const result = await FetchManager.post(p, {
      path: "/v1/chain/get_block",
      data: { block_num_or_id: 1 },
      tryNextOn: (error) => error.data.body.error.code === 3100002,
    });
    assert.deepEqual(result, { from: "b" });
    assert.equal(p.isCoolingDown(url("a")), false);
  });

  it("works with a single-provider list (back-compat for testnet and local)", async () => {
    assert.deepEqual(await getInfo(pool(url("a"))), { from: "a" });
  });
});
