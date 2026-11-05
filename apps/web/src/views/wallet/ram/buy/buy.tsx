import { useContext, useState } from "react";
import { useOutletContext } from "react-router";
import { Helmet } from "react-helmet-async";
import config from "../../../../app/config";
import { WalletContext } from "../../../../app/contexts/wallet-context";
import {
  numberFormat,
  tokenFormat,
  tokenInputFormat,
} from "../../../../app/utilities/format";

const Buy = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const [ramPrice] = useOutletContext();

  const sessionActor = session?.actor?.toString() ?? "";

  const [formData, setFormData] = useState({
    receiver: "",
    quantity: 0,
    mode: "token", //token,bytes
  });

  const calculateEstimate = () => {
    if (formData.mode === "token") {
      let bytes = 0;
      if (formData.quantity > 0) {
        bytes = numberFormat(Math.round(formData.quantity / ramPrice));
      }

      return `${bytes} Bytes`;
    } else {
      let token = 0;
      if (formData.quantity > 0) {
        token = tokenFormat(formData.quantity * ramPrice);
      }

      return `${token} ${config.token_symbol}`;
    }
  };

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "buyram";

    walletTransaction.actions = [];

    if (formData.mode === "token") {
      walletTransaction.actions.push({
        account: "eosio",
        name: "buyram",
        data: {
          payer: sessionActor,
          receiver: formData.receiver || sessionActor,
          quant: `${tokenInputFormat(formData.quantity)} ${
            config.token_symbol
          }`,
        },
      });
    } else {
      walletTransaction.actions.push({
        account: "eosio",
        name: "buyrambytes",
        data: {
          payer: sessionActor,
          receiver: formData.receiver || sessionActor,
          bytes: parseInt(formData.quantity),
        },
      });
    }

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>Buy RAM | Wallet - WAX Explorer</title>
      </Helmet>

      <form id="buy" className="forms_type active">
        <div className="field_row1">
          <label>Reciever of RAM</label>
          <input
            type="text"
            value={formData.receiver || sessionActor}
            onChange={(event) =>
              setFormData({
                ...formData,
                receiver: event.target.value.toLowerCase(),
              })
            }
          />
        </div>

        <div className="field_row1">
          <label>Buy in {config.token_symbol} or Bytes?</label>
          {/* <div style={{ display: "inline-flex" }}> */}
          <span className="radiobox">
            <input
              type="radio"
              name="mode"
              id="mode_token"
              style={{ marginTop: "-10px" }}
              value="token"
              checked={formData.mode === "token"}
              onChange={() => setFormData({ ...formData, mode: "token" })}
            />
            &nbsp;<label htmlFor="mode_token">{config.token_symbol}</label>
          </span>
          &nbsp;&nbsp;
          <span className="radiobox">
            <input
              type="radio"
              name="mode"
              id="mode_bytes"
              style={{ marginTop: "-10px" }}
              value="bytes"
              checked={formData.mode === "bytes"}
              onChange={() => setFormData({ ...formData, mode: "bytes" })}
            />
            &nbsp;<label htmlFor="mode_bytes">Bytes</label>
          </span>
          {/* </div> */}
        </div>

        <div className="field_row1">
          <label>
            Amount of RAM to buy (in{" "}
            {formData.mode === "token" ? config.token_symbol : "Bytes"})
          </label>
          <input
            type="number"
            value={formData.quantity}
            min={0}
            onChange={(event) =>
              setFormData({ ...formData, quantity: event.target.value })
            }
          />
          <p>≈ {calculateEstimate()}</p>
        </div>

        <div className="field_row1">
          <input
            type="button"
            onClick={() => handleClick()}
            value={`${
              formData.quantity > 0
                ? `Buy ${
                    formData.mode === "token"
                      ? `${formData.quantity} ${config.token_symbol}`
                      : `${formData.quantity} Bytes`
                  }  of RAM`
                : `Buy RAM`
            }`}
          />
        </div>
      </form>
    </>
  );
};

export default Buy;
