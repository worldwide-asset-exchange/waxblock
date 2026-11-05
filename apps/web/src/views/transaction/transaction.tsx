import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import BlockchainApiManager from "../../app/services/blockchainApiManager";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";

import { WalletContext } from "../../app/contexts/wallet-context";
import { useContext, useEffect, useState } from "react";
import DisplayActionData from "../../app/components/blockchain/action/display-action-data";
import { diffSeconds, momentformat } from "../../app/utilities/date";
import TransactionTraces from "./components/transaction-traces";
import JsonViewer from "../../app/components/ui/JsonViewer";

const Transaction = () => {
  const [now, setNow] = useState(() => new Date());
  const wallet = useContext(WalletContext);
  const { setMultisig } = wallet;
  const params = useParams();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "actions";

  const {
    isLoading,
    error,
    data: transaction,
  } = useQuery({
    queryKey: [`transaction`, params.id],
    queryFn: () => BlockchainApiManager.getTransaction(params.id),
  });

  const transactionTraces = transaction?.traces ?? [];

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const elapsedSeconds = transaction
    ? diffSeconds(`${transaction.block_time}Z`, now)
    : null;
  const isPendingIrreversibility =
    elapsedSeconds !== null && elapsedSeconds <= 180;
  const timeLeft = isPendingIrreversibility
    ? Math.max(0, 180 - elapsedSeconds)
    : null;

  const copyAsMsig = (e) => {
    e.preventDefault();

    const walletTransaction = {};
    walletTransaction.type = "msig";
    walletTransaction.actions = [];

    if (
      transaction &&
      transaction.trx &&
      transaction.trx.trx &&
      transaction.trx.trx.actions
    ) {
      transaction.trx.trx.actions.forEach(function (action) {
        walletTransaction.actions.push(action);
      });
    }

    //wallet.multisig.mode = true;
    //wallet.multisig.walletTransaction = Object.assign({}, walletTransaction);

    setMultisig((multisig) => ({
      ...multisig,
      mode: true,
      walletTransaction: Object.assign({}, walletTransaction),
    }));

    navigate("/wallet/msig");
  };

  if (!params?.id) {
    return (
      <>
        <div className="block_detail_sec">
          <div className="cont_sec acc_sec">
            <h2>Transaction Not Found</h2>
          </div>
        </div>
      </>
    );
  }

  if (!isLoading && (error || !transaction || !transaction.id)) {
    return (
      <>
        <div className="block_detail_sec">
          <div className="cont_sec acc_sec">
            <h2>Transaction Not Found</h2>
            <p>
              Cannot find Transaction with the ID {params.id}. Please check the
              transaction ID or try again after a few minutes.{" "}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{params.id} | Transaction - WAX Explorer</title>
      </Helmet>
      <div className="block_detail_sec">
        <div className="cont_sec acc_sec">
          <h2>Transaction</h2>
          <div className="util_box">
            <div className="util_block">
              <div className="block_id">
                <h3>
                  Transaction #
                  {(transaction && transaction.id) || (
                    <Skeleton style={{ width: "80%" }} />
                  )}
                  <span>
                    {(transaction &&
                      momentformat(
                        transaction.block_time,
                        "MMM DD YYYY, HH:mm:ss.SSS",
                      )) || <Skeleton />}
                  </span>
                </h3>
              </div>
              <div className="performance_box">
                <ul className="performance">
                  <li>
                    {transaction ? (
                      <Link to={`/block/${transaction.block_num}`}>
                        {parseInt(transaction.block_num).toLocaleString()}
                      </Link>
                    ) : (
                      <Skeleton />
                    )}
                    <span>Block Number</span>
                  </li>

                  <li>
                    {transaction ? (
                      <>{transaction.trx.receipt.cpu_usage_us} µs</>
                    ) : (
                      <Skeleton style={{ width: "200px" }} />
                    )}
                    <span>CPU Usage</span>
                  </li>
                  <li>
                    {transaction ? (
                      <>{transaction.trx.receipt.net_usage_words * 8} Bytes</>
                    ) : (
                      <Skeleton style={{ width: "200px" }} />
                    )}
                    <span>NET Usage</span>
                  </li>
                  <li>
                    {transaction &&
                    transaction.trx &&
                    transaction.trx.trx &&
                    transaction.trx.trx.actions ? (
                      <>{transaction.trx.trx.actions.length}</>
                    ) : (
                      <Skeleton style={{ width: "200px" }} />
                    )}
                    <span># of Actions</span>
                  </li>
                  <li>
                    {transaction ? (
                      <>{transactionTraces.length}</>
                    ) : (
                      <Skeleton style={{ width: "200px" }} />
                    )}
                    <span># of Traces</span>
                  </li>
                  <li>
                    {transaction ? (
                      <>
                        {/* {transaction.trx.receipt.status === "executed" ? (
                          <span className="type">Executed</span>
                        ) : null} */}
                        {isPendingIrreversibility ? (
                          <>Pending Irreversibility ({timeLeft}s)</>
                        ) : (
                          <>Irreversible</>
                        )}
                      </>
                    ) : (
                      <Skeleton style={{ width: "200px" }} />
                    )}
                    <span>Status</span>
                  </li>
                </ul>
                {/*<ul className="performance">
                 
                 <li>
                    0e3f7c1468ab120fd56ad687fa...<span>Block ID</span>
                  </li>
                  <li>
                    1,504.91 M<span>Total Block CPU</span>
                  </li>
                  <li>
                    238500 K<span>Total Block NET</span>
                  </li>
                  <li>
                    13<span>Number of Actions</span>
                  </li>
                  <li>
                    9<span>Number of Transactions</span>
                  </li> 
                </ul>*/}
              </div>
              <a href="#" className="more_btn" onClick={copyAsMsig}>
                Copy As MSIG
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="cont_sec tab_sec block_detail">
        <h2>Transaction Summary</h2>
        <ul className="tabbbing">
          <li className={`${activeTab === "actions" ? "active" : ""}`}>
            <a
              href="#actions"
              onClick={() => setSearchParams({ tab: "actions" })}
            >
              Actions
            </a>
          </li>
          <li className={`${activeTab === "traces" ? "active" : ""}`}>
            <a
              href="#traces"
              onClick={() => setSearchParams({ tab: "traces" })}
            >
              Traces
            </a>
          </li>
          <li className={`${activeTab === "ram" ? "active" : ""}`}>
            <a
              href="#ram"
              onClick={() => setSearchParams({ tab: "ram" })}
            >
              RAM Deltas
            </a>
          </li>
          <li className={`${activeTab === "raw" ? "active" : ""}`}>
            <a
              href="#raw"
              onClick={() => setSearchParams({ tab: "raw" })}
            >
              Raw
            </a>
          </li>
        </ul>
        <div
          className={`tab actions ${activeTab === "actions" ? "active" : ""}`}
          id="actions"
        >
          <table>
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Contract</th>
                <th style={{ width: "10%" }}>Name</th>
                <th style={{ width: "15%" }}>Authorization</th>
                <th style={{ width: "65%" }}>Data</th>
              </tr>
            </thead>
            <tbody>
              {!transaction &&
                Array(5)
                  .fill(0)
                  .map((item, index) => (
                    <tr key={index}>
                      <td style={{ width: "10%" }}>
                        <Skeleton />
                      </td>
                      <td style={{ width: "10%" }}>
                        <Skeleton />
                      </td>
                      <td style={{ width: "15%" }}>
                        <Skeleton />
                      </td>
                      <td style={{ width: "65%" }}>
                        <Skeleton />
                      </td>
                    </tr>
                  ))}
              {transaction &&
                transaction.trx &&
                transaction.trx.trx &&
                transaction.trx.trx.actions.map((action, index) => (
                  <tr key={index}>
                    <td style={{ width: "10%" }}>
                      <Link to={`/account/${action.account}`}>
                        {action.account}
                      </Link>
                    </td>
                    <td style={{ width: "10%" }}>{action.name}</td>
                    <td style={{ width: "15%" }}>
                      {action.authorization.map((authorization) => (
                        <>
                          <div style={{ paddingBottom: "5px" }}>
                            <Link
                              to={`/account/${authorization.actor}`}
                              className="btn btn-primary btn-sm"
                            >
                              <span className="type">
                                {" "}
                                {authorization.actor}
                              </span>
                            </Link>
                            &nbsp;
                            <span className="type">
                              {authorization.permission}
                            </span>
                          </div>
                        </>
                      ))}
                    </td>
                    <td style={{ width: "65%" /*wordBreak:'break-all'*/ }}>
                      <DisplayActionData action={action} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div
          className={`tab traces ${activeTab === "traces" ? "active" : ""}`}
          id="traces"
        >
          <TransactionTraces
            transaction={transaction}
            transactionTraces={transactionTraces}
          />
          {/* <table>
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Contract</th>
                <th style={{ width: "10%" }}>Name</th>
                <th style={{ width: "15%" }}>Authorization</th>
                <th style={{ width: "65%" }}>Data</th>
              </tr>
            </thead>
            <tbody>
              {!transaction &&
                Array(5)
                  .fill(0)
                  .map((item, index) => (
                    <tr key={index}>
                      <td style={{ width: "10%" }}>
                        <Skeleton />
                      </td>
                      <td style={{ width: "10%" }}>
                        <Skeleton />
                      </td>
                      <td style={{ width: "15%" }}>
                        <Skeleton />
                      </td>
                      <td style={{ width: "65%" }}>
                        <Skeleton />
                      </td>
                    </tr>
                  ))}
              {transaction &&
                transactionTraces.map((trace, index) => (
                  <tr key={index}>
                    <td style={{ width: "10%" }}>
                      <Link to={`/account/${trace.act.account}`}>
                        {trace.act.account}
                      </Link>
                    </td>
                    <td style={{ width: "10%" }}>{trace.act.name}</td>
                    <td style={{ width: "15%" }}>
                      {trace.act.authorization.map((authorization) => (
                        <>
                          <div style={{ paddingBottom: "5px" }}>
                            <Link
                              to={`/account/${authorization.actor}`}
                              className="btn btn-primary  btn-sm"
                            >
                              <span className="type">
                                {" "}
                                {authorization.actor}
                              </span>
                            </Link>
                            &nbsp;
                            <span className="type">
                              {authorization.permission}
                            </span>
                          </div>
                        </>
                      ))}
                    </td>
                    <td style={{ width: "65%"  }}>
                      <DisplayActionData action={trace.act} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table> */}
        </div>
        <div
          className={`tab ram ${activeTab === "ram" ? "active" : ""}`}
          id="ram"
        >
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {!transaction &&
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
                    </tr>
                  ))}
              {transaction &&
                transaction.traces &&
                transaction.traces
                  .filter((trace) => trace.account_ram_deltas.length > 0)
                  .map((trace) => (
                    <>
                      {trace.account_ram_deltas.map((account_ram_delta) => (
                        <tr
                          key={`${account_ram_delta.account}-${account_ram_delta.delta}`}
                        >
                          <td>{account_ram_delta.account}</td>
                          <td>
                            {account_ram_delta.delta > 0
                              ? "Consumed"
                              : "Released"}{" "}
                            {Math.abs(account_ram_delta.delta)} Bytes
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}

              {transaction &&
              transaction.traces &&
              transaction.traces.filter(
                (trace) => trace.account_ram_deltas.length > 0,
              ).length === 0 ? (
                <tr>
                  <td colSpan={2}>No RAM Deltas for this transaction</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div
          className={`tab raw ${activeTab === "raw" ? "active" : ""}`}
          id="raw"
        >
          <JsonViewer value={transaction?.raw || transaction} />
        </div>
      </div>
    </>
  );
};

export default Transaction;
