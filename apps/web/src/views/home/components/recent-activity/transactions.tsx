import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import DisplayActionData from "../../../../app/components/blockchain/action/display-action-data";
import { getShortTrxId } from "../../../../app/utilities/transaction";
import { SocketContext } from "../../../../app/contexts/socket-context";
import config from "../../../../app/config";

const Transactions = () => {
  const socket = useContext(SocketContext);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState("started");

  useEffect(() => {
    //////////No socket for localnet//////////
    if (config.network_type === "localnet") return;
    //////////No socket for localnet//////////

    if (status === "paused") {
      socket.emit("leave", "transactions");
    } else {
      socket.emit("join", "transactions");
    }
  }, [socket, status]);

  useEffect(() => {
    //////////No socket for localnet//////////
    if (config.network_type === "localnet") return;
    //////////No socket for localnet//////////

    if (!socket) return;

    socket.emit("join", "transactions");
    socket.off("transactions").on("transactions", (recentTransactions) => {
      setTransactions((transactions) =>
        [...recentTransactions, ...transactions].slice(0, 20),
      );
    });
    return () => {
      socket.emit("leave", "transactions");
    };
  }, [socket, socket?.connected]);

  const itemsPerPage = 20;

  const currentItems = useMemo(
    () => transactions.slice(0, itemsPerPage),
    [itemsPerPage, transactions],
  );

  const toggleStatus = () => {
    setStatus((status) => {
      return status === "paused" ? "started" : "paused";
    });
  };

  return (
    <>
      <div>
        <a
          className={`more_btn ${
            status === "started" ? "btn-primary" : "btn-success"
          } `}
          onClick={() => toggleStatus()}
          style={{
            marginBottom: "10px",
            padding: "5px 0",
            width: "100px",
            cursor: "pointer",
          }}
        >
          {status === "started" ? "Pause" : "Play"}
        </a>
        &nbsp; <label style={{ color: "#CDCDCD" }}>Live WAX Transactions</label>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: "10%" }}>TX ID</th>
            <th style={{ width: "10%" }}>Account</th>
            <th style={{ width: "10%" }}>Action</th>
            <th style={{ width: "70%" }}>Data</th>
          </tr>
        </thead>
        <tbody>
          {!currentItems.length ? (
            <>
              <tr>
                <td colSpan="4">Loading live transactions...</td>
              </tr>
            </>
          ) : null}

          {currentItems.map((transaction, index) => (
            <tr key={index}>
              <td style={{ width: "10%" }}>
                {transaction.trx && transaction.trx.id ? (
                  <Link to={`/transaction/${transaction.trx.id}`}>
                    {getShortTrxId(transaction.trx.id)}
                  </Link>
                ) : (
                  ""
                )}
              </td>
              <td style={{ width: "10%" }}>
                {transaction.trx &&
                transaction.trx.transaction &&
                transaction.trx.transaction.actions[0] ? (
                  <Link
                    to={`/account/${transaction.trx.transaction.actions[0].account}`}
                  >
                    {transaction.trx.transaction.actions[0].account}
                  </Link>
                ) : null}
              </td>
              <td style={{ width: "10%" }}>
                {transaction.trx &&
                  transaction.trx.transaction &&
                  transaction.trx.transaction.actions[0].name}
              </td>
              <td style={{ width: "70%" }}>
                {transaction.trx &&
                transaction.trx.transaction &&
                transaction.trx.transaction.actions[0] ? (
                  <DisplayActionData
                    action={transaction.trx.transaction.actions[0]}
                  />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default Transactions;
