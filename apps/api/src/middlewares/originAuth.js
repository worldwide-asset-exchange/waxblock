const crypto = require("crypto");
const config = require("../config/config");

// Only our Cloudflare zone may use the API. Cloudflare adds this header (Transform Rule) to every request
// for the WaxBlock API hostnames; an origin that sets ORIGIN_AUTH_KEY refuses requests without it, so a
// client that reaches the origin directly, or through another Cloudflare account, is refused.
// Health and liveness stay open for monitors and orchestrators. Unset key = check off (local development).
const HEADER = "x-waxblock-origin-auth";
const OPEN_PATHS = new Set(["/api/v1/health", "/api/v1/test"]);

const isAuthorized = (headers) => {
  if (!config.origin_auth_key) return true;
  const given = Buffer.from(String(headers[HEADER] || ""));
  const expected = Buffer.from(config.origin_auth_key);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

const httpMiddleware = (req, res, next) => {
  if (OPEN_PATHS.has(req.path) || isAuthorized(req.headers)) return next();
  res.status(403).json({ code: 403, message: "Forbidden" });
};

// socket.io allowRequest hook: runs on the handshake, before a connection exists.
const allowSocketRequest = (req, callback) => callback(null, isAuthorized(req.headers));

module.exports = { HEADER, isAuthorized, httpMiddleware, allowSocketRequest };
