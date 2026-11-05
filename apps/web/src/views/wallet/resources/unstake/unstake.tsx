import { useContext, useState } from "react";
import { Helmet } from "react-helmet-async";
import config from "../../../../app/config";
import { WalletContext } from "../../../../app/contexts/wallet-context";
import { tokenInputFormat } from "../../../../app/utilities/format";

const Unstake = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const { delband } = wallet.walletAccount;
  const sessionActor = session?.actor?.toString() ?? "";

  const [formData, setFormData] = useState({
    receiver: "",
    unstake_net_quantity: 0,
    unstake_cpu_quantity: 0,
  });
  const [showAutocompleteItems, setShowAutocompleteItems] = useState(false);

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "undelegatebw";
    // walletTransaction.account = {
    //   account: null,
    //   permission: "active",
    // };
    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "undelegatebw",
      data: {
        from: sessionActor,
        receiver: formData.receiver,
        unstake_cpu_quantity: `${tokenInputFormat(
          formData.unstake_cpu_quantity,
        )} ${config.token_symbol}`,
        unstake_net_quantity: `${tokenInputFormat(
          formData.unstake_net_quantity,
        )} ${config.token_symbol}`,
        transfer: formData.transfer,
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>Unstake | Wallet - WAX Explorer</title>
      </Helmet>

      <form id="unstake" className="forms_type active">
        <div className="field_row1 autocomplete">
          <label>Account name to unstake from</label>
          <input
            type="text"
            value={formData.receiver}
            onChange={(event) =>
              setFormData({
                ...formData,
                receiver: event.target.value.toLowerCase(),
              })
            }
            onBlur={() => {
              setShowAutocompleteItems(false);
            }}
            onFocus={() => {
              setShowAutocompleteItems(true);
            }}
          />
          {showAutocompleteItems ? (
            <div
              className="autocomplete-items"
              style={{ maxHeight: "282px", overflowY: "scroll" }}
            >
              {delband &&
                delband.rows.map((row, index) => (
                  <div
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setFormData({
                        ...formData,
                        receiver: row.to,
                        unstake_net_quantity: `${tokenInputFormat(
                          row.net_weight,
                        )}`,
                        unstake_cpu_quantity: `${tokenInputFormat(
                          row.cpu_weight,
                        )}`,
                      });
                      setShowAutocompleteItems(false);
                    }}
                  >
                    {`${row.to} (CPU: ${row.cpu_weight} , NET: ${row.net_weight})`}
                  </div>
                ))}
            </div>
          ) : null}
        </div>
        <div className="field_row1">
          <label>Amount of {config.token_symbol} to unstake from CPU</label>
          <input
            type="number"
            value={formData.unstake_cpu_quantity}
            onChange={(event) =>
              setFormData({
                ...formData,
                unstake_cpu_quantity: event.target.value,
              })
            }
          />
        </div>
        <div className="field_row1">
          <label>Amount of {config.token_symbol} to unstake from NET</label>
          <input
            type="number"
            value={formData.unstake_net_quantity}
            onChange={(event) =>
              setFormData({
                ...formData,
                unstake_net_quantity: event.target.value,
              })
            }
          />
        </div>
        <div className="field_row1">
          <input
            type="button"
            onClick={() => handleClick()}
            value={`${
              formData.unstake_cpu_quantity > 0 ||
              formData.unstake_net_quantity > 0
                ? `Unstake ${formData.unstake_cpu_quantity} ${config.token_symbol} of CPU and ${formData.unstake_net_quantity} ${config.token_symbol} of NET`
                : `Unstake`
            }`}
          />
        </div>
      </form>
    </>
  );
};

export default Unstake;
