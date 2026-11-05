// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import config from "../config";
import ApiManager from "../services/apiManager";
import { TOKEN_LOGO_REGISTRIES } from "../services/tokenLogoSources";
import useTokenLogos from "./useTokenLogos";

vi.mock("../services/apiManager", () => ({ default: { getTokens: vi.fn() } }));

let container: HTMLDivElement;
let root: Root;
let client: QueryClient;
const originalNetwork = config.network_type;
const token = {
  contract: "test.token",
  symbol: "TEST",
  logo: "https://waxfp.example/logo.png",
};
const apiToken = {
  account: "test.token",
  symbol: "TEST",
  chain: "wax",
  metadata: { logo: "https://api.example/logo.png" },
};

const Probe = () => {
  const getLogos = useTokenLogos();
  return <output>{JSON.stringify(getLogos("test.token", "TEST"))}</output>;
};
const readLogos = () =>
  JSON.parse(container.querySelector("output")!.textContent!);
const flushQueries = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
const renderProbes = (count = 1) =>
  act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        {Array.from({ length: count }, (_, i) => (
          <Probe key={i} />
        ))}
      </QueryClientProvider>,
    ),
  );

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.mocked(ApiManager.getTokens).mockReset();
  vi.mocked(ApiManager.getTokens).mockResolvedValue([apiToken]);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  config.network_type = "mainnet";
});

afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  config.network_type = originalNetwork;
  vi.unstubAllGlobals();
});

test("shares registry requests and preserves priority when WAXFP resolves last", async () => {
  let completeWaxfp!: (response: Response) => void;
  const waxfp = new Promise<Response>((resolve) => {
    completeWaxfp = resolve;
  });
  const fetchMock = vi.fn((url: string) => {
    if (url === TOKEN_LOGO_REGISTRIES.waxfp) return waxfp;
    if (url === TOKEN_LOGO_REGISTRIES.antelope)
      return Promise.resolve(Response.json([token]));
    return Promise.resolve(
      Response.json([
        {
          account: token.contract,
          symbol: token.symbol,
          chain: "wax",
          logo: "https://airdrops.example/logo.png",
        },
      ]),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  await renderProbes(2);
  await flushQueries();
  expect(readLogos()).toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(ApiManager.getTokens).toHaveBeenCalledTimes(1);

  completeWaxfp(Response.json([token]));
  await flushQueries();
  expect(readLogos()).toEqual([
    token.logo,
    "https://raw.githubusercontent.com/blocdraig/antelope-tokens/main/wax/logos/test.token_test.png",
    apiToken.metadata.logo,
    "https://airdrops.example/logo.png",
  ]);
});

test("falls through failed registries and a failed API to eos-airdrops", async () => {
  vi.mocked(ApiManager.getTokens).mockRejectedValue(
    new Error("Backend unavailable"),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url === TOKEN_LOGO_REGISTRIES.eosAirdrops
          ? Response.json([
              {
                account: token.contract,
                symbol: token.symbol,
                chain: "wax",
                logo: "https://airdrops.example/logo.png",
              },
            ])
          : new Response("unavailable", { status: 503 }),
      ),
    ),
  );
  await renderProbes();
  await flushQueries();
  expect(readLogos()).toEqual(["https://airdrops.example/logo.png"]);
});

test("does not use mainnet registry logos or mainnet backend entries on testnet", async () => {
  config.network_type = "testnet";
  const network = config.network;
  config.network = "waxtest";
  vi.stubGlobal("fetch", vi.fn());
  try {
    await renderProbes();
    await flushQueries();
    expect(fetch).not.toHaveBeenCalled();
    expect(readLogos()).toEqual([]);
  } finally {
    config.network = network;
  }
});
