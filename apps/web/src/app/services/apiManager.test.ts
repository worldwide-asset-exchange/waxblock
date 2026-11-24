// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const a = "https://a.example";
const b = "https://b.example";
const c = "https://c.example";
const fetchMock = vi.fn();
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
const hosts = () =>
  fetchMock.mock.calls.map(([url]) => new URL(String(url)).origin);

let api: (typeof import("./apiManager"))["default"];

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("VITE_NETWORK_TYPE", "mainnet");
  vi.stubEnv("VITE_API_URL", `${a},${b},${c}`);
  vi.stubGlobal("fetch", fetchMock.mockReset());
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  api = (await import("./apiManager")).default;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ApiManager round robin", () => {
  test("sends consecutive requests to the providers in turn, from a random start", async () => {
    fetchMock.mockImplementation(async () => json([]));
    for (let i = 0; i < 4; i++) await api.getProducers();
    expect(hosts()).toEqual([b, c, a, b]);
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${b}/api/v1/producers`);
  });

  test("retries on the next provider and skips the failed one afterwards", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.startsWith(b) ? json({ error: "down" }, 503) : json([]),
    );
    await expect(api.getProducers()).resolves.toEqual([]);
    expect(hosts()).toEqual([b, c]);
    fetchMock.mockClear();
    await api.getProducers(); // c's turn
    await api.getProducers(); // a's turn
    await api.getProducers(); // b's turn, but b is in cooldown
    expect(hosts()).toEqual([c, a, c]);
  });

  test("retries on the next provider after a network error", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.startsWith(b)) throw new TypeError("Failed to fetch");
      return json({ price: 1 });
    });
    await expect(api.getTokenPrice()).resolves.toEqual({ price: 1 });
    expect(hosts()).toEqual([b, c]);
  });

  test("does not retry a client error", async () => {
    fetchMock.mockImplementation(async () => json({ message: "nope" }, 404));
    await expect(api.getToken("x")).rejects.toThrow("MethodNotFound");
    expect(hosts()).toEqual([b]);
  });

  test("fails after every provider failed", async () => {
    fetchMock.mockImplementation(async () => json({}, 502));
    await expect(api.getTokens()).rejects.toThrow("Server");
    expect(hosts()).toEqual([b, c, a]);
  });
});
