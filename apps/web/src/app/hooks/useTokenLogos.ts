import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import config from "../config";
import ApiManager from "../services/apiManager";
import { fetchTokenLogoRegistry } from "../services/tokenLogoSources";
import {
  buildTokenLogoIndex,
  getTokenLogoCandidates,
} from "../utilities/token-logos";
import type { TokenMarket } from "../utilities/tokens";

const useTokenLogos = () => {
  const publicRegistriesEnabled = config.network_type === "mainnet";
  const backendEnabled = Boolean(config.api.url);
  // Fetch independently and cache per source, while applying priority below.
  const [waxfp, antelope, eosAirdrops] = useQueries({
    queries: (["waxfp", "antelope", "eosAirdrops"] as const).map(
      (registry) => ({
        queryKey: ["tokenLogoRegistry", registry],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          fetchTokenLogoRegistry(registry, signal),
        enabled: publicRegistriesEnabled,
        staleTime: 60 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
      }),
    ),
  });
  const backend = useQuery({
    queryKey: ["tokens"],
    queryFn: () => ApiManager.getTokens() as Promise<TokenMarket[]>,
    enabled: backendEnabled,
    refetchOnWindowFocus: false,
  });

  const index = useMemo(
    () =>
      buildTokenLogoIndex([
        {
          tokens: publicRegistriesEnabled ? waxfp.data : undefined,
          ready: !publicRegistriesEnabled || !waxfp.isPending,
        },
        {
          tokens: publicRegistriesEnabled ? antelope.data : undefined,
          ready: !publicRegistriesEnabled || !antelope.isPending,
        },
        {
          tokens:
            backendEnabled && Array.isArray(backend.data)
              ? backend.data.flatMap((token) =>
                  (!token.chain || token.chain === config.network) &&
                  token.metadata?.logo
                    ? [
                        {
                          contract: token.account,
                          symbol: token.symbol,
                          logo: token.metadata.logo,
                        },
                      ]
                    : [],
                )
              : undefined,
          ready: !backendEnabled || !backend.isPending,
        },
        {
          tokens: publicRegistriesEnabled ? eosAirdrops.data : undefined,
          ready: !publicRegistriesEnabled || !eosAirdrops.isPending,
        },
      ]),
    [
      publicRegistriesEnabled,
      backendEnabled,
      waxfp.data,
      waxfp.isPending,
      antelope.data,
      antelope.isPending,
      backend.data,
      backend.isPending,
      eosAirdrops.data,
      eosAirdrops.isPending,
    ],
  );

  return (contract: string, symbol: string) =>
    getTokenLogoCandidates(index, contract, symbol);
};

export default useTokenLogos;
