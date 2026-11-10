const express = require("express");
const fetch = require("node-fetch");
const globals = require("node-global-storage");
const config = require("../../../config/config");

const router = express.Router();

// Health for load balancers and orchestrators.
// 200 only when (1) the configured chain RPC answers get_info within the timeout and its head block is
// recent, and (2) the slow-changing caches the explorer depends on are populated. Otherwise 503.
// The upstream probe is cached for CHECK_TTL_MS so a monitor polling every few seconds from many
// locations cannot multiply load on the chain endpoint.
const CHECK_TTL_MS = 10 * 1000;
const RPC_TIMEOUT_MS = 5 * 1000;
const MAX_HEAD_AGE_S = Number(process.env.HEALTH_MAX_HEAD_AGE_SECONDS || 60);

let last = { at: 0, result: null };

async function probeChain() {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.endpoints.default}/v1/chain/get_info`, { signal: controller.signal });
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

router.get("/health", async function (req, res) {
  if (Date.now() - last.at > CHECK_TTL_MS) {
    last = { at: Date.now(), result: await probeChain() };
  }
  const cacheData = globals.get("cacheData") || {};
  // The token list is built only on mainnet (crons/index.js: Alcor mainnet markets), so testnet
  // must not wait for it: it would stay 503 forever.
  const tokensRequired = config.network_type === "mainnet";
  const caches = {
    producers: Array.isArray(cacheData.producers) && cacheData.producers.length > 0,
    tokens: tokensRequired ? Array.isArray(cacheData.tokens) && cacheData.tokens.length > 0 : "not used",
  };
  const ok = last.result.ok && caches.producers && caches.tokens !== false;
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "unavailable",
    network: config.network_type,
    version: process.env.APP_VERSION || "dev",
    chain: last.result,
    caches,
  });
});

module.exports = router;
