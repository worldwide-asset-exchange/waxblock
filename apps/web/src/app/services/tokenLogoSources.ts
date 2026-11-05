import type { TokenLogoEntry } from "../utilities/token-logos";

const ANTELOPE_BASE =
  "https://raw.githubusercontent.com/blocdraig/antelope-tokens/main/wax";

export const TOKEN_LOGO_REGISTRIES = {
  waxfp: "https://api.waxfp.com/v1/tokens/_list",
  antelope: `${ANTELOPE_BASE}/tokens.json`,
  eosAirdrops:
    "https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json",
} as const;

type Registry = keyof typeof TOKEN_LOGO_REGISTRIES;

export const parseTokenLogoRegistry = (
  data: unknown,
  registry: Registry,
): TokenLogoEntry[] => {
  if (!Array.isArray(data))
    throw new Error(`Invalid ${registry} token registry`);

  return data.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== "object") return [];
    const token = entry as Record<string, unknown>;
    if (registry === "eosAirdrops" && token.chain !== "wax") return [];
    const contract =
      registry === "eosAirdrops" ? token.account : token.contract;
    if (typeof contract !== "string" || typeof token.symbol !== "string")
      return [];

    const logo =
      registry === "antelope"
        ? `${ANTELOPE_BASE}/logos/${encodeURIComponent(contract)}_${encodeURIComponent(token.symbol.toLowerCase())}.png`
        : token.logo;
    return typeof logo === "string" && logo.trim()
      ? [{ contract, symbol: token.symbol, logo }]
      : [];
  });
};

export const fetchTokenLogoRegistry = async (
  registry: Registry,
  signal: AbortSignal,
) => {
  const response = await fetch(TOKEN_LOGO_REGISTRIES[registry], {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
  });
  if (!response.ok)
    throw new Error(`Unable to fetch ${registry} tokens (${response.status})`);
  return parseTokenLogoRegistry(await response.json(), registry);
};
