import { Helmet } from "react-helmet-async";
import Icon from "../../app/components/ui/Icon";
import { useQuery } from "@tanstack/react-query";
import BlockchainApiManager from "../../app/services/blockchainApiManager";
import Skeleton from "react-loading-skeleton";
import config from "../../app/config";

const Chain = () => {
  const { data: chainInfo } = useQuery({
    queryKey: [`chain_info`],
    queryFn: () => BlockchainApiManager.getInfo(),
  });

  const { data: global } = useQuery({
    queryKey: [`global`],

    queryFn: () =>
      BlockchainApiManager.getTableRows({
        code: "eosio",
        scope: "eosio",
        table: "global",
        lower_bound: "",
        upper_bound: "",
        limit: 1,
      }),
  });

  const { data: currencyStats } = useQuery({
    queryKey: [`currency_stats`],

    queryFn: () =>
      BlockchainApiManager.getCurrencyStats({
        code: "eosio.token",
        symbol: config.token_symbol,
      }),
  });

  const { data: currencyBalance } = useQuery({
    queryKey: [`currency_balance`],

    queryFn: () =>
      BlockchainApiManager.getCurrencyBalance({
        account: "eosio.stake",
        code: "eosio.token",
        symbol: config.token_symbol,
      }),
  });

  return (
    <>
      <Helmet>
        <title>Chain | WAX Explorer</title>
      </Helmet>
      <div className="chain_info">
        <div className="cont_sec acc_sec">
          <div className="util_box">
            <div className="util_block">
              <div className="performance_box">
                <ul className="performance">
                  <li>
                    <span className="icon_box">
                      <Icon name="dice" />
                    </span>
                    {chainInfo ? chainInfo.chain_id : <Skeleton />}
                    <span>CHAIN ID</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="cont_sec acc_sec">
          <div className="util_box">
            <div className="util_block">
              <div className="performance_box">
                <h2>RAM</h2>
                <ul className="performance">
                  <li>
                    <span className="icon_box" />
                    {global ? (
                      (global.rows[0].max_ram_size / 1024).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        },
                      )
                    ) : (
                      <Skeleton />
                    )}{" "}
                    KB<span>CHAIN RAM</span>
                  </li>
                  <li>
                    <span className="icon_box" />
                    {global ? (
                      (
                        global.rows[0].total_ram_bytes_reserved / 1024
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    ) : (
                      <Skeleton />
                    )}{" "}
                    KB<span>RAM BOUGHT</span>
                  </li>
                  <li>
                    <span className="icon_box" />
                    {global ? (
                      (
                        (global.rows[0].max_ram_size -
                          global.rows[0].total_ram_bytes_reserved) /
                        1024
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    ) : (
                      <Skeleton />
                    )}{" "}
                    KB<span>RAM FREE</span>
                  </li>
                  <li>
                    <span className="icon_box" />
                    {global ? (
                      (
                        (global.rows[0].total_ram_bytes_reserved /
                          global.rows[0].max_ram_size) *
                        100
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    ) : (
                      <Skeleton />
                    )}{" "}
                    %<span>RAM BOUGHT %</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="cont_sec acc_sec">
          <div className="util_box">
            <div className="util_block">
              <div className="performance_box">
                <h2>WAX Supply and Staking</h2>
                <ul className="performance">
                  <li>
                    <span className="icon_box" />
                    {currencyStats ? (
                      Number(
                        parseFloat(currencyStats[config.token_symbol].supply),
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 6,
                      })
                    ) : (
                      <Skeleton />
                    )}
                    <span>TOTAL {config.token_symbol}</span>
                  </li>
                  <li>
                    <span className="icon_box" />
                    {currencyBalance ? (
                      Number(parseFloat(currencyBalance[0])).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 6,
                          maximumFractionDigits: 6,
                        },
                      )
                    ) : (
                      <Skeleton />
                    )}
                    <span>STAKED {config.token_symbol}</span>
                  </li>
                  <li>
                    <span className="icon_box" />
                    {currencyStats && currencyBalance ? (
                      Number(
                        parseFloat(currencyStats[config.token_symbol].supply) -
                          parseFloat(currencyBalance[0]),
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 6,
                      })
                    ) : (
                      <Skeleton />
                    )}
                    <span>CIRCULATING {config.token_symbol}</span>
                  </li>
                  <li>
                    <span className="icon_box" />
                    {currencyStats && currencyBalance ? (
                      Number(
                        parseFloat(currencyBalance[0]) /
                          (parseFloat(
                            currencyStats[config.token_symbol].supply,
                          ) -
                            parseFloat(currencyBalance[0])),
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    ) : (
                      <Skeleton />
                    )}
                    <span>STAKED TO CIRCULATION RATIO</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="cont_sec acc_sec">
          <div className="util_box">
            <div className="util_block">
              <div className="performance_box">
                <h2>Chain Limits</h2>
                <ul className="performance">
                  <li>
                    <span className="icon_box" />
                    {chainInfo ? (
                      (
                        chainInfo.block_cpu_limit / Math.pow(10, 6)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    ) : (
                      <Skeleton />
                    )}{" "}
                    s<span>CPU LIMIT PER BLOCK</span>
                  </li>
                  <li>
                    <span className="icon_box" />
                    {chainInfo ? (
                      (chainInfo.block_net_limit / 1024).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        },
                      )
                    ) : (
                      <Skeleton />
                    )}{" "}
                    KB<span>NET LIMIT PER BLOCK</span>
                  </li>
                  <li>
                    <span className="icon_box" />
                    {chainInfo ? (
                      (
                        chainInfo.virtual_block_cpu_limit / Math.pow(10, 6)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    ) : (
                      <Skeleton />
                    )}{" "}
                    s<span>CHAIN CPU LIMIT</span>
                  </li>
                  <li>
                    <span className="icon_box" />
                    {chainInfo ? (
                      (chainInfo.virtual_block_net_limit / 1024).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        },
                      )
                    ) : (
                      <Skeleton />
                    )}{" "}
                    KB<span>CHAIN NET LIMIT</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chain;
