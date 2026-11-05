import { getTokenKey } from "./tokens";
import { getMediaUrl } from "./media";

export type TokenLogoEntry = {
  contract: string;
  symbol: string;
  logo: string;
};

export type TokenLogoSource = {
  tokens: readonly TokenLogoEntry[] | undefined;
  ready: boolean;
};

// A pending higher-priority registry must not expose a lower-priority logo.
export const buildTokenLogoIndex = (sources: readonly TokenLogoSource[]) => {
  const index = new Map<string, string[]>();
  for (const source of sources) {
    if (!source.ready) break;
    for (const token of source.tokens ?? []) {
      const key = getTokenKey(token.contract, token.symbol);
      const logos = index.get(key) ?? [];
      if (token.logo.trim() && !logos.includes(token.logo)) {
        logos.push(token.logo);
        index.set(key, logos);
      }
    }
  }
  return index;
};

export const getTokenLogoCandidates = (
  index: ReadonlyMap<string, readonly string[]>,
  contract: string,
  symbol: string,
) =>
  Array.from(
    new Set(
      (index.get(getTokenKey(contract, symbol)) ?? [])
        .map(getMediaUrl)
        .filter((url): url is string => Boolean(url)),
    ),
  );
