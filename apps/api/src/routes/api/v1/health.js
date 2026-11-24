const express = require("express");
const fetch = require("node-fetch");
const globals = require("node-global-storage");
const config = require("../../../config/config");
const { getPool } = require("../../../services/roundRobin");
const { USER_AGENT } = require("../../../services/fetchManager");

const router = express.Router();

// Health for load balancers and orchestrators.
// 200 only when (1) the configured chain RPC answers get_info within the timeout and its head block is
// recent, and (2) the slow-changing caches the explorer depends on are populated (tokens: mainnet only). Otherwise 503.
// The upstream probe is cached for CHECK_TTL_MS so a monitor polling every few seconds from many
// locations cannot multiply load on the chain endpoint.
const CHECK_TTL_MS = 10 * 1000;
const RPC_TIMEOUT_MS = 5 * 1000;
const MAX_HEAD_AGE_S = Number(process.env.HEALTH_MAX_HEAD_AGE_SECONDS || 60);

let last = { at: 0, result: null };

// BLOCKCHAIN_DEFAULT may hold a provider list (services/roundRobin.js). The probe tries the
// providers in round-robin order within one overall RPC_TIMEOUT_MS budget. A provider that does not
// answer, answers with an error, or serves a stale head block is marked failed (skipped for 30 s by
// every caller) and the next one is tried. The API is healthy when at least one provider is.
async function probeOne(endpoint, timeoutMs) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${endpoint}/v1/chain/get_info`, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return { ok: false, error: `get_info HTTP ${res.status}` };
    const info = await res.json();
    const headAge = Math.round((Date.now() - Date.parse(info.head_block_time + "Z")) / 1000);
    return {
      ok: headAge <= MAX_HEAD_AGE_S,
      head_block_num: info.head_block_num,
      head_block_age_seconds: headAge,
      latency_ms: Date.now() - started,
    };
  } catch (err) {
    return { ok: false, error: err.name === "AbortError" ? "get_info timeout" : "get_info unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

async function probeChain() {
  const pool = getPool(config.endpoints.default);
  const deadline = Date.now() + RPC_TIMEOUT_MS;
  const order = pool.order();
  let result = { ok: false, error: "no RPC provider configured" };
  for (const endpoint of order) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    result = { ...(await probeOne(endpoint, remaining)), provider: new URL(endpoint).host };
    if (result.ok) break;
    pool.markFailed(endpoint);
  }
  return { ...result, providers: order.length };
}

router.get("/health", async function (req, res) {
  if (Date.now() - last.at > CHECK_TTL_MS) {
    last = { at: Date.now(), result: await probeChain() };
  }
  const cacheData = globals.get("cacheData") || {};
  const caches = {
    producers: Array.isArray(cacheData.producers) && cacheData.producers.length > 0,
    // The tokens cache is filled by a mainnet-only cron (crons/index.js), so it is always empty on
    // other networks. Require it only on mainnet, or every testnet origin reports 503 forever.
    tokens:
      config.network_type !== "mainnet" ||
      (Array.isArray(cacheData.tokens) && cacheData.tokens.length > 0),
  };
  const ok = last.result.ok && caches.producers && caches.tokens;
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "unavailable",
    network: config.network_type,
    version: process.env.APP_VERSION || "dev",
    chain: last.result,
    caches,
  });
});

module.exports = router;
