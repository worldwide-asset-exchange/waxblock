import Skeleton from "react-loading-skeleton";
import { Link } from "react-router";
import DisplayActionData from "../../../app/components/blockchain/action/display-action-data";
import { Fragment, useMemo } from "react";

const TransactionTrace = ({ trace }) => {
  const getTraceKey = (trace, index) =>
    trace.global_sequence || trace.action_ordinal || index;

  const notifiedAccounts = useMemo(() => {
    const accounts = [
      trace.act.account,
      trace.receiver,
      ...(trace.receipts || []).map((receipt) => receipt.receiver),
    ];
    if (trace.act.name === "transfer") {
      if (trace.act.data?.from) accounts.push(trace.act.data.from);
      if (trace.act.data?.to) accounts.push(trace.act.data.to);
    }
    return [...new Set(accounts)];
  }, [trace]);

  return (
    <>
      <tr>
        <td style={{ width: "10%", borderLeft: "1px solid #26264E" }}>
          &nbsp;&nbsp;
          <Link to={`/account/${trace.act.account}`}>{trace.act.account}</Link>
        </td>
        <td style={{ width: "10%" }}>{trace.act.name}</td>
        <td style={{ width: "15%" }}>
          {trace.act.authorization.map((authorization) => (
            <>
              <div style={{ paddingBottom: "5px" }}>
                <Link
                  to={`/account/${authorization.actor}`}
                  className="btn btn-primary btn-sm"
                >
                  <span className="type"> {authorization.actor}</span>
                </Link>
                &nbsp;
                <span className="type">{authorization.permission}</span>
              </div>
            </>
          ))}
        </td>
        <td style={{ width: "10%" }}>
          {notifiedAccounts.map((account) => (
            <>
              <div style={{ paddingBottom: "5px" }}>
                <Link
                  to={`/account/${account}`}
                  className="btn btn-primary btn-sm"
                >
                  <span className="type"> {account}</span>
                </Link>
              </div>
            </>
          ))}
        </td>
        <td style={{ width: "55%" /*wordBreak:'break-all'*/ }}>
          <DisplayActionData action={trace.act} />
        </td>
      </tr>
      {trace.children && trace.children.length > 0 ? (
        <tr>
          <td colSpan={5} style={{ borderBottom: "none", paddingTop: "0px" }}>
            <table style={{ marginLeft: "15px", marginBottom: "0px" }}>
              <tbody>
                {trace.children.map((trace, index) => (
                  <Fragment key={getTraceKey(trace, index)}>
                    <TransactionTrace trace={trace} />
                  </Fragment>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      ) : null}
    </>
  );
};

function buildTransactionTracesTree(transactionTraces, parentId = 0) {
  const results = [];

  for (const transactionTrace of transactionTraces) {
    if (
      transactionTrace.closest_unnotified_ancestor_action_ordinal === parentId
    ) {
      const children = buildTransactionTracesTree(
        transactionTraces,
        transactionTrace.action_ordinal,
      );

      const childrenAvoidDuplicates = children.filter(
        (trace) =>
          (transactionTrace.action_ordinal ||
            transactionTrace.global_sequence) !==
          (trace.action_ordinal || trace.global_sequence),
      );
      if (childrenAvoidDuplicates.length > 0) {
        transactionTrace.children = childrenAvoidDuplicates;
      }
      results.push(transactionTrace);
    }
  }

  return results;
}

const TransactionTraces = ({ transaction, transactionTraces }) => {
  const transactionTracesTree = useMemo(
    () => buildTransactionTracesTree(transactionTraces),
    [transactionTraces],
  );

  return (
    <table>
      <thead>
        <tr>
          <th style={{ width: "10%" }}>Contract</th>
          <th style={{ width: "10%" }}>Name</th>
          <th style={{ width: "15%" }}>Authorization</th>
          <th style={{ width: "10%" }}>Notified</th>
          <th style={{ width: "55%" }}>Data</th>
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
                <td style={{ width: "10%" }}>
                  <Skeleton />
                </td>
                <td style={{ width: "55%" }}>
                  <Skeleton />
                </td>
              </tr>
            ))}
        {transaction &&
          transactionTracesTree.map((trace, index) => (
            <Fragment key={index}>
              <TransactionTrace trace={trace} />
            </Fragment>
          ))}
      </tbody>
    </table>
  );
};

export default TransactionTraces;
