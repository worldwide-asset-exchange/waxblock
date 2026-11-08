// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

let endpoints: typeof import("../utilities/network-endpoints");
let health: typeof import("./endpointHealth");
let fetcher: (typeof import("./fetchManager"))["default"];
let config: (typeof import("../config"))["default"];
const fetchMock = vi.fn();
const first = "https://first.example";
const second = "https://second.example";
const third = "https://third.example";
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  vi.stubEnv("VITE_RPC_ENDPOINTS", `${first},${second},${third}`);
  vi.stubEnv("VITE_HISTORY_ENDPOINTS", `${first},${second},${third}`);
  vi.stubEnv("VITE_LIGHTAPI_ENDPOINTS", `${first},${second},${third}`);
  vi.stubEnv("VITE_ATOMIC_ENDPOINTS", `${first},${second},${third}`);
  vi.stubEnv("VITE_IPFS_ENDPOINTS", `${first},${second},${third}`);
  vi.stubGlobal("fetch", fetchMock.mockReset());
  config = (await import("../config")).default;
  endpoints = await import("../utilities/network-endpoints");
  health = await import("./endpointHealth");
  fetcher = (await import("./fetchManager")).default;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const info = () => ({ chain_id: config.chain_id, head_block_num: 123 });

describe("endpoint health", () => {
  test("accepts the plain-text Light API status and rejects an out-of-sync response", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("OK \n"))
      .mockResolvedValueOnce(
        new Response("OUT_OF_SYNC wax:1200;", { status: 503 }),
      );
    expect((await health.checkEndpointHealth("lightApi", first)).ping).toEqual(
      expect.any(Number),
    );
    expect(
      (await health.checkEndpointHealth("lightApi", second)).ping,
    ).toBeNull();
  });

  test("keeps the active selection usable when storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("Blocked");
      },
      setItem() {
        throw new Error("Blocked");
      },
    });
    endpoints.selectEndpoint("rpc", second);
    endpoints.selectEndpoint("ipfs", `${second}/ipfs/`);
    expect(endpoints.resolveNetworkEndpoints()).toMatchObject({
      rpcEndpoint: second,
      ipfsEndpoint: `${second}/ipfs/`,
    });
  });

  test("rejects a disconnected history service", async () => {
    fetchMock.mockResolvedValue(json({ health: [{ status: "ERROR" }] }));
    expect(
      (await health.checkEndpointHealth("historyV2", first)).ping,
    ).toBeNull();
  });

  test("uses the replacement in memory when storage can be read but not written", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "0",
      setItem() {
        throw new Error("Quota exceeded");
      },
    });
    endpoints.selectEndpoint("rpc", second);
    expect(endpoints.resolveNetworkEndpoints().rpcEndpoint).toBe(second);
  });
  test.each([
    ["rpc", "/v1/chain/get_info"],
    ["lightApi", "/api/status"],
    ["historyV2", "/v2/health"],
    ["atomic", "/health"],
    ["ipfs", "/bafkqaaa"],
  ] as const)(
    "probes %s using its service route and shares in-flight checks",
    async (kind, path) => {
      fetchMock.mockImplementation(async () =>
        kind === "lightApi"
          ? new Response("OK ")
          : json({ ...info(), health: [{ status: "OK" }] }),
      );
      const endpoint = kind === "ipfs" ? `${first}/ipfs/` : `${first}/`;
      const checks = await Promise.all([
        health.checkEndpointHealth(kind, endpoint),
        health.checkEndpointHealth(kind, endpoint),
      ]);
      expect(checks[0].ping).toEqual(expect.any(Number));
      expect(checks[1]).toEqual(checks[0]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe(
        `${first}${kind === "ipfs" ? "/ipfs" : ""}${path}`,
      );
    },
  );

  test("reports HTTP failures, invalid JSON, and a wrong chain as unavailable", async () => {
    fetchMock
      .mockResolvedValueOnce(json({}, 503))
      .mockResolvedValueOnce(new Response("not JSON"))
      .mockResolvedValueOnce(json({ chain_id: "wrong", head_block_num: 123 }));
    for (const endpoint of [first, second, third])
      expect(
        (await health.checkEndpointHealth("rpc", endpoint)).ping,
      ).toBeNull();
  });

  test("reports history coverage and its approximate start date", async () => {
    fetchMock.mockResolvedValue(
      json({
        health: [
          {
            status: "OK",
            service_data: { first_indexed_block: 20, last_indexed_block: 100 },
          },
          {
            status: "OK",
            service_data: {
              head_block_num: 100,
              head_block_time: "2026-01-01T00:00:00Z",
            },
          },
        ],
      }),
    );
    expect(await health.checkEndpointHealth("historyV2", first)).toMatchObject({
      coverage: "partial",
      dataSince: Date.parse("2026-01-01T00:00:00Z") - 40000,
    });
  });

  test("replaces an unhealthy selection with the next healthy endpoint and preserves the full list", async () => {
    fetchMock.mockImplementation(async (url) =>
      url.startsWith(second) ? json(info()) : json({}, 503),
    );
    await health.ensureHealthyEndpoint("rpc");
    expect(endpoints.resolveNetworkEndpoints().rpcEndpoint).toBe(second);
    expect(config.endpoints.default).toBe(second);
    expect(localStorage.getItem("settings_network_rpc")).toBe("1");
    expect(endpoints.getEndpointLists().rpc).toEqual([first, second, third]);
  });

  test("wraps around and leaves the selection intact when every endpoint fails", async () => {
    endpoints.selectEndpoint("rpc", third);
    fetchMock.mockResolvedValue(json({}, 503));
    await health.ensureHealthyEndpoint("rpc");
    expect(endpoints.resolveNetworkEndpoints().rpcEndpoint).toBe(third);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${third}/v1/chain/get_info`,
      `${first}/v1/chain/get_info`,
      `${second}/v1/chain/get_info`,
    ]);
  });

  test("does not overwrite a manual selection made during a probe", async () => {
    let finish: (response: Response) => void;
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockImplementation(async () => json(info()));
    const pending = health.ensureHealthyEndpoint("rpc");
    endpoints.selectEndpoint("rpc", third);
    finish!(json({}, 503));
    await pending;
    expect(endpoints.resolveNetworkEndpoints().rpcEndpoint).toBe(third);
  });
});

describe("request fallback", () => {
  test.each([
    ["rpc", "/v1/chain/get_account", "rpcEndpoint", "rpc"],
    ["lightApi", "/api/balances/wax/test", "lightApiEndpoint", "lightapi"],
    ["historyV2", "/v2/history/get_actions", "historyV2Endpoint", "historyv2"],
    ["atomic", "/atomicassets/v1/assets", "atomicEndpoint", "atomic"],
  ] as const)(
    "retries %s reads and persists only a working replacement",
    async (kind, path, field, storageKey) => {
      const supplied = { [first]: 100 };
      fetchMock.mockImplementation(async (url) => {
        if (url.startsWith(first)) throw new TypeError("Network failure");
        if (url === `${second}${path}`) return json({ result: "ok" });
        return kind === "lightApi"
          ? new Response("OK ")
          : json({ ...info(), health: [{ status: "OK" }] });
      });
      const response =
        kind === "rpc"
          ? await fetcher.post(supplied, {
              path,
              data: { account_name: "test" },
            })
          : await fetcher.get(supplied, { path });
      expect(response).toEqual({ result: "ok" });
      expect(endpoints.resolveNetworkEndpoints()[field]).toBe(second);
      expect(localStorage.getItem(`settings_network_${storageKey}`)).toBe("1");
      expect(supplied).toEqual({ [first]: 100 });
      fetchMock.mockClear();
      await fetcher.get(supplied, { path });
      expect(fetchMock.mock.calls[0][0]).toBe(`${second}${path}`);
    },
  );

  test("skips unhealthy candidates and retries the original query and body", async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url.startsWith(first)) return json({}, 503);
      if (url.startsWith(second)) return json({}, 502);
      return json(info());
    });
    await fetcher.post(first, {
      path: "/v1/chain/get_account",
      params: { test: "a b" },
      data: { account_name: "test" },
    });
    expect(endpoints.resolveNetworkEndpoints().rpcEndpoint).toBe(third);
    expect(fetchMock.mock.calls[fetchMock.mock.calls.length - 1]).toMatchObject(
      [
        `${third}/v1/chain/get_account?test=a+b`,
        { method: "POST", body: '{"account_name":"test"}' },
      ],
    );
  });

  test.each([400, 404, 401])("does not rotate for HTTP %s", async (status) => {
    fetchMock.mockResolvedValue(json({}, status));
    await expect(
      fetcher.get(first, { path: "/v1/chain/get_account" }),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(endpoints.resolveNetworkEndpoints().rpcEndpoint).toBe(first);
  });

  test("does not rotate for a chain assertion or retry a transaction", async () => {
    fetchMock.mockImplementation(async () =>
      json({ error: { name: "assert_exception" } }, 500),
    );
    await expect(
      fetcher.post(first, { path: "/v1/chain/get_account" }),
    ).rejects.toThrow("Server");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockClear();
    await expect(
      fetcher.post(first, { path: "/v1/chain/push_transaction" }),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("fails once per candidate without persisting a replacement if all reads fail", async () => {
    fetchMock.mockImplementation(async (url) =>
      url.endsWith("get_info") ? json(info()) : json({}, 503),
    );
    await expect(
      fetcher.get(first, { path: "/v1/chain/get_account" }),
    ).rejects.toThrow("Server");
    expect(
      fetchMock.mock.calls.filter(([url]) => url.endsWith("get_account")),
    ).toHaveLength(3);
    expect(endpoints.resolveNetworkEndpoints().rpcEndpoint).toBe(first);
  });

  test("cancellation never probes alternatives or changes the selection", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(async () => {
      controller.abort();
      throw controller.signal.reason;
    });
    await expect(
      fetcher.get(first, {
        path: "/v1/chain/get_info",
        signal: controller.signal,
      }),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(endpoints.resolveNetworkEndpoints().rpcEndpoint).toBe(first);
  });

  test("does not overwrite a newer selection when a fallback request finishes", async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url.startsWith(first)) throw new TypeError("Offline");
      if (url.endsWith("get_account")) endpoints.selectEndpoint("rpc", third);
      return json(info());
    });
    await fetcher.get(first, { path: "/v1/chain/get_account" });
    expect(endpoints.resolveNetworkEndpoints().rpcEndpoint).toBe(third);
  });

  test("honors a zero retry budget", async () => {
    fetchMock.mockRejectedValue(new TypeError("Offline"));
    await expect(
      fetcher.get(first, { path: "/v1/chain/get_info", retries: 0 }),
    ).rejects.toThrow("Offline");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("aborts timed out fetches before retrying another endpoint", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((url, init) =>
      url.startsWith(first)
        ? new Promise((_resolve, reject) =>
            init.signal.addEventListener("abort", () =>
              reject(init.signal.reason),
            ),
          )
        : Promise.resolve(json(info())),
    );
    const pending = fetcher.get(first, {
      path: "/v1/chain/get_info",
      timeout: 10,
    });
    await vi.advanceTimersByTimeAsync(11);
    await expect(pending).resolves.toEqual(info());
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(endpoints.resolveNetworkEndpoints().rpcEndpoint).toBe(second);
  });

  test("localnet does not probe or replace configured endpoints", async () => {
    config.network_type = "localnet";
    fetchMock.mockRejectedValue(new TypeError("Offline"));
    await health.ensureHealthyEndpoint("rpc");
    await expect(
      fetcher.get(first, { path: "/v1/chain/get_info" }),
    ).rejects.toThrow("Offline");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("settings_network_rpc")).toBeNull();
  });
});
