import { useState } from "react";
import { Link } from "react-router";
import { tokenFormat } from "../../../utilities/format";
import config from "../../../config";
import { sha256 } from "js-sha256";
import { hexToString } from "../../../utilities/utility";
import JsonViewer from "../../ui/JsonViewer";

type ActionData = Record<string, unknown>;

type DisplayAction = {
  account: string;
  name: string;
  data?: ActionData;
};

const DisplayActionData = ({
  action,
  account_name,
}: {
  action: DisplayAction;
  account_name?: string;
}) => {
  const [toggleLargeData, setToggleLargeData] = useState<
    Record<string, boolean>
  >({});
  const replacer = (_key: string, value: unknown) => {
    if (typeof value === "string") {
      return value.toString();
    } else {
      return value;
    }
  };

  const downloadAbi = async (action: DisplayAction) => {
    const abi = `"${action.data.abi}"`;

    const blob = new Blob([abi], { type: "octet/stream" });
    const url = window.URL.createObjectURL(blob);
    //window.location.assign(url);

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = account_name + ".abi";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadWasm = async (action) => {
    const wasm = `${action.data.code}`;

    const blob = new Blob([wasm], { type: "octet/stream" });
    const url = window.URL.createObjectURL(blob);
    //window.location.assign(url);

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = account_name + ".wasm";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (action.account === "eosio" && action.name === "buyram") {
    return (
      <>
        <Link to={`/account/${action.data.payer}`}>{action.data.payer}</Link>{" "}
        bought {tokenFormat(action.data.quant)} {config.token_symbol} of RAM for{" "}
        <Link to={`/account/${action.data.receiver}`}>
          {action.data.receiver}
        </Link>
      </>
    );
  }
  if (action.account === "eosio" && action.name === "buyrambytes") {
    return (
      <>
        <Link to={`/account/${action.data.payer}`}>{action.data.payer}</Link>{" "}
        bought {action.data.quant} bytes of RAM for{" "}
        <Link to={`/account/${action.data.receiver}`}>
          {action.data.receiver}
        </Link>
      </>
    );
  }

  if (action.account === "eosio" && action.name === "claimrewards") {
    return (
      <>
        <Link to={`/account/${action.data.owner}`}>{action.data.owner}</Link>{" "}
        claimed validator rewards
      </>
    );
  }

  if (action.account === "eosio" && action.name === "delegatebw") {
    return (
      <>
        <Link to={`/account/${action.data.from}`}>{action.data.from}</Link>{" "}
        staked {tokenFormat(action.data.stake_cpu_quantity)}{" "}
        {config.token_symbol} of CPU and{" "}
        {tokenFormat(action.data.stake_net_quantity)} {config.token_symbol} of
        NET from{" "}
        <Link to={`/account/${action.data.receiver}`}>
          {action.data.receiver}
        </Link>
      </>
    );
  }

  if (action.account === "eosio" && action.name === "undelegatebw") {
    return (
      <>
        <Link to={`/account/${action.data.from}`}>{action.data.from}</Link>{" "}
        unstaked {tokenFormat(action.data.unstake_cpu_quantity)}{" "}
        {config.token_symbol} of CPU and{" "}
        {tokenFormat(action.data.unstake_net_quantity)} {config.token_symbol} of
        NET from{" "}
        <Link to={`/account/${action.data.receiver}`}>
          {action.data.receiver}
        </Link>
      </>
    );
  }

  if (action.account === "eosio" && action.name === "sellram") {
    return (
      <>
        <Link to={`/account/${action.data.account}`}>
          {action.data.account}
        </Link>{" "}
        sold {action.data.bytes} bytes of RAM{" "}
      </>
    );
  }

  if (action.account === "eosio" && action.name === "voteproducer") {
    if (action.data.proxy !== "") {
      return (
        <>
          <Link to={`/account/${action.data.voter}`}>{action.data.voter}</Link>{" "}
          voted for proxy{" "}
          <Link to={`/account/${action.data.proxy}`}>{action.data.proxy}</Link>
        </>
      );
    } else {
      return (
        <>
          <Link to={`/account/${action.data.voter}`}>{action.data.voter}</Link>{" "}
          voted for producers <br />
          {action.data.producers.map((producer, index) => (
            <span
              style={{ display: "inline-block", width: "150px" }}
              key={index}
            >
              <Link to={`/account/${producer}`}>{producer}</Link>
            </span>
          ))}
        </>
      );
    }
  }

  if (action.account === "eosio.token" && action.name === "transfer") {
    if (account_name) {
      if (action.data.from === account_name) {
        return (
          <>
            <Link to={`/account/${action.data.from}`}>{action.data.from}</Link>{" "}
            sent {action.data.quantity} to{" "}
            <Link to={`/account/${action.data.to}`}>{action.data.to}</Link>
            {action.data.memo ? (
              <span style={{ display: "block" }}>Memo: {action.data.memo}</span>
            ) : null}
          </>
        );
      }

      return (
        <>
          <Link to={`/account/${action.data.to}`}>{action.data.to}</Link>{" "}
          received {action.data.quantity} from{" "}
          <Link to={`/account/${action.data.from}`}>{action.data.from}</Link>
          {action.data.memo ? (
            <span style={{ display: "block" }}>Memo: {action.data.memo}</span>
          ) : null}
        </>
      );
    }
  }

  if (action.name === "setabi") {
    return (
      <>
        <div>The ABI for {action.account} was updated. </div>
        <div>SHA256: {sha256(`"${action.data.abi}"`)}</div>
        <br />
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            downloadAbi(action);
          }}
        >
          Download ABI
        </a>
      </>
    );
  }

  if (action.name === "setcode") {
    return (
      <>
        <div>The Code for {action.account} was updated. </div>
        <div>
          SHA256: {action.data ? sha256(hexToString(action.data.code)) : null}
        </div>
        <br />
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            downloadWasm(action);
          }}
        >
          Download WASM
        </a>
      </>
    );
  }

  if (action.account === "delphioracle" && action.name === "write") {
    return (
      <>
        Oracle: {action.data.owner} <br />
        Prices: <br />
        {action.data.quotes.map((quote, index) => (
          <span style={{ display: "inline-block", width: "150px" }} key={index}>
            {quote.value} {quote.pair.toUpperCase()}
          </span>
        ))}
      </>
    );
  }

  if (action.account === "eosio" && action.name === "updateauth") {
    return (
      <>
        <Link to={`/account/${action.data.account}`}>
          {action.data.account}
        </Link>{" "}
        set the permission{" "}
        <strong style={{ textDecoration: "underline" }}>
          {action.data.permission}
        </strong>{" "}
        with the parent permission{" "}
        <strong style={{ textDecoration: "underline" }}>
          {action.data.parent}
        </strong>{" "}
        to have the authentication
        <JsonViewer value={action.data.auth} />
      </>
    );
  }

  if (action.account === "eosio" && action.name === "newaccount") {
    return (
      <>
        <Link to={`/account/${action.data.creator}`}>
          {action.data.creator}
        </Link>{" "}
        created the account{" "}
        <Link to={`/account/${action.data.name}`}>{action.data.name}</Link> with
        permissions set the permission
        <br />
        <br />
        <div style={{ paddingBottom: "15px" }}>
          <strong style={{ textDecoration: "underline" }}>@owner</strong>
          <JsonViewer value={action.data.owner} />
        </div>
        <div style={{ paddingBottom: "15px" }}>
          <strong style={{ textDecoration: "underline" }}>@active</strong>
          <JsonViewer value={action.data.active} />
        </div>
      </>
    );
  }

  if (action.account === "eosio.msig" && action.name === "approve") {
    return (
      <>
        <Link to={`/account/${action.data.level.actor}`}>
          {action.data.level.actor}
        </Link>{" "}
        approved the proposal{" "}
        <Link to={`/msig/${action.data.proposer}/${action.data.proposal_name}`}>
          {action.data.proposal_name}
        </Link>{" "}
        from{" "}
        <Link to={`/account/${action.data.proposer}`}>
          {action.data.proposer}
        </Link>
      </>
    );
  }

  if (action.account === "eosio.msig" && action.name === "exec") {
    return (
      <>
        <Link to={`/account/${action.data.executer}`}>
          {action.data.executer}
        </Link>{" "}
        executed proposal{" "}
        <Link to={`/msig/${action.data.proposer}/${action.data.proposal_name}`}>
          {action.data.proposal_name}
        </Link>{" "}
        from{" "}
        <Link to={`/account/${action.data.proposer}`}>
          {action.data.proposer}
        </Link>
      </>
    );
  }

  if (action.account === "eosio.msig" && action.name === "propose") {
    const dataKey = `${action.data.proposer}-${action.data.proposal_name}`;
    return (
      <>
        <Link to={`/account/${action.data.proposer}`}>
          {action.data.proposer}
        </Link>{" "}
        proposed multi-sig{" "}
        <Link to={`/msig/${action.data.proposer}/${action.data.proposal_name}`}>
          {action.data.proposal_name}
        </Link>{" "}
        with {action.data.trx.actions.length} actions and{" "}
        {action.data.requested.length} requested approvals
        <br />
        <div
          style={{
            display:
              typeof toggleLargeData[dataKey] === "boolean" &&
              !toggleLargeData[dataKey]
                ? "none"
                : "block",
          }}
        >
          <JsonViewer value={action.data.trx} />
        </div>
        {typeof toggleLargeData[dataKey] === "undefined"
          ? setToggleLargeData({
              ...toggleLargeData,
              [dataKey]: false,
            })
          : null}
        {typeof toggleLargeData[dataKey] === "boolean" ? (
          <span style={{ paddingLeft: 0 }}>
            <span
              style={{ cursor: "pointer", color: "#7D70F6" }}
              onClick={(e) => {
                e.preventDefault();
                setToggleLargeData({
                  ...toggleLargeData,
                  [dataKey]: toggleLargeData[dataKey] ? false : true,
                });
              }}
            >
              (
              {toggleLargeData[dataKey]
                ? "Hide Transaction"
                : "View Transaction"}
              )
            </span>
          </span>
        ) : null}
      </>
    );
  }

  if (action.account === "eosio.msig" && action.name === "cancel") {
    return (
      <>
        <Link to={`/account/${action.data.canceler}`}>
          {action.data.canceler}
        </Link>{" "}
        cancelled proposal{" "}
        <Link to={`/msig/${action.data.proposer}/${action.data.proposal_name}`}>
          {action.data.proposal_name}
        </Link>{" "}
        from{" "}
        <Link to={`/account/${action.data.proposer}`}>
          {action.data.proposer}
        </Link>
      </>
    );
  }

  const renderData = (data: ActionData | undefined, level: number = 0) => {
    //console.log(data);
    if (!data) return;
    return (
      <>
        {data &&
          Object.keys(data).map((dataKey, dataIndex) => (
            <div
              key={dataIndex}
              style={{
                paddingLeft: `${level > 0 ? 20 : 0}px`,
                maxWidth: "991px",
                textOverflow: "ellipsis",
              }}
              data-level={level}
            >
              <span className="fw-bold">{dataKey}: </span>

              {typeof data[dataKey] === "boolean" ? (
                <span
                  style={{
                    maxWidth: "767px",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    display: "block",
                  }}
                >
                  {data[dataKey].toString()}
                </span>
              ) : null}

              {typeof data[dataKey] === "object" &&
              Array.isArray(data[dataKey]) ? (
                <>
                  {data[dataKey].length > 15 &&
                  typeof toggleLargeData[dataKey] === "undefined"
                    ? setToggleLargeData({
                        ...toggleLargeData,
                        [dataKey]: false,
                      })
                    : null}
                  {typeof toggleLargeData[dataKey] === "boolean" ? (
                    <span style={{ paddingLeft: 0 }}>
                      <span
                        style={{ cursor: "pointer", color: "#7D70F6" }}
                        onClick={(e) => {
                          e.preventDefault();
                          setToggleLargeData({
                            ...toggleLargeData,
                            [dataKey]: toggleLargeData[dataKey] ? false : true,
                          });
                        }}
                      >
                        (
                        {toggleLargeData[dataKey]
                          ? "Collapse to hide large data"
                          : "Expand to show large data"}
                        )
                      </span>
                    </span>
                  ) : null}
                  <div
                    style={{
                      paddingLeft: "20px",
                      paddingBottom: "10px",
                      display:
                        (typeof toggleLargeData[dataKey] === "boolean" &&
                          !toggleLargeData[dataKey]) ||
                        data[dataKey].length === 0
                          ? "none"
                          : "block",
                    }}
                  >
                    {data[dataKey].map((dataValue, valueIndex) => (
                      <div key={valueIndex} style={{ paddingBottom: "10px" }}>
                        {typeof dataValue === "object" ? (
                          <>
                            {dataKey === "immutable_template_data" ||
                            dataKey === "immutable_data" ||
                            dataKey === "mutable_data" ? (
                              <>
                                {dataValue["first"] ? (
                                  <span>
                                    {dataValue["first"]}:{" "}
                                    {dataValue["second"][1]}
                                  </span>
                                ) : (
                                  <span>
                                    {dataValue["key"]}: {dataValue["value"][1]}
                                  </span>
                                )}
                              </>
                            ) : (
                              // <span>{JSON.stringify(dataValue, replacer)}</span>
                              // <>
                              //   {Object.keys(dataValue).map(
                              //     (dataValueKey, dataValueIndex) => (
                              //       <>
                              //         <div>
                              //           <span>
                              //             {dataValueKey}:{" "}
                              //             {dataValue[dataValueKey]}{" "}
                              //           </span>
                              //         </div>
                              //       </>
                              //     )
                              //   )}
                              // </>
                              <>{renderData(dataValue, ++level)}</>
                            )}
                          </>
                        ) : (
                          <span>{dataValue}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {typeof data[dataKey] === "object" &&
              !Array.isArray(data[dataKey]) ? (
                // <span>{JSON.stringify(data[dataKey], replacer)}</span>
                <>{renderData(data[dataKey], ++level)}</>
              ) : null}

              {typeof data[dataKey] !== "object" ? (
                <>
                  {(() => {
                    switch (dataKey) {
                      case "from":
                      case "to":
                      case "owner":
                      case "claimer":
                      case "miner":
                      case "authorized_minter":
                      case "collection_name":
                      case "new_asset_owner":
                      case "contract":
                      case "asset_owner":
                        return (
                          <span>
                            <Link to={`/account/${data[dataKey]}`}>
                              {data[dataKey]}
                            </Link>
                          </span>
                        );
                      default:
                        return <span>{data[dataKey]}</span>;
                    }
                  })()}
                </>
              ) : null}
            </div>
          ))}
      </>
    );
  };

  return <>{renderData(action.data)}</>;

  return (
    <>
      {action.data &&
        Object.keys(action.data).map((dataKey, index) => (
          <div key={index}>
            <span className="fw-bold">{dataKey}: </span>
            {typeof action.data[dataKey] === "object" &&
            Array.isArray(action.data[dataKey]) ? (
              <>
                {action.data[dataKey].length > 15 &&
                typeof toggleLargeData[dataKey] === "undefined"
                  ? setToggleLargeData({ ...toggleLargeData, [dataKey]: false })
                  : null}
                {typeof toggleLargeData[dataKey] === "boolean" ? (
                  <span style={{ paddingLeft: 0 }}>
                    <span
                      style={{ cursor: "pointer", color: "#7D70F6" }}
                      onClick={(e) => {
                        e.preventDefault();
                        setToggleLargeData({
                          ...toggleLargeData,
                          [dataKey]: toggleLargeData[dataKey] ? false : true,
                        });
                      }}
                    >
                      (
                      {toggleLargeData[dataKey]
                        ? "Collapse to hide large data"
                        : "Expand to show large data"}
                      )
                    </span>
                  </span>
                ) : null}
                <div
                  style={{
                    paddingLeft: "20px",
                    paddingBottom: "10px",
                    display:
                      (typeof toggleLargeData[dataKey] === "boolean" &&
                        !toggleLargeData[dataKey]) ||
                      action.data[dataKey].length === 0
                        ? "none"
                        : "block",
                  }}
                >
                  {action.data[dataKey].map((dataValue, valueIndex) => (
                    <div key={valueIndex} style={{ paddingBottom: "10px" }}>
                      {typeof dataValue === "object" ? (
                        <>
                          {dataKey === "immutable_template_data" ||
                          dataKey === "immutable_data" ||
                          dataKey === "mutable_data" ? (
                            <>
                              <span>
                                {dataValue["key"]}: {dataValue["value"][1]}
                              </span>
                            </>
                          ) : (
                            // <span>{JSON.stringify(dataValue, replacer)}</span>
                            <>
                              {Object.keys(dataValue).map((dataValueKey) => (
                                <>
                                  <div>
                                    <span>
                                      {dataValueKey}:{" "}
                                      {dataValue[dataValueKey]}{" "}
                                    </span>
                                  </div>
                                </>
                              ))}
                            </>
                          )}
                        </>
                      ) : (
                        <span>{dataValue}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {typeof action.data[dataKey] === "object" &&
            !Array.isArray(action.data[dataKey]) ? (
              <span>{JSON.stringify(action.data[dataKey], replacer)}</span>
            ) : null}

            {typeof action.data[dataKey] !== "object" ? (
              <>
                {(() => {
                  switch (dataKey) {
                    case "from":
                    case "to":
                    case "owner":
                    case "claimer":
                    case "miner":
                    case "authorized_minter":
                    case "collection_name":
                    case "new_asset_owner":
                    case "contract":
                    case "asset_owner":
                      return (
                        <span>
                          <Link to={`/account/${action.data[dataKey]}`}>
                            {action.data[dataKey]}
                          </Link>
                        </span>
                      );
                    default:
                      return <span>{action.data[dataKey]}</span>;
                  }
                })()}
              </>
            ) : null}
          </div>
        ))}
    </>
  );
};

export default DisplayActionData;
