import { useState, useContext } from "react";
import { Helmet } from "react-helmet-async";
import config from "../../../app/config";
import { WalletContext } from "../../../app/contexts/wallet-context";
import { tokenInputFormat } from "../../../app/utilities/format";

const Bidnames = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const sessionActor = session?.actor?.toString() ?? "";
  const [formData, setFormData] = useState({
    newname: "",
    bid: 0,
  });

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "bidname";
    walletTransaction.account = {
      account: null,
      permission: "active",
    };
    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "bidname",
      data: {
        bidder: sessionActor,
        newname: formData.newname,
        bid: `${tokenInputFormat(formData.bid, formData.decimals)} ${
          config.token_symbol
        }`,
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>Name Bids | Wallet - WAX Explorer</title>
      </Helmet>

      <div className="form_box active">
        <h2>Name Bids</h2>
        <form>
          <div className="field_row1">
            <label>Name to Bid On</label>
            <input
              type="text"
              value={formData.newname}
              onChange={(event) =>
                setFormData({ ...formData, newname: event.target.value })
              }
            />
          </div>
          <div className="field_row1">
            <label>Amount to Bid (in {config.token_symbol})</label>
            <input
              type="number"
              value={formData.bid}
              min={0}
              onChange={(event) =>
                setFormData({ ...formData, bid: event.target.value })
              }
            />
          </div>
          <div className="field_row1">
            <input type="button" value="Bid" onClick={handleClick} />
          </div>
        </form>
      </div>
    </>
  );
};

export default Bidnames;
