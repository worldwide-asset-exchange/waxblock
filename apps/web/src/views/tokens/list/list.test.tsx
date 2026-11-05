// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import TokensList from "./list";

vi.mock("../../../app/hooks/useTokenLogos", () => ({
  default: () => () => [],
}));

const systemToken = {
  rank: 102,
  symbol: "WAX",
  account: "eosio.token",
  key: "WAX-wax-eosio.token",
  metadata: { name: "WAX" },
  marketdata: {
    marketcap_usd: 1,
    price_usd: 1,
    change_24hr: 0,
    volume_24hr_usd: 0,
  },
  supply: { circulating: 1, precision: 8 },
};
const otherTokens = Array.from({ length: 101 }, (_, i) => ({
  ...systemToken,
  rank: i + 1,
  symbol: i === 0 ? "WAX" : `TOKEN${i}`,
  account: `contract${i}`,
  key: `TOKEN${i}-wax-contract${i}`,
  metadata: { name: `Token ${i}` },
  marketdata: { ...systemToken.marketdata, volume_24hr_usd: 2000 },
}));
const tokens = [...otherTokens, systemToken];
let container: HTMLDivElement;
let root: Root;
let client: QueryClient;
const rows = () =>
  [
    ...container.querySelectorAll<HTMLTableRowElement>(".token_sec table tr"),
  ].filter((row) => row.cells[0]?.tagName === "TD");

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(["tokens"], tokens);
  client.setQueryData(["tokens_stats"], {
    token_price_usd: 1,
    market_cap_usd: 1,
    tokens_market_cap_usd: 1,
    token_tokens_market_cap_usd: 2,
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <TokensList />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  client.clear();
  vi.unstubAllGlobals();
});

test("puts the low-volume system token first before pagination without mutating cached order", () => {
  expect(container.querySelectorAll(".token_sec table")).toHaveLength(1);
  const displayed = rows();
  expect(displayed).toHaveLength(100);
  expect(
    displayed[0].querySelector('a[href="/tokens/WAX-wax-eosio.token"]'),
  ).not.toBeNull();
  expect(displayed[0].cells[0].textContent).toBe("1");
  expect(
    displayed[1].querySelector('a[href="/account/contract0"]'),
  ).not.toBeNull();
  expect(displayed.map((row) => row.cells[0].textContent)).toEqual(
    Array.from({ length: 100 }, (_, i) => String(i + 1)),
  );
  expect(
    container.querySelectorAll('a[href="/tokens/WAX-wax-eosio.token"]'),
  ).toHaveLength(1);
  expect(client.getQueryData(["tokens"])).toBe(tokens);
  expect(tokens.at(-1)).toBe(systemToken);
  for (const image of container.querySelectorAll(".token_sec .asset_img img")) {
    expect(image.getAttribute("width")).toBe("30");
    expect(image.getAttribute("height")).toBe("30");
  }
});

test("keeps page boundaries and row numbers correct without repeating the system token", async () => {
  const pageTwo = [...container.querySelectorAll(".pagination button")].find(
    (button) => button.textContent === "2",
  )!;
  await act(async () => (pageTwo as HTMLButtonElement).click());
  expect(rows()).toHaveLength(2);
  expect(rows().map((row) => row.cells[0].textContent)).toEqual(["101", "102"]);
  expect(
    container.querySelector('a[href="/tokens/WAX-wax-eosio.token"]'),
  ).toBeNull();
});

test("continues to respect searches that exclude the system token", async () => {
  const input = container.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, "TOKEN50");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(rows()).toHaveLength(1);
  expect(
    rows()[0].querySelector('a[href="/account/contract50"]'),
  ).not.toBeNull();
  expect(
    container.querySelector('a[href="/tokens/WAX-wax-eosio.token"]'),
  ).toBeNull();
});
