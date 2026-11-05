import { useContext } from "react";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { createSearchParams, Link } from "react-router";
import config from "../../../app/config";
import { WalletContext } from "../../../app/contexts/wallet-context";
import ApiManager from "../../../app/services/apiManager";
import TokenLogo from "../../../app/components/token-logo";
import useTokenLogos from "../../../app/hooks/useTokenLogos";
import { currencyFormat } from "../../../app/utilities/format";

import {
  getTokenKey,
  type TokenBalance as Balance,
  type TokenMarket,
} from "../../../app/utilities/tokens";

const getBalanceRows = (balances: { balances?: Balance[] } | Balance[]) => {
  if (Array.isArray(balances)) return balances;

  return balances?.balances || [];
};

const getTokenPriceUsd = (
  balance: Balance,
  token: TokenMarket | undefined,
  tokenPrice: number,
) => {
  if (
    balance.contract === "eosio.token" &&
    balance.currency === config.token_symbol
  ) {
    return tokenPrice > 0 ? tokenPrice : token?.marketdata?.price_usd;
  }

  return token?.marketdata?.price_usd;
};

const formatTokenPrice = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: value >= 1 ? 0 : 2,
    maximumFractionDigits: 20,
  });

const formatUsdTokenPrice = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 20,
  });

const formatTokenAmount = (value: number | string, precision: number) =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });

const Tokens = ({
  balances,
  showTransferAction = false,
}: {
  balances: { balances?: Balance[] } | Balance[];
  showTransferAction?: boolean;
}) => {
  const wallet = useContext(WalletContext);
  const getLogoCandidates = useTokenLogos();
  const tokenPrice = Number(wallet?.tokenPrice || 0);
  const { data: tokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: () => ApiManager.getTokens() as Promise<TokenMarket[]>,
  });

  const tokensByBalanceKey =
    tokens?.reduce<Record<string, TokenMarket>>((map, token) => {
      map[getTokenKey(token.account, token.symbol)] = token;
      return map;
    }, {}) || {};

  const balanceRows = getBalanceRows(balances);
  const hasWaxBalance = balanceRows.some(
    (balance) =>
      balance.contract === "eosio.token" &&
      balance.currency === config.token_symbol,
  );
  const rows = balances
    ? [
        ...balanceRows,
        ...(hasWaxBalance
          ? []
          : [
              {
                amount: 0,
                contract: "eosio.token",
                currency: config.token_symbol,
                decimals: config.token_precision,
              },
            ]),
      ]
        .filter(
          (balance) =>
            Number(balance.amount) > 0 ||
            (balance.contract === "eosio.token" &&
              balance.currency === config.token_symbol),
        )
        .sort((a, b) => {
          const aIsWax =
            a.contract === "eosio.token" && a.currency === config.token_symbol;
          const bIsWax =
            b.contract === "eosio.token" && b.currency === config.token_symbol;

          if (aIsWax && !bIsWax) return -1;
          if (!aIsWax && bIsWax) return 1;

          const aToken =
            tokensByBalanceKey[getTokenKey(a.contract, a.currency)];
          const bToken =
            tokensByBalanceKey[getTokenKey(b.contract, b.currency)];
          const aUsd = getTokenPriceUsd(a, aToken, tokenPrice);
          const bUsd = getTokenPriceUsd(b, bToken, tokenPrice);
          const aValue = typeof aUsd === "number" ? Number(a.amount) * aUsd : 0;
          const bValue = typeof bUsd === "number" ? Number(b.amount) * bUsd : 0;

          if (bValue !== aValue) return bValue - aValue;

          return a.currency.localeCompare(b.currency);
        })
    : [];

  return (
    <div className="account-token-list">
      <table className="account-token-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Balance</th>
            <th>Price</th>
            {showTransferAction ? <th aria-label="Actions" /> : null}
          </tr>
        </thead>
        <tbody>
          {!balances &&
            Array(5)
              .fill(0)
              .map((item, index) => (
                <tr key={index}>
                  <td>
                    <Skeleton />
                  </td>
                  <td>
                    <Skeleton />
                  </td>
                  <td>
                    <Skeleton />
                  </td>
                  {showTransferAction ? (
                    <td>
                      <Skeleton />
                    </td>
                  ) : null}
                </tr>
              ))}
          {balances && rows.length === 0 ? (
            <tr>
              <td colSpan={showTransferAction ? 4 : 3}>
                No tokens in this account.
              </td>
            </tr>
          ) : null}
          {rows.map((balance, index) => {
            const token =
              tokensByBalanceKey[
                getTokenKey(balance.contract, balance.currency)
              ];
            const priceUsd = getTokenPriceUsd(balance, token, tokenPrice);
            const priceWax =
              balance.contract === "eosio.token" &&
              balance.currency === config.token_symbol
                ? 1
                : typeof token?.marketdata?.price_wax === "number"
                  ? token.marketdata.price_wax
                  : typeof priceUsd === "number" && tokenPrice > 0
                    ? priceUsd / tokenPrice
                    : undefined;
            const decimals = Number(balance.decimals ?? 4);

            return (
              <tr key={`${balance.contract}-${balance.currency}-${index}`}>
                <td>
                  <span className="account-token-identity">
                    <TokenLogo
                      contract={balance.contract}
                      symbol={balance.currency}
                      candidates={getLogoCandidates(
                        balance.contract,
                        balance.currency,
                      )}
                    />
                    <span>
                      {token?.key ? (
                        <Link to={`/tokens/${token.key}`}>
                          {balance.currency}
                        </Link>
                      ) : (
                        <strong>{balance.currency}</strong>
                      )}
                      <Link
                        className="account-token-contract"
                        to={`/account/${balance.contract}`}
                      >
                        {balance.contract}
                      </Link>
                    </span>
                  </span>
                </td>
                <td>
                  <strong className="account-token-amount">
                    {formatTokenAmount(balance.amount, decimals)}{" "}
                    {balance.currency}
                  </strong>
                  <span className="account-token-subvalue">
                    {typeof priceUsd === "number"
                      ? `$${currencyFormat(Number(balance.amount) * priceUsd)}`
                      : "$0.00"}
                  </span>
                </td>
                <td>
                  <strong className="account-token-price">
                    {typeof priceWax === "number"
                      ? `${formatTokenPrice(priceWax)} ${config.token_symbol}`
                      : "-"}
                  </strong>
                  <span className="account-token-subvalue">
                    {typeof priceUsd === "number"
                      ? `$${formatUsdTokenPrice(priceUsd)}`
                      : "-"}
                  </span>
                </td>
                {showTransferAction ? (
                  <td className="account-token-action">
                    <Link
                      to={{
                        pathname: "/wallet/transfer",
                        search: createSearchParams({
                          contract: balance.contract,
                          symbol: balance.currency,
                          decimals: String(decimals),
                        }).toString(),
                      }}
                    >
                      Transfer
                    </Link>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Tokens;
