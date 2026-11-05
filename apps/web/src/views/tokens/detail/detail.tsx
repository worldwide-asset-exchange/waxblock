import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import Icon from "../../../app/components/ui/Icon";
import config from "../../../app/config";
import TokenLogo from "../../../app/components/token-logo";
import useTokenLogos from "../../../app/hooks/useTokenLogos";
import ApiManager from "../../../app/services/apiManager";
import { numberFormat, tokenFormat } from "../../../app/utilities/format";
import PriceChart from "./components/price-chart";
import TopHolders from "./components/top-holders";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";

function parseTokenStringStrict(tokenString) {
  const pattern = /^([A-Za-z0-9]+)-([a-z]+)-([a-z0-9.]+)$/;
  const match = tokenString.match(pattern);

  if (!match) {
    return null;
  }

  return {
    symbol: match?.[1],
    chain: match?.[2],
    account: match?.[3],
  };
}

const TokensDetail = () => {
  const getLogoCandidates = useTokenLogos();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.hash.replace("#", "") || "topHolders";
  const localToken = useMemo(
    () => parseTokenStringStrict(params?.key),
    [params?.key],
  );

  const { data: supply, isLoading: isLoadingSupply } = useQuery({
    queryKey: [`token_supply`, localToken?.symbol, localToken?.account],
    queryFn: async () => {
      const stats = await BlockchainApiManager.getTableRows({
        code: localToken.account,
        scope: localToken.symbol,
        table: "stat",
        lower_bound: "",
        upper_bound: "",
        index_position: 1,
        key_type: "i64",
        reverse: false,
        json: true,
        show_payer: false,
        limit: -1,
      });
      return stats?.rows?.[0] ?? null;
    },
    enabled: !!localToken,
  });

  const { data: token, isLoading: isLoading_tokens_detail } = useQuery({
    queryKey: [`tokens_detail`, params.key],
    queryFn: () => ApiManager.getToken(params.key),
  });

  const { data: holdersCount } = useQuery({
    queryKey: [`tokens_holdersCount`, params.key],
    queryFn: () => ApiManager.getTokenHoldersCount(params.key),
  });

  const renderHeaderToken = () => {
    if (token) {
      return (
        <div className="token_head">
          <h2>{token.symbol}</h2>
          <p>
            <Link to={`/account/${token.account}`}>{token.account}</Link>
          </p>
        </div>
      );
    }

    if (localToken) {
      return (
        <div className="token_head">
          <h2>{localToken?.symbol}</h2>
          <p>
            <Link to={`/account/${localToken?.account}`}>
              {localToken?.account}
            </Link>
          </p>
        </div>
      );
    }

    return (
      <div className="token_head">
        <h2>
          <Skeleton />
        </h2>
        <p>
          <Skeleton />
        </p>
      </div>
    );
  };

  return (
    <>
      {/*My Acc Sec*/}
      <div className="token_detail_sec">
        <div className="cont_sec acc_sec">
          <div className="token_head_row">
            <div className="token_head_col token_head_col1">
              <span className="asset_img">
                <TokenLogo
                  contract={token?.account || localToken?.account || ""}
                  symbol={token?.symbol || localToken?.symbol || ""}
                  candidates={getLogoCandidates(
                    token?.account || localToken?.account || "",
                    token?.symbol || localToken?.symbol || "",
                  )}
                />
              </span>
              {renderHeaderToken()}
            </div>
            <div className="token_head_col token_head_col2">
              <div className="balance_box">
                <ul>
                  <li>
                    {token ? (
                      <>
                        <span className="name">
                          ${tokenFormat(token.marketdata.price_usd, 6)}
                          <span className="sub_text">USD</span>
                          <span
                            className={`${
                              token.marketdata.change_24hr < 0 ? "red" : "green"
                            }`}
                          >
                            ({token.marketdata.change_24hr}%)
                          </span>{" "}
                          <br />
                          {token.symbol !== config.token_symbol ? (
                            <span className="sub_text">
                              {tokenFormat(token.marketdata.price)}{" "}
                              {config.token_symbol}
                            </span>
                          ) : null}
                        </span>
                      </>
                    ) : null}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="util_box">
            <div className="assets">
              <div className="assets_inner">
                <table>
                  <tbody>
                    <tr>
                      <th>Market Cap</th>
                      <td>
                        {isLoading_tokens_detail ? (
                          <Skeleton />
                        ) : (
                          <>
                            $
                            {tokenFormat(
                              token?.marketdata?.marketcap_usd || 0,
                              0,
                            )}
                            &nbsp; USD
                          </>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Daily Volume</th>
                      <td>
                        {isLoading_tokens_detail ? (
                          <Skeleton />
                        ) : (
                          <>
                            $
                            {tokenFormat(
                              token?.marketdata?.volume_24hr_usd || 0,
                              2,
                            )}
                            &nbsp; USD
                          </>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th />
                      <td>
                        {isLoading_tokens_detail ? (
                          <Skeleton />
                        ) : (
                          <>
                            {tokenFormat(
                              token?.marketdata?.volume_24hr || 0,
                              2,
                            )}
                            &nbsp;{token?.symbol || localToken?.symbol}
                          </>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="assets">
              <div className="assets_inner">
                <table>
                  <tbody>
                    <tr>
                      <th>Issued Supply</th>
                      <td>
                        {!isLoadingSupply ? (
                          <>
                            {tokenFormat(
                              token?.supply?.circulating || supply?.supply || 0,
                              4,
                            )}
                            &nbsp;
                            {token?.symbol || localToken?.symbol || ""}
                          </>
                        ) : (
                          <Skeleton />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Max Supply</th>
                      <td>
                        {!isLoadingSupply ? (
                          <>
                            {tokenFormat(
                              token?.supply?.max || supply?.max_supply || 0,
                              0,
                            )}
                            &nbsp;
                            {token?.symbol || localToken?.symbol || ""}
                          </>
                        ) : (
                          <Skeleton />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Token Holders</th>
                      <td>
                        {holdersCount ? (
                          <>{numberFormat(holdersCount, 0)}</>
                        ) : (
                          <Skeleton />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
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
            <Icon name="trending" />
          </span>
          Markets
        </h2>
        <div className="tab no_scroll active">
          <div className="table_row">
            <div className="table_row_inner">
              <table>
                <tbody>
                  <tr>
                    <th>#</th>
                    <th>Exchange</th>
                    <th>Pair</th>
                    <th>Volume (24h)</th>
                    <th>Price</th>
                    <th>Volume (%)</th>
                  </tr>
                  {token && token.pairs.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        No markets for {token.symbol} listed on WAX Block.
                      </td>
                    </tr>
                  ) : null}
                  {token &&
                    token.pairs.map((pair, index) => (
                      <tr key={index}>
                        <td>1</td>
                        <td>
                          <span className="asset_img">
                            <span>
                              <img
                                src="/exchanges/alcor.png"
                                alt={pair.exchange}
                              />
                            </span>
                            <a
                              href="https://www.alcor.exchange/markets"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {pair.exchange}
                            </a>
                          </span>
                        </td>
                        <td>{pair.id}</td>
                        <td>
                          ${tokenFormat(pair.quote.volume_base_24hr_usd, 2)} USD
                          <span className="small_cont">
                            {tokenFormat(pair.quote.volume_base_24hr, 2)}
                            &nbsp;{token.symbol}
                          </span>
                          <span className="small_cont">
                            {tokenFormat(pair.quote.volume_quote_24hr, 2)}{" "}
                            {pair.pair_quote}
                          </span>
                        </td>
                        <td>
                          ${tokenFormat(pair.quote.price_usd, 6)} USD
                          <span className="small_cont">
                            {tokenFormat(pair.quote.price, 6)} {pair.pair_quote}
                          </span>
                        </td>
                        <td>100 %</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/*Tabbing Sec*/}
      {/*Tabbing Sec*/}
      <div className="cont_sec tab_sec token_sec">
        <h2>
          <span className="icon_box">
            <Icon name="move" />
          </span>
          Token Information
        </h2>
        <ul className="tabbbing">
          <li
            className={`${activeTab === "topHolders" ? "active" : ""}`}
            onClick={() => navigate({ hash: "topHolders" })}
          >
            <a href="#topHolders">Top Holders</a>
          </li>
          {/* <li
              className={`${activeTab === "charts" ? "active" : ""}`}
              onClick={() => {
                history.push({ hash: "charts" });
                setActiveTab("charts");
              }}
            >
              <a href="#charts">Charts</a>
            </li> */}
        </ul>

        <div
          className={`tab topHolders no_scroll ${
            activeTab === "topHolders" ? "active" : null
          }`}
          //id="topHolders"
        >
          {/* {activeTab === "topHolders" ? ( */}
          <TopHolders token={token} supply={supply} />
          {/* ) : null} */}
        </div>

        <div
          className={`tab charts no_scroll ${
            activeTab === "charts" ? "active" : null
          }`}
          //id="charts"
        >
          {/* {activeTab === "charts" ?  */}
          <PriceChart key={params?.key} />
          {/* : null} */}
        </div>
      </div>
      {/*Tabbing Sec*/}
    </>
  );
};

export default TokensDetail;
