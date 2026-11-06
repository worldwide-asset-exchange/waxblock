const http = require("http");
const request = require("supertest");
const { expect } = require("chai");
const globals = require("node-global-storage");
const { Server } = require("socket.io");
const { io: ioClient } = require("socket.io-client");
const config = require("../src/config/config");
const originAuth = require("../src/middlewares/originAuth");
const app = require("../src/app");

const KEY = "test-origin-key-0123456789abcdef";

describe("origin authentication (ORIGIN_AUTH_KEY)", function () {
  const original = config.origin_auth_key;
  before(() => globals.set("cacheData", { producers: [{ owner: "a" }], proxies: [], tokens: [] }));
  afterEach(() => (config.origin_auth_key = original));

  describe("HTTP", function () {
    it("lets every request through when no key is set", async function () {
      config.origin_auth_key = "";
      const res = await request(app).get("/api/v1/producers");
      expect(res.status).to.equal(200);
    });

    it("refuses an API request without the header", async function () {
      config.origin_auth_key = KEY;
      const res = await request(app).get("/api/v1/producers");
      expect(res.status).to.equal(403);
    });

    it("refuses an API request with a wrong header", async function () {
      config.origin_auth_key = KEY;
      const res = await request(app).get("/api/v1/producers").set(originAuth.HEADER, KEY.slice(0, -1) + "x");
      expect(res.status).to.equal(403);
    });

    it("accepts an API request with the right header", async function () {
      config.origin_auth_key = KEY;
      const res = await request(app).get("/api/v1/producers").set(originAuth.HEADER, KEY);
      expect(res.status).to.equal(200);
    });

    for (const path of ["/api/v1/health/", "/API/V1/PRODUCERS", "/api/v1//producers", "/api/v1/health/../producers", "/api/v1/%68ealth", "/api/v1/cache", "/nonexistent"]) {
      it(`refuses ${path} without the header`, async function () {
        config.origin_auth_key = KEY;
        const res = await request(app).get(path);
        expect(res.status).to.equal(403);
      });
    }

    it("refuses a CORS preflight without the header", async function () {
      config.origin_auth_key = KEY;
      const res = await request(app).options("/api/v1/producers").set("Origin", "https://example.org").set("Access-Control-Request-Method", "GET");
      expect(res.status).to.equal(403);
    });

    it("refuses a duplicated header", async function () {
      config.origin_auth_key = KEY;
      const res = await request(app).get("/api/v1/producers").set(originAuth.HEADER, [KEY, KEY]);
      expect(res.status).to.equal(403);
    });

    it("keeps /api/v1/test open for liveness checks", async function () {
      config.origin_auth_key = KEY;
      const res = await request(app).get("/api/v1/test");
      expect(res.status).to.equal(200);
    });
  });

  describe("socket.io handshake", function () {
    let server, port;
    before(function (done) {
      server = http.createServer();
      const io = new Server(server, { path: "/socket", allowRequest: originAuth.allowSocketRequest, serveClient: false });
      io.engine.use(originAuth.engineMiddleware);
      server.listen(0, () => {
        port = server.address().port;
        done();
      });
    });
    after((done) => server.close(done));

    const connect = (headers) =>
      new Promise((resolve) => {
        const s = ioClient(`http://127.0.0.1:${port}`, { path: "/socket", transports: ["websocket"], extraHeaders: headers, reconnection: false });
        s.on("connect", () => { s.close(); resolve("connected"); });
        s.on("connect_error", () => { s.close(); resolve("refused"); });
      });

    it("refuses a WebSocket without the header", async function () {
      config.origin_auth_key = KEY;
      expect(await connect({})).to.equal("refused");
    });

    it("accepts a WebSocket with the right header", async function () {
      config.origin_auth_key = KEY;
      expect(await connect({ [originAuth.HEADER]: KEY })).to.equal("connected");
    });

    const get = (path, headers = {}) =>
      new Promise((resolve, reject) => {
        http.get({ host: "127.0.0.1", port, path, headers }, (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => resolve({ status: res.statusCode, body }));
        }).on("error", reject);
      });

    it("refuses a polling handshake without the header", async function () {
      config.origin_auth_key = KEY;
      expect((await get("/socket/?EIO=4&transport=polling")).status).to.not.equal(200);
    });

    it("refuses a session id reused without the header", async function () {
      config.origin_auth_key = KEY;
      const hs = await get("/socket/?EIO=4&transport=polling", { [originAuth.HEADER]: KEY });
      expect(hs.status).to.equal(200);
      const sid = JSON.parse(hs.body.slice(1)).sid;
      expect((await get(`/socket/?EIO=4&transport=polling&sid=${sid}`)).status).to.equal(403);
    });

    it("does not serve the client library", async function () {
      config.origin_auth_key = "";
      expect((await get("/socket/socket.io.js")).status).to.not.equal(200);
    });
  });

  describe("startup check", function () {
    const env = { NODE_ENV: process.env.NODE_ENV, ORIGIN_AUTH: process.env.ORIGIN_AUTH };
    afterEach(() => {
      for (const [k, v] of Object.entries(env)) v === undefined ? delete process.env[k] : (process.env[k] = v);
    });

    it("refuses to start in production without a key", function () {
      config.origin_auth_key = "";
      process.env.NODE_ENV = "production";
      delete process.env.ORIGIN_AUTH;
      expect(originAuth.startupProblem()).to.match(/ORIGIN_AUTH_KEY is not set/);
    });

    it("starts in production without a key when ORIGIN_AUTH=off", function () {
      config.origin_auth_key = "";
      process.env.NODE_ENV = "production";
      process.env.ORIGIN_AUTH = "off";
      expect(originAuth.startupProblem()).to.equal(null);
    });

    it("refuses a short key", function () {
      config.origin_auth_key = "short";
      expect(originAuth.startupProblem()).to.match(/at least 32/);
    });

    it("accepts a 32-character key", function () {
      config.origin_auth_key = KEY;
      expect(originAuth.startupProblem()).to.equal(null);
    });
  });
});
