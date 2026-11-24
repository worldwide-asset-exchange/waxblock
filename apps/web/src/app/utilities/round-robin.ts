// Client-side load balancing across the WaxBlock API providers.
//
// Each call to order() returns every endpoint, starting at the next one in turn, so consecutive
// requests go to different providers. The first starting point is random, so the browsers of
// different visitors do not all start on the first endpoint in the list. An endpoint that failed
// moves to the end of the order for a cooldown, and the caller tries the next endpoint.

export interface RoundRobin {
  readonly endpoints: readonly string[];
  /** All endpoints for one request: the next one in turn first, endpoints in cooldown last. */
  order(): string[];
  /** Move an endpoint to the end of the order until the cooldown ends. */
  markFailed(endpoint: string): void;
}

export interface RoundRobinOptions {
  random?: () => number;
  now?: () => number;
  cooldownMs?: number;
}

export const createRoundRobin = (
  endpoints: readonly (string | null | undefined)[],
  {
    random = Math.random,
    now = Date.now,
    cooldownMs = 30_000,
  }: RoundRobinOptions = {},
): RoundRobin => {
  const list = [
    ...new Set(endpoints.filter((endpoint): endpoint is string => !!endpoint)),
  ];
  let cursor = list.length
    ? Math.min(Math.floor(random() * list.length), list.length - 1)
    : 0;
  const failedUntil = new Map<string, number>();

  return {
    endpoints: list,
    order() {
      if (!list.length) return [];
      const start = cursor;
      cursor = (cursor + 1) % list.length;
      const rotated = list.map(
        (_, offset) => list[(start + offset) % list.length],
      );
      const time = now();
      const cooling = (endpoint: string) =>
        (failedUntil.get(endpoint) ?? 0) > time;
      return [
        ...rotated.filter((endpoint) => !cooling(endpoint)),
        ...rotated.filter(cooling),
      ];
    },
    markFailed(endpoint: string) {
      if (list.includes(endpoint))
        failedUntil.set(endpoint, now() + cooldownMs);
    },
  };
};
