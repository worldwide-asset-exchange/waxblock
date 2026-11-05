import { useContext } from "react";
import { WalletContext } from "../../../app/contexts/wallet-context";
import { calculateBreakDown } from "../../../app/utilities/account";
import { currencyFormat, tokenFormat } from "../../../app/utilities/format";
import ResourceUtilization from "./resource-utilization";
import { momentformat } from "../../../app/utilities/date";
import config from "../../../app/config";

const AccountSummary = () => {
  const wallet = useContext(WalletContext);
  const { tokenPrice } = wallet;
  const { account, delband, userres } = wallet.walletAccount;

  if (!account) return;

  const breakdown = calculateBreakDown({ account, delband, userres });
  const totalStaked =
    breakdown.cpuStakedSelf +
    breakdown.cpuStakedToOthers +
    breakdown.netStakedSelf +
    breakdown.netStakedToOthers;
  const resourceDetail = `CPU ${tokenFormat(
    breakdown.cpuStakedSelf + breakdown.cpuStakedToOthers,
    0,
  )} / NET ${tokenFormat(
    breakdown.netStakedSelf + breakdown.netStakedToOthers,
    0,
  )}`;

  return (
    <>
      <div className="wallet_sec">
        <div className="cont_sec acc_sec">
          <div className="util_box">
            <div className="util_block">
              <div className="left_desc">
                <div className="heading_sec">
                  <h2>My Wallet</h2>
                  <div className="block_id">
                    <h3>
                      {account.account_name}
                      <span>
                        Created:{" "}
                        {momentformat(account.created, "MMM DD YYYY, HH:mm:ss")}
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="performance_box">
                  <ul className="performance">
                    <li className="metric_primary">
                      <span>Total balance</span>
                      {tokenFormat(breakdown.totalBalance, 3)}{" "}
                      {config.token_symbol}
                      {tokenPrice ? (
                        <small>
                          ${currencyFormat(breakdown.totalBalance * tokenPrice)}
                        </small>
                      ) : null}
                    </li>
                    <li className="metric_primary">
                      <span>Available</span>
                      {tokenFormat(breakdown.liquidBalance, 3)}{" "}
                      {config.token_symbol}
                      {tokenPrice ? (
                        <small>
                          $
                          {currencyFormat(breakdown.liquidBalance * tokenPrice)}
                        </small>
                      ) : null}
                    </li>
                    <li>
                      <span>Staked resources</span>
                      {tokenFormat(totalStaked, 0)} {config.token_symbol}
                      <small>{resourceDetail}</small>
                    </li>
                    <li>
                      <span>Refunding</span>
                      {tokenFormat(breakdown.unstaking, 3)}{" "}
                      {config.token_symbol}
                      <small>
                        {tokenFormat(breakdown.stakedByOthers, 0)} staked by
                        others
                      </small>
                    </li>
                  </ul>
                </div>
              </div>
              <ResourceUtilization account={account} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountSummary;
