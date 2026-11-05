import { Link, useParams } from "react-router";
import BlockchainApiManager from "../../app/services/blockchainApiManager";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import { useEffect, useState } from "react";
import { getShortTrxId } from "../../app/utilities/transaction";
import { diffSeconds, momentformat } from "../../app/utilities/date";
import JsonViewer from "../../app/components/ui/JsonViewer";

const Block = () => {
  const [now, setNow] = useState(() => new Date());
  const params = useParams();

  const { error, data: block } = useQuery({
    queryKey: [`block`, params.id],
    queryFn: () => BlockchainApiManager.getBlock(params.id),
    suspense: false,
  });

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const elapsedSeconds = block
    ? diffSeconds(`${block.timestamp}Z`, now)
    : null;
  const isPendingIrreversibility =
    elapsedSeconds !== null && elapsedSeconds <= 180;
  const timeLeft = isPendingIrreversibility
    ? Math.max(0, 180 - elapsedSeconds)
    : null;

  const getTotalCpuUsage = () => {
    const totalCpuUsage = block.transactions
      .filter(function (transaction) {
        return transaction.cpu_usage_us;
      })
      .reduce(function (totalCpuUsage, transaction) {
        return totalCpuUsage + transaction.cpu_usage_us;
      }, 0);

    return totalCpuUsage;
  };

  const getTotalNetUsage = () => {
    const totalNetUsage = block.transactions
      .filter(function (transaction) {
        return transaction.net_usage_words;
      })
      .reduce(function (totalNetUsage, transaction) {
        return totalNetUsage + transaction.net_usage_words;
      }, 0);

    return totalNetUsage;
  };

  const getTotalActions = () => {
    const totalActions = block.transactions
      .filter(function (transaction) {
        return transaction.trx.transaction
          ? transaction.trx.transaction.actions.length
          : 0;
      })
      .reduce(function (totalActions, transaction) {
        return (
          totalActions +
          (transaction.trx.transaction
            ? transaction.trx.transaction.actions.length
            : 0)
        );
      }, 0);

    return totalActions;
  };

  if (!params.id) {
    return (
      <>
        <div className="block_detail_sec">
          <div className="cont_sec acc_sec">
            <h2>Block Not Found</h2>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="block_detail_sec">
          <div className="cont_sec acc_sec">
            <h2>Block Not Found</h2>
            <p>Cannot find Block {params.id.toLocaleString()}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{params?.id || ""} | Block - WAX Explorer</title>
      </Helmet>
      <div className="block_detail_sec">
        <div className="cont_sec acc_sec">
          <h2>Block Detail</h2>

          <div className="util_box">
            <div className="util_block">
              <div className="block_id">
                <h3>
                  Block #
                  {(block && block.block_num.toLocaleString()) || <Skeleton />}
                  <span>{(block && block.id) || <Skeleton />}</span>
                  <span>
                    {(block &&
                      momentformat(
                        block.timestamp,
                        "MMM DD YYYY, HH:mm:ss.SSS",
                      )) || <Skeleton />}
                  </span>
                </h3>
              </div>

              <div className="performance_box">
                <ul className="performance">
                  <li>
                    {block ? (
                      <Link to={`/account/${block.producer}`}>
                        {block.producer}
                      </Link>
                    ) : (
                      <Skeleton />
                    )}
                    <span>Producer Name</span>
                  </li>
                  <li>
                    {block ? <>{getTotalCpuUsage()} μs</> : <Skeleton />}
                    <span>CPU Usage</span>
                  </li>
                  <li>
                    {block ? <>{getTotalNetUsage() * 8} bytes</> : <Skeleton />}
                    <span>NET Usage</span>
                  </li>
                  <li>
                    {block ? getTotalActions() : <Skeleton />}
                    <span>Number of Actions</span>
                  </li>
                  <li>
                    {(block && block.transactions.length) || <Skeleton />}
                    <span>Number of Transactions</span>
                  </li>
                </ul>

                <ul className="performance">
                  <li>
                    {block ? (
                      isPendingIrreversibility ? (
                        <>Pending Irreversibility ({timeLeft}s)</>
                      ) : (
                        <>Irreversible</>
                      )
                    ) : (
                      <Skeleton />
                    )}
                    <span>Status</span>
                  </li>
                  <li>
                    {(block && block.id) || <Skeleton />}
                    <span>Block ID</span>
                  </li>
                  <li>
                    {block ? (
                      <Link to={`/block/${block.block_num - 1}`}>
                        {(block.block_num - 1).toLocaleString()}
                      </Link>
                    ) : (
                      <Skeleton />
                    )}
                    <span>Previous Block</span>
                  </li>
                  <li>
                    {block ? (
                      <Link to={`/block/${block.block_num + 1}`}>
                        {(block.block_num + 1).toLocaleString()}
                      </Link>
                    ) : (
                      <Skeleton />
                    )}
                    <span>Next Block</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cont_sec tab_sec block_detail">
        <h2>Recent Activity</h2>

        <ul className="tabbbing">
          <li className="active">
            <a href="#transactions">Transactions</a>
          </li>
          <li>
            <a href="#raw">Raw</a>
          </li>
        </ul>

        <div className="tab transactions active" id="transactions">
          <table>
            <thead>
              <tr>
                <th>TX ID</th>
                <th>Expiration</th>
                <th>CPU Usage</th>
                <th>NET Usage</th>
                <th>Number of Actions</th>
              </tr>
            </thead>
            <tbody>
              {!block &&
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
                    </tr>
                  ))}
              {block &&
                block.transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td>
                      <Link
                        to={`/transaction/${
                          transaction.trx.id
                            ? transaction.trx.id
                            : transaction.trx
                        }`}
                      >
                        {transaction.trx.id
                          ? getShortTrxId(transaction.trx.id)
                          : getShortTrxId(transaction.trx)}
                      </Link>
                    </td>
                    <td>
                      {transaction.trx.transaction
                        ? momentformat(
                            transaction.trx.transaction.expiration,
                            "MMM DD YYYY, HH:mm:ss",
                          )
                        : "N/A"}
                    </td>
                    <td>
                      {transaction.cpu_usage_us || 0}
                      μs
                    </td>
                    <td>
                      {(transaction.net_usage_words || 0) * 8}
                      Bytes
                    </td>
                    <td>
                      {transaction.trx.transaction
                        ? transaction.trx.transaction.actions.length
                        : "0"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="tab raw" id="raw">
          <JsonViewer value={block} />
        </div>
      </div>
    </>
  );
};

export default Block;
