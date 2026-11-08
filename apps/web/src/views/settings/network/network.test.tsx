// @vitest-environment happy-dom
import { act, type ContextType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { WalletContext } from "../../../app/contexts/wallet-context";
import { getMediaUrl } from "../../../app/utilities/media";
import { resolveNetworkEndpoints } from "../../../app/utilities/network-endpoints";
import Network from "./network";

vi.mock("../../../app/contexts/wallet-context", async () => {
  const { createContext } = await import("react");
  return { WalletContext: createContext(null) };
});
vi.mock("../../../app/config", () => ({
  default: {
    network_type: "mainnet",
    endpoints: {
      default: "https://rpc.example",
      historyV2: {},
      lightapi: {},
      nfts: { atomicassets: "https://atomic.example" },
    },
  },
}));

let container: HTMLDivElement;
let root: Root;
const setNetworkEndpoints = vi.fn();

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubEnv(
    "VITE_IPFS_ENDPOINTS",
    "https://ipfs.filebase.io/ipfs/,https://gateway.pinata.cloud/ipfs/",
  );
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            chain_id: "test-chain",
            head_block_num: 123,
            health: [{ status: "OK" }],
          }),
        ),
    ),
  );
  setNetworkEndpoints.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

test("shows latency and tracks an automatic endpoint change", async () => {
  const { selectEndpoint } =
    await import("../../../app/utilities/network-endpoints");
  await act(async () => root.render(<Network />));
  const select = container.querySelector<HTMLButtonElement>("#ipfs-endpoint")!;
  expect(select.textContent).toMatch(/\d+ ms/);
  await act(async () =>
    selectEndpoint("ipfs", "https://gateway.pinata.cloud/ipfs/"),
  );
  expect(select.textContent).toContain("gateway.pinata.cloud");
});

test("updates the dropdown and saved selection when its selected endpoint fails", async () => {
  vi.stubEnv(
    "VITE_RPC_ENDPOINTS",
    "https://offline.example,https://healthy.example",
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (url: string) =>
        new Response(
          JSON.stringify({
            chain_id: "test-chain",
            head_block_num: 123,
          }),
          { status: url.startsWith("https://offline.example") ? 503 : 200 },
        ),
    ),
  );
  await act(async () => root.render(<Network />));
  const select = container.querySelector<HTMLButtonElement>("#rpc-endpoint")!;
  expect(select.textContent).toContain("healthy.example");
  expect(select.textContent).toMatch(/\d+ ms/);
  await act(async () => select.click());
  const options = document.querySelectorAll('[role="option"]');
  expect(options[0].textContent).toContain("Unavailable");
  expect(
    options[0].querySelector(".endpoint-metrics.endpoint-unavailable"),
  ).not.toBeNull();
  expect(options[1].textContent).toMatch(/\d+ ms/);
  expect(localStorage.getItem("settings_network_rpc")).toBe("1");
});

test("reports that no healthy alternatives are available", async () => {
  vi.stubEnv("VITE_RPC_ENDPOINTS", "https://all-down.example");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("Offline", { status: 503 })),
  );
  await act(async () => root.render(<Network />));
  expect(container.textContent).toContain("No healthy endpoints available.");
  expect(container.querySelector("#rpc-endpoint")?.textContent).toContain(
    "all-down.example",
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("changing the IPFS selection updates media URLs and persists across remounts", async () => {
  const renderSettings = () => {
    const wallet = {
      networkEndpoints: resolveNetworkEndpoints(),
      setNetworkEndpoints,
    } as unknown as ContextType<typeof WalletContext>;
    root.render(
      <WalletContext.Provider value={wallet}>
        <Network />
      </WalletContext.Provider>,
    );
  };

  await act(async () => renderSettings());
  const select = container.querySelector<HTMLButtonElement>("#ipfs-endpoint")!;
  expect(select.labels?.[0]?.textContent).toBe("IPFS Endpoint");
  expect(select.textContent).toContain("ipfs.filebase.io");
  await act(async () => select.click());
  const options = document.querySelectorAll<HTMLElement>('[role="option"]');
  expect(options.length).toBe(2);

  await act(async () => {
    options[1].click();
  });

  expect(setNetworkEndpoints).toHaveBeenCalledWith(
    expect.objectContaining({
      ipfsEndpoint: "https://gateway.pinata.cloud/ipfs/",
    }),
  );
  expect(getMediaUrl("ipfs://example-cid/image.png")).toBe(
    "https://gateway.pinata.cloud/ipfs/example-cid/image.png",
  );

  await act(async () => root.render(null));
  await act(async () => renderSettings());
  expect(container.querySelector("#ipfs-endpoint")?.textContent).toContain(
    "gateway.pinata.cloud",
  );
});
