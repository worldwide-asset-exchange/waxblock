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
  setNetworkEndpoints.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
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
  const select = container.querySelector<HTMLSelectElement>("#ipfs-endpoint")!;
  expect(select.labels?.[0]?.textContent).toBe("IPFS Endpoint");
  expect(select.options.length).toBe(2);
  expect(select.value).toBe("0");

  await act(async () => {
    select.value = "1";
    select.dispatchEvent(new Event("change", { bubbles: true }));
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
  expect(
    container.querySelector<HTMLSelectElement>("#ipfs-endpoint")?.value,
  ).toBe("1");
});
