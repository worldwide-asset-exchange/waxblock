import { useState, useContext } from "react";
import { Helmet } from "react-helmet-async";
import Icon from "../../../../app/components/ui/Icon";
import { WalletContext } from "../../../../app/contexts/wallet-context";

const CancelDeferred = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;

  const sessionActor = session?.actor?.toString() ?? "";
  const sessionPermission = session?.permission?.toString() ?? "";

  const [formData, setFormData] = useState({
    trx_id: "",
  });

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "canceldelay";

    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "canceldelay",
      data: {
        canceling_auth: {
          actor: sessionActor,
          permission: sessionPermission,
        },
        trx_id: formData.trx_id,
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>Cancel Deferred | Wallet - WAX Explorer</title>
      </Helmet>

      <form id="cancel-deferred" className="forms_type active">
        <div className="field_row1">
          <label>
            Transaction ID:{" "}
            <span data-tip="The ID of the deferred transaction to cancel.">
              <Icon name="info" />
            </span>
          </label>
          <input
            type="text"
            placeholder="Transaction ID"
            onChange={(event) =>
              setFormData({ ...formData, trx_id: event.target.value })
            }
          />
        </div>
        <div className="field_row1">
          <input
            type="button"
            defaultValue="Cancel Transaction"
            onClick={() => handleClick()}
          />
        </div>
      </form>
    </>
  );
};

export default CancelDeferred;
