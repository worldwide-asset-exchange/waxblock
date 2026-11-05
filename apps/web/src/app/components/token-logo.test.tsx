// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import TokenLogo from "./token-logo";

let container: HTMLDivElement;
let root: Root;
const candidates = ["waxfp", "antelope", "api", "airdrops"].map(
  (name) => `https://${name}.example/logo.png`,
);
const renderLogo = (
  sources: readonly string[],
  contract = "test.token",
  symbol = "TEST",
) =>
  root.render(
    <TokenLogo contract={contract} symbol={symbol} candidates={sources} />,
  );
const image = () => container.querySelector("img")!;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

test("tries the next source on image failure, ending with a local placeholder", async () => {
  await act(async () => renderLogo(candidates));
  for (const candidate of candidates) {
    expect(image().getAttribute("src")).toBe(candidate);
    await act(async () => image().dispatchEvent(new Event("error")));
  }
  expect(image().getAttribute("src")).toBe("/no-image-token.png");
  await act(async () => image().dispatchEvent(new Event("error")));
  expect(image().getAttribute("src")).toBeNull();
});

test("prefers a newly available higher-priority image without retrying failed URLs", async () => {
  await act(async () => renderLogo([candidates[1], candidates[2]]));
  await act(async () => image().dispatchEvent(new Event("error")));
  expect(image().getAttribute("src")).toBe(candidates[2]);
  await act(async () => renderLogo(candidates));
  expect(image().getAttribute("src")).toBe(candidates[0]);
  await act(async () => image().dispatchEvent(new Event("error")));
  expect(image().getAttribute("src")).toBe(candidates[2]);
});

test("keeps the native WAX fallback and replaces it when sources become available", async () => {
  await act(async () => renderLogo([], "eosio.token", "WAX"));
  expect(image().getAttribute("src")).toBe("/common/images/WAXP@5x-1x1.png");
  await act(async () => renderLogo(candidates, "eosio.token", "WAX"));
  expect(image().getAttribute("src")).toBe(candidates[0]);
});
