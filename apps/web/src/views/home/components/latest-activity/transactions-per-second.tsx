import { useContext, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import config from "../../../../app/config";
import { SocketContext } from "../../../../app/contexts/socket-context";

const TransactionsPerSecond = () => {
  const socket = useContext(SocketContext);
  const [txsPerSecond, setTxsPerSecond] = useState(() =>
    config.network_type === "localnet" ? { data: 0 } : null,
  );

  useEffect(() => {
    //////////No socket for localnet//////////
    if (config.network_type === "localnet") return;
    //////////No socket for localnet//////////

    if (!socket?.connected) return;

    socket.off("txsPerSecond").on("txsPerSecond", (txsPerSecond) => {
      setTxsPerSecond(txsPerSecond);
    });
  }, [socket, socket?.connected]);

  return (
    <>
      <div className="chart_box">
        <div className="details">
          <span className="type">Transactions per second</span>
          <span className="value">
            {txsPerSecond ? <>{txsPerSecond.data} TPS</> : <Skeleton />}{" "}
          </span>
          {config.network_type !== "localnet" ? (
            <span className="val_change">TPS Record 3,138</span>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default TransactionsPerSecond;
