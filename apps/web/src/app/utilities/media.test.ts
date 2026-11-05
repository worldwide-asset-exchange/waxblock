// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getMediaUrl } from "./media";
import { getImage, getVideo } from "./nft";
import { getTokenLogo } from "./tokens";
import {
  getEndpointLists,
  getIpfsEndpoints,
  resolveNetworkEndpoints,
  saveIndex,
} from "./network-endpoints";

const cid = "QmYwAPJzv5CZsnAzt8auVZRnGiRA2r3wsYCW7twGmD5JJ5";
const gateway = "https://ipfs.filebase.io/ipfs/";

beforeEach(() => {
  vi.stubEnv("VITE_IPFS_ENDPOINTS", undefined);
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("IPFS endpoint selection", () => {
  test.each([undefined, "", " , , "])(
    "uses the public default when the list is missing or empty: %s",
    (value) => {
      vi.stubEnv("VITE_IPFS_ENDPOINTS", value);
      expect(getIpfsEndpoints()).toEqual([gateway]);
    },
  );

  test("parses gateway lists and normalizes the IPFS path suffix", () => {
    vi.stubEnv(
      "VITE_IPFS_ENDPOINTS",
      " https://first.example, , https://second.example/ipfs, https://third.example/ipfs/ ",
    );
    expect(getEndpointLists().ipfs).toEqual([
      "https://first.example/ipfs/",
      "https://second.example/ipfs/",
      "https://third.example/ipfs/",
    ]);
  });

  test("uses the saved endpoint for images, videos, and token logos", () => {
    vi.stubEnv(
      "VITE_IPFS_ENDPOINTS",
      `${gateway},https://gateway.pinata.cloud/ipfs/`,
    );
    saveIndex("ipfs", 1);
    const selected = "https://gateway.pinata.cloud/ipfs/";

    expect(resolveNetworkEndpoints().ipfsEndpoint).toBe(selected);
    expect(getMediaUrl(`ipfs://${cid}/image.png`)).toBe(
      `${selected}${cid}/image.png`,
    );
    expect(getVideo({ contract: "atomicassets", data: { video: cid } })).toBe(
      `${selected}${cid}`,
    );
    expect(
      getTokenLogo(
        { contract: "token", currency: "TOKEN" },
        {
          account: "token",
          key: "token",
          symbol: "TOKEN",
          metadata: { logo: cid },
        },
      ),
    ).toBe(`${selected}${cid}`);
  });

  test("resets a saved selection when the configured list gets shorter", () => {
    saveIndex("ipfs", 2);
    expect(getMediaUrl(cid)).toBe(`${gateway}${cid}`);
    expect(localStorage.getItem("settings_network_ipfs")).toBe("0");
  });

  test("uses the first endpoint when browser storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Storage unavailable");
      },
      setItem: () => {
        throw new Error("Storage unavailable");
      },
    });
    expect(getMediaUrl(cid)).toBe(`${gateway}${cid}`);
  });
});

describe("getMediaUrl", () => {
  test.each([
    cid,
    `ipfs://${cid}`,
    `ipfs://ipfs/${cid}`,
    `/ipfs/${cid}`,
    `ipfs/${cid}`,
    `https://another-gateway.example/ipfs/${cid}`,
    `  ${cid}  `,
  ])("resolves %s through the public gateway", (source) => {
    expect(getMediaUrl(source)).toBe(`${gateway}${cid}`);
  });

  test.each([
    `ipfs://${cid}/folder/image.png?download=true#preview`,
    `https://another-gateway.example/ipfs/${cid}/folder/image.png?download=true#preview`,
  ])("preserves IPFS file paths, queries, and fragments", (source) => {
    expect(getMediaUrl(source)).toBe(
      `${gateway}${cid}/folder/image.png?download=true#preview`,
    );
  });

  test("resolves subdomain gateway URLs", () => {
    const subdomainCid =
      "bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly";
    expect(
      getMediaUrl(`https://${subdomainCid}.ipfs.dweb.link/folder/image.png`),
    ).toBe(`${gateway}${subdomainCid}/folder/image.png`);
  });

  test.each([
    "https://images.example/logo.png?size=50#preview",
    "http://localhost:8888/logo.png",
  ])("loads ordinary HTTP media directly", (source) => {
    expect(getMediaUrl(source)).toBe(source);
  });

  test.each([
    undefined,
    null,
    "",
    "  ",
    "ipfs://",
    "ipfs://ipfs/",
    "https://example.com/ipfs/",
    "https://",
    "javascript:alert(1)",
  ])("returns no media for missing or invalid sources: %s", (source) => {
    expect(getMediaUrl(source)).toBeNull();
  });
});

describe("media consumers", () => {
  test("resolves AtomicAssets images and videos consistently", () => {
    const nft = {
      contract: "atomicassets",
      data: {
        img: `ipfs://${cid}/image.png`,
        video: `ipfs://${cid}/video.mp4`,
      },
    };
    expect(getImage(nft)).toBe(`${gateway}${cid}/image.png`);
    expect(getVideo(nft)).toBe(`${gateway}${cid}/video.mp4`);
  });

  test("resolves SimpleAssets mutable images", () => {
    expect(getImage({ contract: "simpleassets", mdata: { img: cid } })).toBe(
      `${gateway}${cid}`,
    );
  });

  test("resolves token logos without image transformation suffixes", () => {
    expect(
      getTokenLogo(
        { contract: "token", currency: "TOKEN" },
        {
          account: "token",
          key: "token",
          symbol: "TOKEN",
          metadata: { logo: cid },
        },
      ),
    ).toBe(`${gateway}${cid}`);
  });

  test("preserves token placeholder images", () => {
    expect(getTokenLogo({ contract: "eosio.token", currency: "WAX" })).toBe(
      "/common/images/WAXP@5x-1x1.png",
    );
    expect(getTokenLogo({ contract: "token", currency: "TOKEN" })).toBe(
      "/no-image-token.png",
    );
  });
});
