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
      new Server(server, { path: "/socket", allowRequest: originAuth.allowSocketRequest });
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
  });
});
