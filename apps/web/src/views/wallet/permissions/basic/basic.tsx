import { useContext } from "react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { WalletContext } from "../../../../app/contexts/wallet-context";

const Basic = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const [formData, setFormData] = useState({
    active_key: "",
    owner_key: "",
  });

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "updateauth";

    walletTransaction.actions = [];

    if (formData.active_key && formData.active_key !== "") {
      walletTransaction.actions.push({
        account: "eosio",
        name: "updateauth",
        data: {
          account: session ? session.actor.toString() : null,
          permission: "active",
          parent: "owner",
          auth: {
            threshold: 1,
            keys: [{ key: formData.active_key, weight: 1 }],
            accounts: [],
            waits: [],
          },
        },
      });
    }
    if (formData.owner_key && formData.owner_key !== "") {
      walletTransaction.actions.push({
        account: "eosio",
        name: "updateauth",
        data: {
          account: session ? session.actor.toString() : null,
          permission: "owner",
          parent: "",
          auth: {
            threshold: 1,
            keys: [{ key: formData.owner_key, weight: 1 }],
            accounts: [],
            waits: [],
          },
        },
      });
    }

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>Basic Permissions | Wallet - WAX Explorer</title>
      </Helmet>

      <form id="simple" className="forms_type active">
        <h2>Permission</h2>
        <div className="field_row1">
          <label>Set new active key</label>
          <input
            type="text"
            placeholder="Active Key"
            value={formData.active_key}
            onChange={(event) =>
              setFormData({ ...formData, active_key: event.target.value })
            }
          />
        </div>
        <div className="field_row1">
          <label>Set new owner key</label>
          <input
            type="text"
            placeholder="Key Owner"
            value={formData.owner_key}
            onChange={(event) =>
              setFormData({ ...formData, owner_key: event.target.value })
            }
          />
        </div>
        <div className="field_row1">
          <input
            type="button"
            defaultValue="UPDATE KEYS"
            onClick={() => handleClick()}
          />
        </div>
      </form>
    </>
  );
};

export default Basic;
