import { useContext, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { addHours, formatDistanceToNow } from "date-fns";
import { WalletContext } from "../../../../app/contexts/wallet-context";
import { momentformat, unixSeconds } from "../../../../app/utilities/date";

const Refund = () => {
  const wallet = useContext(WalletContext);
  const { session, walletAccount } = wallet;
  const { account } = walletAccount;
  const [timer, setTimer] = useState();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimer(unixSeconds());
    }, 1000);
    // clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId);
  }, []);

  const refundEnabled = useMemo(() => {
    if (!account?.refund_request) return false;
    return (
      (timer ?? unixSeconds()) >=
      unixSeconds(
        addHours(new Date(`${account.refund_request.request_time}Z`), 72),
      )
    );
  }, [account, timer]);

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "refund";
    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "refund",
      data: {
        owner: session ? session.actor.toString() : null,
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>Refund | Wallet - WAX Explorer</title>
      </Helmet>

      {session && account ? (
        <>
          {account.refund_request ? (
            <>
              <table>
                <tbody>
                  <tr>
                    <td>Refund Request:</td>
                    <td>
                      {momentformat(
                        account.refund_request.request_time,
                        "MMM DD YYYY, HH:mm:ss",
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>CPU Amount:</td>
                    <td>{account.refund_request.cpu_amount}</td>
                  </tr>
                  <tr>
                    <td>NET Amount:</td>
                    <td>{account.refund_request.net_amount}</td>
                  </tr>
                  <tr>
                    <td>Expected Refund:</td>
                    <td>
                      {momentformat(
                        addHours(
                          new Date(`${account.refund_request.request_time}Z`),
                          72,
                        ).toISOString(),
                        "MMM DD YYYY, HH:mm:ss",
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Time Left</td>
                    <td>
                      {refundEnabled
                        ? "Refund available!"
                        : formatDistanceToNow(
                            addHours(
                              new Date(
                                `${account.refund_request.request_time}Z`,
                              ),
                              72,
                            ),
                            { addSuffix: true },
                          )}
                    </td>
                  </tr>
                </tbody>
              </table>
              <input
                type="button"
                value={`Refund`}
                style={{
                  background: refundEnabled ? "#7D70F6" : "#404047",
                }}
                onClick={() => {
                  if (!refundEnabled) return;

                  handleClick();
                }}
              />
            </>
          ) : (
            <p>
              No outstanding refund request for{" "}
              {session ? session.actor.toString() : ""}
            </p>
          )}
        </>
      ) : (
        <>
          <p>Please login to process manual refund.</p>
        </>
      )}
    </>
  );
};

export default Refund;
