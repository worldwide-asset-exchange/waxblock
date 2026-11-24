// Server-side load balancing across public chain and AtomicAssets providers.
//
// The semantics mirror the web app (apps/web/src/app/utilities/round-robin.ts):
// - Each call to order() returns every endpoint, starting at the next one in turn, so
//   consecutive requests go to different providers.
// - The first starting point is random per process, so replicas do not all start on the
//   first endpoint in the list.
// - An endpoint that failed moves to the end of the order for a cooldown (30 s).
//
// The API adds one thing: an optional BACKUP list. Backups come after every primary that is
// not cooling down, so a backup gets traffic only when every primary failed or is cooling down.
//
// Value format of one environment variable:
//
//   primary[,primary...][;backup[,backup...]]
//
// A single URL is a list with one primary, so existing configurations keep working unchanged.

const DEFAULT_COOLDOWN_MS = 30 * 1000;

const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((endpoint) => endpoint.trim().replace(/\/+$/, ""))
    .filter(Boolean);

/** Parse "a,b;c,d" into { primaries: [a, b], backups: [c, d] }. */
const parseEndpoints = (value) => {
  const text = String(value || "");
  const separator = text.indexOf(";");
  const primaries = [
    ...new Set(splitList(separator < 0 ? text : text.slice(0, separator))),
  ];
  const backups = [
    ...new Set(
      separator < 0 ? [] : splitList(text.slice(separator + 1).replace(/;/g, ",")),
    ),
  ].filter((endpoint) => !primaries.includes(endpoint));
  return { primaries, backups };
};

const createRoundRobin = (
  value,
  { random = Math.random, now = Date.now, cooldownMs = DEFAULT_COOLDOWN_MS } = {},
) => {
  const { primaries, backups } =
    typeof value === "string" || value == null ? parseEndpoints(value) : value;
  const startAt = (list) =>
    list.length ? Math.min(Math.floor(random() * list.length), list.length - 1) : 0;
  const cursors = { primaries: startAt(primaries), backups: startAt(backups) };
  const failedUntil = new Map();

  const rotate = (list, key) => {
    if (!list.length) return [];
    const start = cursors[key];
    cursors[key] = (start + 1) % list.length;
    return list.map((_, offset) => list[(start + offset) % list.length]);
  };

  return {
    primaries,
    backups,
    endpoints: [...primaries, ...backups],
    /**
     * All endpoints for one request, in the order to try them: primaries that are not cooling
     * down (next in turn first), then backups that are not cooling down, then the endpoints in
     * cooldown (primaries first).
     */
    order() {
      const rotatedPrimaries = rotate(primaries, "primaries");
      const rotatedBackups = rotate(backups, "backups");
      const time = now();
      const cooling = (endpoint) => (failedUntil.get(endpoint) || 0) > time;
      return [
        ...rotatedPrimaries.filter((endpoint) => !cooling(endpoint)),
        ...rotatedBackups.filter((endpoint) => !cooling(endpoint)),
        ...rotatedPrimaries.filter(cooling),
        ...rotatedBackups.filter(cooling),
      ];
    },
    /** Move an endpoint to the end of the order until the cooldown ends. */
    markFailed(endpoint) {
      if (primaries.includes(endpoint) || backups.includes(endpoint))
        failedUntil.set(endpoint, now() + cooldownMs);
    },
    isCoolingDown(endpoint) {
      return (failedUntil.get(endpoint) || 0) > now();
    },
  };
};

// One round robin per configured value, shared by every caller in this process, so a provider
// that failed for one request is skipped by the next request too.
const pools = new Map();
const getPool = (value) => {
  const key = String(value || "");
  if (!pools.has(key)) pools.set(key, createRoundRobin(key));
  return pools.get(key);
};
const resetPools = () => pools.clear();

module.exports = {
  DEFAULT_COOLDOWN_MS,
  parseEndpoints,
  createRoundRobin,
  getPool,
  resetPools,
};
