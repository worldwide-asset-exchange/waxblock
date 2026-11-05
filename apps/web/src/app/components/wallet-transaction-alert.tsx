import { useContext, useEffect } from "react";
import { WalletContext } from "../contexts/wallet-context";
import parse from "html-react-parser";
import { useLocation } from "react-router";

const WalletTransactionAlert = () => {
  const wallet = useContext(WalletContext);
  const { pathname } = useLocation();
  const setTransactionAlert = wallet?.setTransactionAlert;

  useEffect(() => {
    return () => {
      setTransactionAlert?.(null);
    };
  }, [pathname, setTransactionAlert]);

  if (!wallet) return null;
  const { transactionAlert } = wallet;

  // useEffect(() => {
  //   return () => {
  //     setTransactionAlert(null);
  //   };
  // }, []);

  const close = () => {
    setTransactionAlert(null);
  };

  if (!transactionAlert) return;

  if (transactionAlert.type === "error") {
    return (
      <div className="missing_vote alert-error active" id="transactionAlertBox">
        <h3>
          <img src="/common/images/close-vote.png" alt="" />
          Error
        </h3>
        <p>{parse(transactionAlert.message)}</p>
        <span className="miss_close" data-title="missing-vote" onClick={close}>
          <img src="/common/images/close.png" alt="" />
        </span>
      </div>
    );
  }

  if (transactionAlert.type === "warning") {
    return (
      <div
        className="missing_vote alert-warning active"
        id="transactionAlertBox"
      >
        <h3>
          <img src="/common/images/close-vote.png" alt="" />
          Warning
        </h3>
        <p>{parse(transactionAlert.message)}</p>
        <span className="miss_close" data-title="missing-vote" onClick={close}>
          <img src="/common/images/close.png" alt="" />
        </span>
      </div>
    );
  }

  if (transactionAlert.type === "info") {
    return (
      <div className="missing_vote alert-info active" id="transactionAlertBox">
        <h3>
          <img src="/common/images/close-vote.png" alt="" />
          Info
        </h3>
        <p>{parse(transactionAlert.message)}</p>
        <span className="miss_close" data-title="missing-vote" onClick={close}>
          <img src="/common/images/close.png" alt="" />
        </span>
      </div>
    );
  }

  return (
    <div className="missing_vote alert-success active" id="transactionAlertBox">
      <h3>
        <img src="/common/images/tick-vote.png" alt="" />
        Success
      </h3>
      <p style={{ wordBreak: "break-all" }}>
        {parse(transactionAlert.message)}
      </p>
      <span className="miss_close" data-title="missing-vote" onClick={close}>
        <img src="/common/images/close.png" alt="" />
      </span>
    </div>
  );
};

export default WalletTransactionAlert;
