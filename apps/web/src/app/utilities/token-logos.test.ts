// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from "vitest";
import { buildTokenLogoIndex, getTokenLogoCandidates } from "./token-logos";
import { parseTokenLogoRegistry } from "../services/tokenLogoSources";

const token = (logo: string, contract = "test.token", symbol = "TEST") => ({
  contract,
  symbol,
  logo,
});
const source = (logo: string, ready = true) => ({
  tokens: [token(logo)],
  ready,
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe("token logo priority", () => {
  test("orders candidates by WAXFP, antelope-tokens, API, then eos-airdrops", () => {
    const index = buildTokenLogoIndex([
      source("https://waxfp.example/logo.png"),
      source("https://antelope.example/logo.png"),
      source("https://api.example/logo.png"),
      source("https://airdrops.example/logo.png"),
    ]);
    expect(getTokenLogoCandidates(index, "test.token", "TEST")).toEqual([
      "https://waxfp.example/logo.png",
      "https://antelope.example/logo.png",
      "https://api.example/logo.png",
      "https://airdrops.example/logo.png",
    ]);
    expect(getTokenLogoCandidates(index, "other.token", "TEST")).toEqual([]);
    expect(getTokenLogoCandidates(index, "test.token", "OTHER")).toEqual([]);
  });

  test.each([0, 1, 2])(
    "hides lower priorities while source %i is pending",
    (pending) => {
      const sources = ["waxfp", "antelope", "api", "airdrops"].map((name, i) =>
        source(`https://${name}.example/logo.png`, i !== pending),
      );
      expect(
        getTokenLogoCandidates(
          buildTokenLogoIndex(sources),
          "test.token",
          "TEST",
        ),
      ).toEqual(sources.slice(0, pending).map((entry) => entry.tokens[0].logo));
    },
  );

  test("continues after a source failed or did not contain this token", () => {
    const index = buildTokenLogoIndex([
      { tokens: undefined, ready: true },
      {
        tokens: [token("https://other.example/logo.png", "other.token")],
        ready: true,
      },
      source("https://api.example/logo.png"),
      source("https://airdrops.example/logo.png"),
    ]);
    expect(getTokenLogoCandidates(index, "test.token", "TEST")).toEqual([
      "https://api.example/logo.png",
      "https://airdrops.example/logo.png",
    ]);
  });

  test("normalizes IPFS sources through the selected gateway and removes duplicates", () => {
    vi.stubEnv("VITE_IPFS_ENDPOINTS", "https://gateway.example/ipfs/");
    const index = buildTokenLogoIndex([
      source("ipfs://example-cid/logo.png"),
      source("https://another.example/ipfs/example-cid/logo.png"),
      source("javascript:alert(1)"),
      source("https://airdrops.example/logo.png"),
    ]);
    expect(getTokenLogoCandidates(index, "test.token", "TEST")).toEqual([
      "https://gateway.example/ipfs/example-cid/logo.png",
      "https://airdrops.example/logo.png",
    ]);
  });
});

describe("token registry formats", () => {
  test("reads WAXFP entries and skips malformed or missing logos", () => {
    expect(
      parseTokenLogoRegistry(
        [
          token("ipfs://example-cid"),
          null,
          {},
          { contract: "test.token", symbol: "TEST" },
          token(" "),
        ],
        "waxfp",
      ),
    ).toEqual([token("ipfs://example-cid")]);
  });

  test("constructs antelope-tokens image filenames from contract and symbol", () => {
    expect(
      parseTokenLogoRegistry(
        [{ contract: "eosio.token", symbol: "WAX" }],
        "antelope",
      ),
    ).toEqual([
      token(
        "https://raw.githubusercontent.com/blocdraig/antelope-tokens/main/wax/logos/eosio.token_wax.png",
        "eosio.token",
        "WAX",
      ),
    ]);
  });

  test("matches eos-airdrops entries to WAX and maps account to contract", () => {
    expect(
      parseTokenLogoRegistry(
        [
          {
            account: "test.token",
            symbol: "TEST",
            chain: "wax",
            logo: "https://wax.example/logo.png",
          },
          {
            account: "test.token",
            symbol: "TEST",
            chain: "eos",
            logo: "https://eos.example/logo.png",
          },
        ],
        "eosAirdrops",
      ),
    ).toEqual([token("https://wax.example/logo.png")]);
  });

  test("rejects invalid registries so the next source can be used", () => {
    expect(() => parseTokenLogoRegistry({ tokens: [] }, "waxfp")).toThrow(
      "Invalid waxfp",
    );
  });
});
