import { useContext, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { currencyFormat, tokenFormat } from "../../app/utilities/format";
import NftAssets from "./components/nft-assets";
import Transactions from "./components/transactions";
import { calculateBreakDown } from "../../app/utilities/account";
import { Helmet } from "react-helmet-async";
import { createBrowserHistory } from "history";
import ResourceUtilization from "./components/resource-utilization";
import { WalletContext } from "../../app/contexts/wallet-context";
import Tokens from "./components/tokens";
import ContractActions from "./components/contract-actions";
import ContractTables from "./components/contract-tables";
import ContractAbi from "./components/contract-abi";
import Keys from "./components/keys";
import Staked from "./components/staked";
import DownloadTransfers from "./components/download-transfers";
import config from "../../app/config";
import Votes from "./components/votes";
import LocalnetManager from "../../app/services/localnetManager";
import BlockchainApiManager from "../../app/services/blockchainApiManager";
import { fromNow } from "../../app/utilities/date";
import { getAccountTabFromHash } from "../../app/utilities/route-tabs";

const Account = () => {
  const params = useParams();
  const accountName = params.account?.toLowerCase();
  const location = useLocation();
  const history = createBrowserHistory();
  const navigate = useNavigate();
  const activeTab = getAccountTabFromHash(location.hash);
  const wallet = useContext(WalletContext);
  const { session, tokenPrice } = wallet;

  useEffect(() => {
    if (!accountName && !session) {
      wallet.showWalletConnectModal();
    } else if (!accountName && session) {
      navigate(`/account/${session.actor.toString()}`);
    } else if (params.account && params.account !== accountName) {
      navigate(`/account/${accountName}${location.search}${location.hash}`, {
        replace: true,
      });
    }
  }, [accountName, params.account, session, navigate, wallet, location]);

  const { error, data: account } = useQuery({
    queryKey: [`account`, accountName],
    queryFn: () => BlockchainApiManager.getAccount(accountName),
  });

  const { data: delband } = useQuery({
    queryKey: [`delband`, accountName],

    queryFn: () =>
      BlockchainApiManager.getTableRows({
        code: "eosio",
        scope: accountName,
        table: "delband",
        limit: -1,
      }),
  });

  const { data: userres } = useQuery({
    queryKey: [`userres`, accountName],

    queryFn: () =>
      BlockchainApiManager.getTableRows({
        code: "eosio",
        scope: accountName,
        table: "userres",
        limit: -1,
      }),
  });

  const { data: accountAbi } = useQuery({
    queryKey: [`accountAbi`, accountName],
    queryFn: () => BlockchainApiManager.getAbi(accountName),
  });

  const { data: accInfo } = useQuery({
    queryKey: [`accInfo`, accountName],

    queryFn: () =>
      config.network_type === "localnet"
        ? null
        : BlockchainApiManager.getAccInfo(accountName),
  });

  const { data: balances } = useQuery({
    queryKey: [`balances`, accountName],

    queryFn: () =>
      config.network_type === "localnet"
        ? LocalnetManager.getBalances(accountName)
        : BlockchainApiManager.getBalances(accountName),
  });

  const { data: creator } = useQuery({
    queryKey: [`creator`, accountName],

    queryFn: () =>
      config.network_type === "localnet"
        ? null
        : BlockchainApiManager.getV2Creator(accountName),
  });

  const breakdown = calculateBreakDown({ account, delband, userres });

  if (!accountName) {
    return (
      <>
        <div className="cont_sec acc_sec">
          <p>Please login to view account.</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="acc_sec_wide">
          <div className="cont_sec acc_sec">
            <h2>Account Not Found</h2>
            <p>Cannot find Account {accountName}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{accountName} | Account - WAX Explorer</title>
      </Helmet>

      <div className="acc_sec_wide">
        <div className="cont_sec acc_sec">
          <h2>{account ? account.account_name : <Skeleton />}</h2>
          {account ? (
            <p>
              Created {fromNow(creator?.timestamp || account.created)}&nbsp;
              {creator?.creator && creator.creator !== "__self__" ? (
                <>
                  by&nbsp;
                  <Link
                    to={`/account/${creator.creator}`}
                    style={{ color: "#7D70F6" }}
                  >
                    {creator.creator}
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}

          <div className="util_box">
            <div className="util_block">
              <div className="balance_box">
                <ul>
                  <li>
                    <div>
                      <span className="name">
                        {account ? (
                          `${tokenFormat(breakdown.totalBalance, 3)} ${
                            config.token_symbol
                          }`
                        ) : (
                          <Skeleton />
                        )}
                        <span className="sub_value">
                          {account && tokenPrice >= 0 ? (
                            `$${currencyFormat(
                              breakdown.totalBalance * tokenPrice,
                            )}`
                          ) : (
                            <Skeleton />
                          )}
                        </span>
                      </span>
                    </div>
                    <div className="sub_text">
                      Total {config.token_symbol} Balance
                    </div>
                  </li>
                  <li>
                    <div className="name">
                      {account ? (
                        `${tokenFormat(breakdown.liquidBalance, 3)} ${
                          config.token_symbol
                        }`
                      ) : (
                        <Skeleton />
                      )}
                      <span className="sub_value">
                        {account && tokenPrice >= 0 ? (
                          `$${currencyFormat(
                            breakdown.liquidBalance * tokenPrice,
                          )}`
                        ) : (
                          <Skeleton />
                        )}
                      </span>
                    </div>
                    <div className="sub_text">
                      Available {config.token_symbol} Balance
                    </div>
                  </li>
                </ul>
              </div>
              <div className="performance_box">
                <ul className="performance">
                  <li>
                    {account ? (
                      tokenFormat(
                        breakdown.cpuStakedSelf +
                          breakdown.cpuStakedToOthers +
                          breakdown.netStakedSelf +
                          breakdown.netStakedToOthers,
                        3,
                      )
                    ) : (
                      <Skeleton />
                    )}{" "}
                    {config.token_symbol}
                    <span>
                      Total staked
                      <small>
                        CPU{" "}
                        {tokenFormat(
                          breakdown.cpuStakedSelf + breakdown.cpuStakedToOthers,
                          0,
                        )}{" "}
                        / NET{" "}
                        {tokenFormat(
                          breakdown.netStakedSelf + breakdown.netStakedToOthers,
                          0,
                        )}
                      </small>
                    </span>
                  </li>
                  <li>
                    {account ? (
                      `${tokenFormat(breakdown.stakedByOthers, 3)} ${
                        config.token_symbol
                      }`
                    ) : (
                      <Skeleton />
                    )}
                    <span>Staked by others</span>
                  </li>
                  <li>
                    {account ? (
                      `${tokenFormat(breakdown.unstaking, 3)} ${
                        config.token_symbol
                      }`
                    ) : (
                      <Skeleton />
                    )}
                    <span>Refunding</span>
                  </li>
                </ul>
              </div>
              {account ? (
                <ResourceUtilization account={account} />
              ) : (
                <Skeleton />
              )}
            </div>
          </div>
        </div>
        {config.network_type === "mainnet" ||
        config.network_type === "testnet" ? (
          <div className="widget_box">
            <DownloadTransfers account_name={accountName} />
          </div>
        ) : null}
      </div>
      <div className="cont_sec tab_sec">
        <h2>Recent Activity</h2>
        <ul className="tabbbing">
          <li
            className={`${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => history.push({ hash: "transactions" })}
          >
            <a href="#transactions">Transactions</a>
          </li>
          {config.network_type === "mainnet" ||
          config.network_type === "testnet" ? (
            <li
              className={`${activeTab === "nft-assets" ? "active" : ""}`}
              onClick={() => history.push({ hash: "nft-assets" })}
            >
              <a href="#nft-assets">NFT Assets</a>
            </li>
          ) : null}
          <li
            className={`${activeTab === "tokens" ? "active" : ""}`}
            onClick={() => history.push({ hash: "tokens" })}
          >
            <a href="#tokens">Tokens</a>
          </li>
          <li
            className={`${activeTab === "votes" ? "active" : ""}`}
            onClick={() => history.push({ hash: "votes" })}
          >
            <a href="#votes">Votes</a>
          </li>
          <li
            className={`${activeTab === "keys" ? "active" : ""}`}
            onClick={() => history.push({ hash: "keys" })}
          >
            <a href="#keys">Keys</a>
          </li>
          <li
            className={`${activeTab === "staked" ? "active" : ""}`}
            onClick={() => history.push({ hash: "staked-from" })}
          >
            <a href="#staked-to">Staked</a>
          </li>

          {accountAbi && accountAbi.abi ? (
            <>
              <li
                className={`${activeTab === "contract-tables" ? "active" : ""}`}
                onClick={() => history.push({ hash: "contract-tables" })}
              >
                <a href="#contract-tables">Contract Tables</a>
              </li>
              <li
                className={`${
                  activeTab === "contract-actions" ? "active" : ""
                }`}
                onClick={() => history.push({ hash: "contract-actions" })}
              >
                <a href="#contract-actions">Contract Actions</a>
              </li>

              <li
                className={`${activeTab === "contract-abi" ? "active" : ""}`}
                onClick={() => history.push({ hash: "contract-abi" })}
              >
                <a href="#contract-abi">Contract ABI</a>
              </li>
            </>
          ) : null}
        </ul>
        <div
          className={`tab transactions no_scroll ${
            activeTab === "transactions" ? "active" : null
          }`}
          //id="transactions"
        >
          {activeTab === "transactions" ? (
            <Transactions balances={balances} />
          ) : null}
        </div>
        <div
          className={`tab nft-assets ${
            activeTab === "nft-assets" ? "active" : null
          }`}
          //id="nft-assets"
        >
          {activeTab === "nft-assets" ? (
            <NftAssets key={accountName} />
          ) : null}
        </div>
        <div
          className={`tab tokens ${activeTab === "tokens" ? "active" : null}`}
          //id="tokens"
        >
          {activeTab === "tokens" ? <Tokens balances={balances} /> : null}
        </div>
        <div
          className={`tab votes ${activeTab === "votes" ? "active" : null}`}
          //id="votes"
        >
          {activeTab === "votes" ? (
            <Votes account={account} accInfo={accInfo} />
          ) : null}
        </div>
        <div
          className={`tab listing keys ${
            activeTab === "keys" ? "active" : null
          }`}
          //id="keys"
          style={{ color: "#fff" }}
        >
          {activeTab === "keys" ? (
            <Keys account={account} accInfo={accInfo} />
          ) : null}
        </div>
        <div
          className={`tab staked ${activeTab === "staked" ? "active" : null}`}
          //id="staked"
        >
          {activeTab === "staked" ? (
            <Staked account={account} accInfo={accInfo} />
          ) : null}
        </div>
        {accountAbi && accountAbi.abi ? (
          <>
            <div
              className={`tab contract-tables ${
                activeTab === "contract-tables" ? "active" : null
              }`}
              //id="contract-tables"
            >
              {activeTab === "contract-tables" ? (
                <ContractTables accountAbi={accountAbi} />
              ) : null}
            </div>
            <div
              className={`tab contract-actions ${
                activeTab === "contract-actions" ? "active" : null
              }`}
              //id="contract-actions"
            >
              {activeTab === "contract-actions" ? (
                <ContractActions accountAbi={accountAbi} />
              ) : null}
            </div>

            <div
              className={`tab contract-abi ${
                activeTab === "contract-abi" ? "active" : null
              }`}
              //id="contract-abi"
            >
              {activeTab === "contract-abi" ? (
                <ContractAbi accountAbi={accountAbi} />
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

export default Account;
