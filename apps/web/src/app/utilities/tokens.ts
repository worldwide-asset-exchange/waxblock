import config from "../config";
import { getMediaUrl } from "./media";

export type TokenBalance = {
  amount: number | string;
  contract: string;
  currency: string;
  decimals?: number | string;
};

export type TokenMarket = {
  chain?: string;
  account: string;
  key: string;
  symbol: string;
  metadata?: { logo?: string; name?: string };
  marketdata?: { price_usd?: number; price_wax?: number };
};

export const getTokenKey = (contract: string, currency: string) =>
  `${contract}-${currency}`.toLowerCase();

export const isSystemToken = (contract: string, symbol: string) =>
  contract === "eosio.token" && symbol === config.token_symbol;

export const getTokenLogo = (
  balance: Pick<TokenBalance, "contract" | "currency">,
  token?: TokenMarket,
) => {
  if (token?.metadata?.logo) {
    return getMediaUrl(token.metadata.logo) || "/no-image-token.png";
  }
  if (isSystemToken(balance.contract, balance.currency)) {
    return "/common/images/WAXP@5x-1x1.png";
  }
  return "/no-image-token.png";
};
