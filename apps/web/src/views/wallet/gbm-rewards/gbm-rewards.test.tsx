// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WalletContext } from "../../../app/contexts/wallet-context";
import GbmRewards from "./gbm-rewards";

const { getPolicyRows } = vi.hoisted(() => ({ getPolicyRows: vi.fn() }));
vi.mock("@wharfkit/antelope", () => ({
  APIClient: class {
    v1 = { chain: { get_table_rows: getPolicyRows } };
  },
}));
vi.mock("../../../app/contexts/wallet-context", async () => ({
  WalletContext: (await import("react")).createContext(null),
}));
vi.mock("react-helmet-async", () => ({ Helmet: () => null }));
vi.mock("react-countdown", () => ({ default: () => null }));
vi.mock("../../../app/services/blockchainApiManager", () => ({
  default: {
    getTableRows: async ({ table }) => ({
      rows:
        table === "genesis"
          ? []
          : [
              {
                total_unpaid_voteshare: "1000",
                total_voteshare_change_rate: "0",
                voters_bucket: "100000000",
                total_unpaid_voteshare_last_updated: "2026-01-01T00:00:00",
                last_pervote_bucket_fill: "2026-01-01T00:00:00",
                last_claim_time: "2026-01-01T00:00:00",
              },
            ],
    }),
    getCurrencyStats: async () => ({ WAX: { supply: "1000.00000000 WAX" } }),
  },
}));

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

async function render() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <WalletContext
          value={
            {
              session: { actor: "alice" },
              walletAccount: {
                account: {
                  voter_info: {
                    unpaid_voteshare: "1000",
                    unpaid_voteshare_change_rate: "0",
                    unpaid_voteshare_last_updated: "2026-01-01T00:00:00",
                  },
                },
              },
            } as never
          }
        >
          <GbmRewards />
        </WalletContext>
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  getPolicyRows.mockReset().mockImplementation(async ({ table }) => ({
    rows: [
      table === "global.c"
        ? { annual_rate_bps: 600, voters_bps: 1667 }
        : { rng_rate: 100 },
    ],
  }));
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("reuses policy across remounts for 24 hours, then fetches again", async () => {
  await render();
  expect(getPolicyRows).toHaveBeenCalledTimes(2);
  const fetchedAt = Date.now();
  const dateNow = vi.spyOn(Date, "now");
  dateNow.mockReturnValue(fetchedAt + 60 * 60 * 1000);
  await act(async () => root.render(null));
  await render();
  expect(getPolicyRows).toHaveBeenCalledTimes(2);
  dateNow.mockReturnValue(fetchedAt + 24 * 60 * 60 * 1000 + 1);
  await act(async () => root.render(null));
  await render();
  expect(getPolicyRows).toHaveBeenCalledTimes(4);
});

it("shows an unavailable reward when policy cannot be loaded", async () => {
  getPolicyRows.mockRejectedValue(new Error("RPC unavailable"));
  await render();
  expect(container.textContent?.replace(/\s+/g, " ")).toContain(
    "Next Voter Rewards: Unavailable",
  );
});
