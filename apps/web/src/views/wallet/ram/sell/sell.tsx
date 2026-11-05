import { useContext, useState } from "react";
import { useOutletContext } from "react-router";
import { Helmet } from "react-helmet-async";
import config from "../../../../app/config";
import { WalletContext } from "../../../../app/contexts/wallet-context";
import { numberFormat, tokenFormat } from "../../../../app/utilities/format";

const Sell = () => {
  const wallet = useContext(WalletContext);
  const { session, walletAccount } = wallet;
  const { account } = walletAccount;
  const [ramPrice] = useOutletContext();

  const sessionActor = session?.actor?.toString() ?? "";

  const [formData, setFormData] = useState({
    bytes: 0,
  });

  const calculateValue = () => {
    let value = 0;
    if (formData.bytes > 0) {
      value = tokenFormat(formData.bytes * ramPrice);
    }

    return value;
  };

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "sellram";

    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "sellram",
      data: {
        account: sessionActor,
        bytes: formData.bytes,
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>Sell RAM | Wallet - WAX Explorer</title>
      </Helmet>

      <form id="sell" className="forms_type active">
        {account ? (
          <>
            <p>
              <strong>RAM Purchased:</strong> {numberFormat(account.ram_quota)}{" "}
              bytes
            </p>
            <p>
              <strong>RAM In Use:</strong> {numberFormat(account.ram_usage)}{" "}
              bytes
            </p>
            <p>
              <strong>RAM Available:</strong>{" "}
              {numberFormat(account.ram_quota - account.ram_usage)} bytes
            </p>
            <br />
          </>
        ) : null}

        <div className="field_row1">
          <label> Amount of RAM to sell (in Bytes)</label>
          <input
            type="number"
            value={formData.bytes}
            min={0}
            onChange={(event) =>
              setFormData({ ...formData, bytes: event.target.value })
            }
          />
          <p>
            Selling {formData.bytes} Bytes for {calculateValue()}{" "}
            {config.token_symbol}
          </p>
        </div>

        <div className="field_row1">
          <input
            type="button"
            onClick={() => handleClick()}
            value={`${
              formData.quantity > 0
                ? `Sell ${formData.bytes} bytes of RAM`
                : `Sell RAM`
            }`}
          />
        </div>
      </form>
    </>
  );
};

export default Sell;
