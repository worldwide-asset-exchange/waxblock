const assert = require("node:assert/strict");
const sinon = require("sinon");
const cron = require("cron");
const globals = require("node-global-storage");
const config = require("../src/config/config");
const tokenHelper = require("../src/helpers/token");
const { createCronJobs } = require("../src/crons");

describe("Token cron startup", () => {
  let jobs;
  let cacheData;
  let cacheStorage;
  let generatedTokens;

  beforeEach(() => {
    jobs = [];
    cacheData = {
      statistics: {
        total_accounts: 1,
        atomicassets: { assets_count: 1 },
        market_data: {},
      },
      producers: [{}],
      proxies: [{}],
      tokens: [],
    };
    cacheStorage = { setItem: sinon.stub().resolves() };
    generatedTokens = [
      { symbol: "WAX", metadata: { logo: "https://example.com/wax.png" } },
    ];

    sinon.stub(config, "network_type").value("mainnet");
    sinon.stub(tokenHelper, "generateTokensRank").resolves(generatedTokens);
    sinon.stub(globals, "get").callsFake((key) => {
      if (key === "cacheData") return cacheData;
      if (key === "cacheStorage") return cacheStorage;
      return {};
    });
    sinon.stub(globals, "set");
    // Exercise the actual startup and refresh callbacks without timers or network requests.
    sinon
      .stub(cron, "CronJob")
      .callsFake(function (schedule, onTick, onComplete, start) {
        const job = {
          schedule,
          onTick,
          start,
          fireOnTick: sinon.spy(() => onTick()),
        };
        jobs.push(job);
        return job;
      });
  });

  afterEach(() => sinon.restore());

  for (const tokens of [undefined, []]) {
    it(`populates ${tokens === undefined ? "a missing" : "an empty"} mainnet token cache immediately`, async () => {
      cacheData.tokens = tokens;
      createCronJobs();

      const job = jobs.find((job) => job.schedule === "0 */6 * * *");
      assert.ok(job, "the six-hour token refresh must be scheduled");
      assert.equal(job.start, true);
      sinon.assert.calledOnce(job.fireOnTick);
      await job.fireOnTick.firstCall.returnValue;

      sinon.assert.calledOnce(tokenHelper.generateTokensRank);
      assert.deepEqual(cacheData.tokens, generatedTokens);
      sinon.assert.calledWithExactly(
        cacheStorage.setItem,
        "cacheData",
        cacheData,
      );
      sinon.assert.calledWithExactly(globals.set, "cacheData", cacheData);
    });
  }

  it("preserves a populated cache on startup and still refreshes on schedule", async () => {
    const existingTokens = [{ symbol: "EXISTING" }];
    cacheData.tokens = existingTokens;
    createCronJobs();

    const job = jobs.find((job) => job.schedule === "0 */6 * * *");
    assert.equal(job.start, true);
    sinon.assert.notCalled(job.fireOnTick);
    sinon.assert.notCalled(tokenHelper.generateTokensRank);
    assert.equal(cacheData.tokens, existingTokens);

    await job.onTick();
    assert.deepEqual(cacheData.tokens, generatedTokens);
    sinon.assert.calledOnce(tokenHelper.generateTokensRank);
  });

  it("does not create or run the mainnet token job on testnet", () => {
    config.network_type = "testnet";
    createCronJobs();

    assert.equal(
      jobs.some((job) => job.schedule === "0 */6 * * *"),
      false,
    );
    sinon.assert.notCalled(tokenHelper.generateTokensRank);
    sinon.assert.notCalled(cacheStorage.setItem);
  });
});
