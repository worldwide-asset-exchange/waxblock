import { useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import BlockchainApiManager from "../../app/services/blockchainApiManager";
import { Api, JsonRpc } from "eosjs";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig";
import { hexToUint8Array } from "eosjs/dist/eosjs-serialize";
import config from "../../app/config";
import Skeleton from "react-loading-skeleton";
import { WalletContext } from "../../app/contexts/wallet-context";
import { Helmet } from "react-helmet-async";
import DisplayActionData from "../../app/components/blockchain/action/display-action-data";
import { momentformat } from "../../app/utilities/date";
import JsonViewer from "../../app/components/ui/JsonViewer";

const Msig = () => {
  const wallet = useContext(WalletContext);
  const { session, setMultisig } = wallet;
  const params = useParams();
  const navigate = useNavigate();
  const [approval, setApproval] = useState(null);
  const [transaction, setTransaction] = useState({});

  const { data: approvals2 } = useQuery({
    queryKey: [`approvals2`, params.scope, params.name],

    queryFn: () =>
      BlockchainApiManager.getTableRows({
        code: "eosio.msig",
        scope: params.scope,
        table: "approvals2",
        limit: -1,
      }),
  });

  const { data: proposal } = useQuery({
    queryKey: [`proposal`, params.scope, params.name],

    queryFn: () =>
      BlockchainApiManager.getTableRows({
        code: "eosio.msig",
        scope: params.scope,
        table: "proposal",
        limit: 1,
        lower_bound: params.name,
        key_type: "name",
      }),
  });

  useEffect(() => {
    if (approvals2 && approvals2.rows) {
      approvals2.rows.forEach((row) => {
        if (row.proposal_name === params.name) {
          setApproval(row);
        }
      });
    }
  }, [approvals2, params.name]);

  useEffect(() => {
    if (proposal && proposal.rows[0]) {
      (async () => {
        const signatureProvider = new JsSignatureProvider([]);
        const rpc = new JsonRpc(config.endpoints.default); //required to read blockchain state
        const api = new Api({ rpc, signatureProvider }); //required to submit transactions

        const packed_trx = proposal.rows[0].packed_transaction;

        const transaction = await api.deserializeTransaction(
          hexToUint8Array(packed_trx),
        );

        transaction.actions = await api.deserializeActions(transaction.actions);

        setTransaction(transaction);
      })();
    }
  }, [proposal]);

  const approve = (e) => {
    e.preventDefault();

    const walletTransaction = {};
    walletTransaction.type = "approve";
    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio.msig",
      name: "approve",
      data: {
        proposer: params.scope,
        proposal_name: params.name,
        level: {
          actor: session ? session.actor.toString() : null,
          permission: session ? session.permission.toString() : "active",
        },
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  const execute = (e) => {
    e.preventDefault();

    const walletTransaction = {};
    walletTransaction.type = "execute";
    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio.msig",
      name: "exec",
      data: {
        proposer: params.scope,
        proposal_name: params.name,
        executer: session ? session.actor.toString() : "",
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  const cancel = (e) => {
    e.preventDefault();

    const walletTransaction = {};
    walletTransaction.type = "cancel";
    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio.msig",
      name: "cancel",
      data: {
        proposer: params.scope,
        proposal_name: params.name,
        canceler: session ? session.actor.toString() : "",
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  const copyAsMsig = (e) => {
    e.preventDefault();

    const walletTransaction = {};
    walletTransaction.type = "msig";

    walletTransaction.requested_approvals = [
      ...approval.provided_approvals,
      ...approval.requested_approvals,
    ];

    walletTransaction.actions = [];

    if (transaction && transaction.actions) {
      transaction.actions.forEach(function (action) {
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

  if (!params.name || !params.scope) {
    <h2>The MSIG Proposal does not found</h2>;
  }

  return (
    <>
      <Helmet>
        <title>MSIG | Block - WAX Explorer</title>
      </Helmet>

      {approvals2 && !approval ? (
        <div className="block_detail_sec">
          <div className="cont_sec acc_sec">
            <h3>
              The MSIG Proposal {params.name} by {params.scope} has already been
              executed/cancelled or does not exist
            </h3>
          </div>
        </div>
      ) : null}

      {approvals2 && approval ? (
        <>
          <div className="block_detail_sec">
            <div className="cont_sec acc_sec">
              <h2>MSIG Details</h2>
              <div className="util_box">
                <div className="util_block">
                  <div className="performance_box">
                    <ul className="performance">
                      <li>
                        {params.scope}
                        <span>Proposer</span>
                      </li>
                      <li>
                        {params.name}
                        <span>Proposal name</span>
                      </li>
                      <li>
                        {approval ? (
                          <>
                            {approval.provided_approvals.length}/
                            {
                              [
                                ...approval.provided_approvals,
                                ...approval.requested_approvals,
                              ].length
                            }
                          </>
                        ) : (
                          <Skeleton />
                        )}
                        <span>Approval status</span>
                      </li>
                    </ul>
                  </div>
                  <a
                    href="#"
                    className="more_btn"
                    style={{ display: "inline-block" }}
                    onClick={approve}
                  >
                    Approve
                  </a>
                  <a
                    href="#"
                    className="more_btn"
                    style={{ display: "inline-block", marginLeft: "10px" }}
                    onClick={execute}
                  >
                    Execute
                  </a>
                  {session && session.actor.toString() === params.scope ? (
                    <a
                      href="#"
                      className="more_btn"
                      style={{
                        display: "inline-block",
                        marginLeft: "10px",
                        background: "#f00",
                      }}
                      onClick={cancel}
                    >
                      Cancel
                    </a>
                  ) : null}
                  <a
                    href="#"
                    className="more_btn"
                    style={{ display: "inline-block", marginLeft: "10px" }}
                    onClick={copyAsMsig}
                  >
                    Copy
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="cont_sec tab_sec">
            <h2 style={{ paddingBottom: "10px" }}>Multisig TX</h2>

            <h4>
              Expiration:{" "}
              {transaction
                ? momentformat(transaction.expiration, "MMM DD YYYY, HH:mm:ss")
                : null}
            </h4>
            <br />
            <div className="tab active">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>Authorization</th>
                    <th style={{ width: "20%" }}>Action</th>
                    <th style={{ width: "60%" }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {!transaction &&
                    !transaction.actions &&
                    Array(5)
                      .fill(0)
                      .map((item, index) => (
                        <tr key={index}>
                          <td style={{ width: "20%" }}>
                            <Skeleton />
                          </td>
                          <td style={{ width: "20%" }}>
                            <Skeleton />
                          </td>
                          <td style={{ width: "60%" }}>
                            <Skeleton />
                          </td>
                        </tr>
                      ))}
                  {transaction &&
                    transaction.actions &&
                    transaction.actions.map((action, index) => (
                      <tr key={index}>
                        <td style={{ width: "20%", whiteSpace: "nowrap" }}>
                          {action.authorization.map((authorization, index) => (
                            <div key={index} style={{ marginBottom: "5px" }}>
                              <Link to={`/account/${authorization.actor}`}>
                                <span className="type">
                                  {authorization.actor}
                                </span>
                              </Link>
                              &nbsp;
                              <span className="type">
                                {authorization.permission}
                              </span>
                            </div>
                          ))}
                        </td>
                        <td style={{ width: "20%", whiteSpace: "nowrap" }}>
                          <Link to={`/account/${action.account}`}>
                            <span className="type">{action.account}</span>
                          </Link>
                          &nbsp;
                          <span className="type">{action.name}</span>
                        </td>
                        <td style={{ width: "60%" /*,wordBreak:'break-all'*/ }}>
                          <DisplayActionData
                            action={action}
                            //account_name={params.account}
                          />
                          {/* <br/>
                    {JSON.stringify(action.action_trace.act.data)} */}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="cont_sec tab_sec block_detail">
            <ul className="tabbbing">
              <li className="active">
                <a href="#requestedApprovals">Requested Approvals</a>
              </li>
              <li>
                <a href="#raw">MSIG Raw</a>
              </li>
            </ul>
            <div
              className="tab requestedApprovals active"
              id="requestedApprovals"
            >
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Actor</th>
                    <th>Permission</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approval &&
                    [
                      ...approval.provided_approvals,
                      ...approval.requested_approvals,
                    ].map((all_approval, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{all_approval.level.actor}</td>
                        <td>{all_approval.level.permission}</td>
                        <td>
                          {all_approval.time === "1970-01-01T00:00:00.000" ? (
                            <span className="type">Pending</span>
                          ) : (
                            <span className="type">Approved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="tab raw" id="raw">
              <JsonViewer value={transaction} />
            </div>
          </div>
        </>
      ) : null}

      {!approvals2 && !approval ? (
        <>
          <Skeleton style={{ marginBottom: "30px" }} />
        </>
      ) : null}
    </>
  );
};

export default Msig;
