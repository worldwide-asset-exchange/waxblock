import { useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import TokenLogo from "../../../app/components/token-logo";
import useTokenLogos from "../../../app/hooks/useTokenLogos";
import ApiManager from "../../../app/services/apiManager";
import {
  currencyFormat,
  numberFormat,
  shortNumberFormat,
  tokenFormat,
} from "../../../app/utilities/format";
import Pagination from "../../../app/components/ui/Pagination";
import Icon from "../../../app/components/ui/Icon";
import { isSystemToken } from "../../../app/utilities/tokens";

const TokensList = () => {
  const getLogoCandidates = useTokenLogos();
  const { data: tokensStats } = useQuery({
    queryKey: [`tokens_stats`],
    queryFn: () => ApiManager.getTokensStats(),
  });

  const initialFilters = {
    search: "",
  };
  const [filters, setFilters] = useState(initialFilters);

  const { data: tokens } = useQuery({
    queryKey: [`tokens`],
    queryFn: () => ApiManager.getTokens(),
  });

  const filteredTokens = useMemo(() => {
    if (!tokens) return [];
    return tokens
      .filter((token) => {
        if (filters.search) {
          const text = [token.symbol, token.account, token.metadata.name].join(
            " ",
          );
          if (text.toLowerCase().indexOf(filters.search.toLowerCase()) === -1) {
            return false;
          }
        }
        return true;
      })
      .sort(
        (a, b) =>
          Number(isSystemToken(b.account, b.symbol)) -
          Number(isSystemToken(a.account, a.symbol)),
      );
  }, [tokens, filters.search]);

  const itemsPerPage = 100;
  const [page, setPage] = useState(0);

  const pageCount = Math.ceil(filteredTokens.length / itemsPerPage);
  const effectivePage = Math.min(page, Math.max(pageCount - 1, 0));

  const currentItems = useMemo(() => {
    const offset = effectivePage * itemsPerPage;
    return filteredTokens.slice(offset, offset + itemsPerPage);
  }, [filteredTokens, effectivePage, itemsPerPage]);

  const handlePageClick = (event) => {
    setPage(event.selected);
  };

  const currentItemsSet1 = currentItems.filter(
    (token) =>
      isSystemToken(token.account, token.symbol) ||
      token.marketdata.volume_24hr_usd >= 1000,
  );

  const currentItemsSet2 = currentItems.filter(
    (token) =>
      !isSystemToken(token.account, token.symbol) &&
      token.marketdata.volume_24hr_usd < 1000,
  );

  return (
    <>
      {/*My Acc Sec*/}
      <div className="token_detail">
        <div className="cont_sec acc_sec">
          <div className="util_box">
            <div className="util_block">
              <div className="performance_box">
                <ul className="performance">
                  <li>
                    <span className="icon_box">
                      <Icon name="dollar" />
                    </span>
                    {tokensStats ? (
                      <>${tokenFormat(tokensStats.token_price_usd, 3)}</>
                    ) : (
                      <Skeleton />
                    )}

                    <span>WAX PRICE</span>
                  </li>
                  <li>
                    <span className="icon_box">
                      <Icon name="layers" />
                    </span>
                    {tokensStats ? (
                      <> ${shortNumberFormat(tokensStats.market_cap_usd)}</>
                    ) : (
                      <Skeleton />
                    )}

                    <span>WAX MARKETCAP</span>
                  </li>
                  <li>
                    <span className="icon_box">
                      <Icon name="handCoins" />
                    </span>
                    {tokensStats ? (
                      <>
                        {" "}
                        ${shortNumberFormat(tokensStats.tokens_market_cap_usd)}
                      </>
                    ) : (
                      <Skeleton />
                    )}
                    <span>TOKENS MARKETCAP</span>
                  </li>
                  <li>
                    <span className="icon_box">
                      <Icon name="wallet" />
                    </span>
                    {tokensStats ? (
                      <>
                        {" "}
                        $
                        {shortNumberFormat(
                          tokensStats.token_tokens_market_cap_usd,
                        )}
                      </>
                    ) : (
                      <Skeleton />
                    )}

                    <span>WAX + TOKENS MARKETCAP</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*My Acc Sec*/}
      {/*Tabbing Sec*/}
      <div className="cont_sec tab_sec token_sec">
        <h2>
          <span className="icon_box">
            <Icon name="handCoins" />
          </span>
          WAX Tokens
        </h2>
        <div className="token_search">
          <input
            type="search"
            placeholder="Search token symbol, name or contract..."
            aria-label="Search"
            value={filters.search}
            onChange={(el) => {
              setFilters((filters) => ({
                ...filters,
                search: el.target.value,
              }));
            }}
          />
        </div>
        <div className="tab no_scroll active">
          <div className="table_row">
            <div className="table_row_inner">
              <table>
                <tbody>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Marketcap (USD)</th>
                    <th>Price (USD)</th>
                    <th>Change (24h)</th>
                    <th>Volume (USD)</th>
                    <th>Issued Supply</th>
                    <th>Contract</th>
                    <th>Precision</th>
                  </tr>
                  {!tokens &&
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
                          <td>
                            <Skeleton />
                          </td>
                          <td>
                            <Skeleton />
                          </td>
                          <td>
                            <Skeleton />
                          </td>
                          <td>
                            <Skeleton />
                          </td>
                          <td>
                            <Skeleton />
                          </td>
                          <td>
                            <Skeleton />
                          </td>
                        </tr>
                      ))}
                  {[...currentItemsSet1, ...currentItemsSet2].map(
                    (token, index) => (
                      <tr key={token.key}>
                        <td>{effectivePage * itemsPerPage + index + 1}</td>
                        <td>
                          <span className="asset_img">
                            <span>
                              <TokenLogo
                                contract={token.account}
                                symbol={token.symbol}
                                candidates={getLogoCandidates(
                                  token.account,
                                  token.symbol,
                                )}
                                width={30}
                                height={30}
                              />
                            </span>
                            <Link to={`/tokens/${token.key}`}>
                              {token.metadata.name === token.symbol
                                ? `${token.symbol}`
                                : `${token.metadata.name} (${token.symbol})`}
                            </Link>
                          </span>
                        </td>
                        <td>
                          {tokenFormat(token.marketdata.marketcap_usd, 0)}
                        </td>
                        <td>{currencyFormat(token.marketdata.price_usd, 2)}</td>
                        <td>
                          <span
                            className={`${
                              token.marketdata.change_24hr < 0 ? "red" : "green"
                            }`}
                          >
                            {token.marketdata.change_24hr}%
                          </span>
                        </td>
                        <td>
                          {shortNumberFormat(token.marketdata.volume_24hr_usd)}
                        </td>
                        <td>
                          {numberFormat(token.supply.circulating)}{" "}
                          {token.symbol}
                        </td>
                        <td>
                          <Link to={`/account/${token.account}`}>
                            {token.account}
                          </Link>
                        </td>
                        <td>{token.supply.precision}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/*Tabbing Sec*/}
      {pageCount > 0 ? (
        <Pagination
          onPageChange={(selected) => handlePageClick({ selected })}
          pageRangeDisplayed={5}
          pageCount={pageCount}
          page={pageCount > 0 ? effectivePage : 0}
        />
      ) : null}
    </>
  );
};

export default TokensList;
