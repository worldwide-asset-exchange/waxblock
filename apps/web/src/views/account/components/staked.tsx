import { Link, useLocation } from "react-router";
import config from "../../../app/config";
import { createBrowserHistory } from "history";
import { tokenFormat } from "../../../app/utilities/format";
import { useState } from "react";
import { useEffect } from "react";

const Staked = ({ account, accInfo }) => {
  const location = useLocation();
  const history = createBrowserHistory();
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      const hash = location.hash.replace("#", "") || "staked-from";
      setActiveTab(hash);
    });
  }, [location]);

  if (!account) return;

  return (
    <>
      <ul className="tabbbing">
        <li
          className={`${activeTab === "staked-from" ? "active" : ""}`}
          onClick={() => {
            history.push({ hash: "staked-from" });
            setActiveTab("staked-from");
          }}
        >
          <a href="#staked-from">
            Staked from {account.account_name} (
            {(accInfo && accInfo.delegated_to.length) || 0})
          </a>
        </li>
        <li
          className={`${activeTab === "staked-to" ? "active" : ""}`}
          onClick={() => {
            history.push({ hash: "staked-to" });
            setActiveTab("staked-to");
          }}
        >
          <a href="#staked-to">
            Staked to {account.account_name} (
            {(accInfo && accInfo.delegated_from.length) || 0})
          </a>
        </li>
      </ul>
      <div
        className={`tab staked-from no_scroll ${
          activeTab === "staked-from" ? "active" : null
        }`}
        //id="staked-from"
      >
        <div className="table_row">
          <div className="table_row_inner">
            <table>
              <tbody>
                <tr>
                  <th>To</th>
                  <th>CPU Staked</th>
                  <th>NET Staked</th>
                  <th>Total Staked</th>
                </tr>
                {!accInfo || (accInfo && accInfo.delegated_to.length === 0) ? (
                  <tr>
                    <td colSpan={4}>No stakes found</td>
                  </tr>
                ) : null}
                {accInfo &&
                  accInfo.delegated_to.map((delegatedTo, index) => (
                    <tr key={index}>
                      <td>
                        <Link to={`/account/${delegatedTo.account_name}`}>
                          {delegatedTo.account_name}
                        </Link>
                      </td>
                      <td>
                        {tokenFormat(
                          delegatedTo.cpu_weight /
                            Math.pow(10, config.token_precision),
                        )}{" "}
                        WAX
                      </td>
                      <td>
                        {tokenFormat(
                          delegatedTo.net_weight /
                            Math.pow(10, config.token_precision),
                        )}{" "}
                        WAX
                      </td>
                      <td>
                        {tokenFormat(
                          Number(
                            parseFloat(delegatedTo.cpu_weight) +
                              parseFloat(delegatedTo.net_weight),
                          ) / Math.pow(10, config.token_precision),
                        )}{" "}
                        WAX
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        {accInfo && accInfo.delegated_to.length > 0 ? (
          <div className="btn_container">
            <Link to={`/wallet/resources/unstake`} className="more_btn">
              Unstake
            </Link>
          </div>
        ) : null}
      </div>
      <div
        className={`tab staked-to ${
          activeTab === "staked-to" ? "active" : null
        }`}
        // id="staked-to"
      >
        <table>
          <tbody>
            <tr>
              <th>To</th>
              <th>CPU Staked</th>
              <th>NET Staked</th>
              <th>Total Staked</th>
            </tr>
            {!accInfo || (accInfo && accInfo.delegated_from.length === 0) ? (
              <tr>
                <td colSpan={4}>No stakes found</td>
              </tr>
            ) : null}
            {accInfo &&
              accInfo.delegated_from.map((delegatedFrom, index) => (
                <tr key={index}>
                  <td>
                    <Link to={`/account/${delegatedFrom.del_from}`}>
                      {delegatedFrom.del_from}
                    </Link>
                  </td>
                  <td>
                    {tokenFormat(
                      delegatedFrom.cpu_weight /
                        Math.pow(10, config.token_precision),
                    )}{" "}
                    {config.token_symbol}
                  </td>
                  <td>
                    {tokenFormat(
                      delegatedFrom.net_weight /
                        Math.pow(10, config.token_precision),
                    )}{" "}
                    {config.token_symbol}
                  </td>
                  <td>
                    {tokenFormat(
                      Number(
                        parseFloat(delegatedFrom.cpu_weight) +
                          parseFloat(delegatedFrom.net_weight),
                      ) / Math.pow(10, config.token_precision),
                    )}{" "}
                    {config.token_symbol}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Staked;
