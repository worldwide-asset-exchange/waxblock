const crypto = require("crypto");
const config = require("../config/config");

// Only our Cloudflare zone may use the API. Cloudflare sets this header (Transform Rule) on every request
// for the WaxBlock API hostnames; an origin with ORIGIN_AUTH_KEY refuses requests without it, so a client
// that reaches the origin directly, or through another Cloudflare account, is refused.
// Health and liveness stay open for monitors and orchestrators.
const HEADER = "x-waxblock-origin-auth";
const OPEN_PATHS = new Set(["/api/v1/health", "/api/v1/test"]);
const MIN_KEY_LENGTH = 32;

const digest = (value) => crypto.createHash("sha256").update(String(value)).digest();

const isAuthorized = (headers) => {
  if (!config.origin_auth_key) return true;
  const given = headers[HEADER];
  if (typeof given !== "string" || given.length === 0) return false;
  return crypto.timingSafeEqual(digest(given), digest(config.origin_auth_key));
};

const forbidden = (res) => {
  res.statusCode = 403;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ code: 403, message: "Forbidden" }));
};

// Express: before CORS and the body parsers, so a refused request does no other work.
const httpMiddleware = (req, res, next) => {
  if (OPEN_PATHS.has(req.path) || isAuthorized(req.headers)) return next();
  forbidden(res);
};

// socket.io: allowRequest checks the handshake; engine middleware checks every later polling or upgrade
// request too, so a session id obtained through Cloudflare cannot be reused directly against the origin.
const allowSocketRequest = (req, callback) => callback(null, isAuthorized(req.headers));
const engineMiddleware = (req, res, next) => (isAuthorized(req.headers) ? next() : forbidden(res));

// Production instances must not run without a key by accident. ORIGIN_AUTH=off is the explicit opt-out
// (for example an instance that is not behind the WaxBlock Cloudflare zone).
const startupProblem = () => {
  if (config.origin_auth_key) {
    return config.origin_auth_key.length < MIN_KEY_LENGTH || !/^[\x21-\x7e]+$/.test(config.origin_auth_key)
      ? `ORIGIN_AUTH_KEY must be at least ${MIN_KEY_LENGTH} printable ASCII characters without spaces`
      : null;
  }
  if (process.env.NODE_ENV === "production" && process.env.ORIGIN_AUTH !== "off") {
    return "ORIGIN_AUTH_KEY is not set. Set it, or set ORIGIN_AUTH=off to run without origin authentication";
  }
  return null;
};

module.exports = { HEADER, OPEN_PATHS, isAuthorized, httpMiddleware, allowSocketRequest, engineMiddleware, startupProblem };
