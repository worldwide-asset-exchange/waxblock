const fetch = require("node-fetch");

class CustomError extends Error {
    constructor(data = null, ...args) {
        super(...args);
        this.data = data;
    }
}

// Some public providers answer 403 to a bare or scripting user agent. Send a stable, honest one.
const USER_AGENT = "waxblock-api/1.0 (+https://github.com/worldwide-asset-exchange/waxblock)";

// Per-attempt timeout for requests to a provider list (see services/roundRobin.js).
// Measured 2026-11-24 from outside AWS: every chain read the API makes (get_info, get_block,
// get_table_rows) answers in less than 1.5 s on every recommended provider. 8 s is far above
// that, so a slow but healthy provider is not marked failed, and it keeps one dead provider from
// stalling the 1 s block poller or the health check for long. Expensive AtomicAssets counts pass
// their own, longer timeout.
const ATTEMPT_TIMEOUT_MS = 8 * 1000;
// Single-URL requests to third parties (CoinGecko, bp.json hosts, ...) keep their old timeout.
const SINGLE_TIMEOUT_MS = 10 * 1000;

// Paths that broadcast a transaction. The API does not call any of them today; the rule is here
// so that a future caller cannot broadcast the same transaction twice.
const WRITE_PATH = /^\/v1\/chain\/(push_transaction|push_transactions|send_transaction|send_transaction2)\b/;
// Network errors where the request certainly did not reach the provider, so a resend is safe.
const NOT_DELIVERED_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "EHOSTUNREACH", "ENETUNREACH"]);

const isPool = (endpoint) => endpoint && typeof endpoint.order === "function";

const errorForStatus = (status) => {
    switch (status) {
        case 500: return "Server";
        case 403: return "Forbidden";
        case 404: return "MethodNotFound";
        case 400: return "BadRequest";
        case 408:
        case 504: return "Timeout";
        case 429: return "TooManyRequests";
        case 503: return "ServiceUnavailable";
        default: return "Unknown";
    }
};

// One request to one endpoint. Resolves with the JSON body of a 200 answer; otherwise rejects
// with the same CustomError messages as before ("Timeout", "Server", "NetworkRequestFailed", ...).
// error.data.status is the HTTP status, error.data.network is true when no answer arrived.
const fetchOnce = async (endpoint, params) => {
    let url = `${endpoint}${params.path || ""}`;
    if (params.params && Object.keys(params.params).length) {
        url += `${url.includes("?") ? "&" : "?"}${new URLSearchParams({...params.params})}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), params.timeout);
    try {
        let res;
        try {
            res = await fetch(url, {
                method: params.method,
                body: params.body,
                headers: {"User-Agent": USER_AGENT, ...params.headers},
                signal: controller.signal,
            });
        } catch (error) {
            if (error && error.name === "AbortError") {
                throw new CustomError({network: true, timeout: true}, "Timeout");
            }
            throw new CustomError({network: true, code: error && error.code}, "NetworkRequestFailed");
        }

        const {status} = res;
        if (status === 200) {
            try {
                return await res.json();
            } catch (error) {
                if (error && error.name === "AbortError") {
                    throw new CustomError({network: true, timeout: true}, "Timeout");
                }
                // A 200 that is not JSON (an HTML error page, a captive proxy) is not an answer.
                throw new CustomError({res, status, invalidJson: true}, "Unknown");
            }
        }
        if (![400, 403, 404, 408, 429, 500, 503, 504].includes(status)) console.log(status);

        let body = null;
        try {
            body = await res.json();
        } catch {
            body = null;
        }
        if (status === 500) {
            const {response} = body || {};
            const {errorFull} = response || {errorFull: {}};
            const {file, line, message} = errorFull || {};
            throw new CustomError({res, status, body, file, line, message}, "Server");
        }
        throw new CustomError({res, status, body}, errorForStatus(status));
    } finally {
        clearTimeout(timer);
    }
};

// A chain node answers a failed assertion (unknown key, missing table, ...) with HTTP 500 and a
// structured `error` object. That describes the request, not an unhealthy node, so it is an answer.
const isChainAssertion = (error, path) => {
    const body = error.data && error.data.body;
    return (
        /^\/v1\//.test(path || "") &&
        body &&
        body.error &&
        typeof body.error === "object" &&
        typeof body.error.code === "number" &&
        body.error.code !== 0
    );
};

/** True when the request should be sent to the next provider after this error. */
const shouldFailOver = (error, params) => {
    const data = (error && error.data) || {};
    if (WRITE_PATH.test(params.path || "")) {
        // Writes: resend only when the request certainly never reached the provider.
        return !!data.network && !data.timeout && NOT_DELIVERED_CODES.has(data.code);
    }
    if (data.network) return true; // network error or timeout
    if (data.invalidJson) return true;
    const status = data.status;
    if (status === 408 || status === 429) return true;
    if (status >= 500) return !isChainAssertion(error, params.path);
    return false; // other 4xx: the provider answered
};

const FetchManager = {
    get(endpoint, params = {}) {
        return this.fetch(endpoint, {
            ...params,
            method: "GET",
            headers: {...params.headers},
        });
    },
    post(endpoint, params = {}) {
        return this.fetch(endpoint, {
            ...params,
            method: "POST",
            body: JSON.stringify(params.data),
            headers: {"Content-Type": "application/json", ...params.headers},
        });
    },
    /**
     * `endpoint` is a URL string (one attempt, as before) or a provider list from
     * services/roundRobin.js (round robin with failover).
     * params.tryNextOn(error), optional: return true to ask the next provider after an answer
     * that is not a failure (for example a block that a slightly lagging provider has not seen).
     */
    async fetch(endpoint, params = {}) {
        if (!isPool(endpoint)) {
            return fetchOnce(endpoint, {...params, timeout: params.timeout || SINGLE_TIMEOUT_MS});
        }

        const attemptParams = {...params, timeout: params.timeout || ATTEMPT_TIMEOUT_MS};
        const order = endpoint.order();
        if (!order.length) throw new CustomError({}, "NetworkRequestFailed");
        let lastError;
        for (const candidate of order) {
            try {
                return await fetchOnce(candidate, attemptParams);
            } catch (error) {
                lastError = error;
                if (shouldFailOver(error, attemptParams)) {
                    endpoint.markFailed(candidate);
                    continue;
                }
                // An answer that only says "this provider does not have it yet" (see getBlock):
                // ask the next provider, but do not put this healthy one in cooldown.
                if (params.tryNextOn && params.tryNextOn(error)) continue;
                throw error;
            }
        }
        throw lastError;
    },
};

module.exports = FetchManager;
module.exports.CustomError = CustomError;
module.exports.shouldFailOver = shouldFailOver;
module.exports.ATTEMPT_TIMEOUT_MS = ATTEMPT_TIMEOUT_MS;
module.exports.USER_AGENT = USER_AGENT;
