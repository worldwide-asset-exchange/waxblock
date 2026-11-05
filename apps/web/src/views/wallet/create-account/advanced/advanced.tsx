import { useContext, useState } from "react";
import { Helmet } from "react-helmet-async";
import { WalletContext } from "../../../../app/contexts/wallet-context";
import { Link } from "react-router";
import Icon from "../../../../app/components/ui/Icon";
import { tokenInputFormat } from "../../../../app/utilities/format";
import config from "../../../../app/config";

const Advanced = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const sessionActor = session?.actor?.toString() ?? "";
  const [formData, setFormData] = useState({
    new_account: "",
    owner_key: "",
    active_key: "",
    stake_net: 0.2,
    stake_cpu: 0.2,
    ram_bytes: 3000,
    transfer: false,
  });

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "create-account-advanced";

    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "newaccount",
      data: {
        creator: sessionActor,
        name: formData.new_account,
        owner: {
          accounts: [],
          keys: [{ key: formData.owner_key, weight: 1 }],
          waits: [],
          threshold: 1,
        },
        active: {
          accounts: [],
          keys: [{ key: formData.active_key, weight: 1 }],
          waits: [],
          threshold: 1,
        },
      },
    });

    walletTransaction.actions.push({
      account: "eosio",
      name: "buyrambytes",
      data: {
        payer: sessionActor,
        receiver: formData.new_account,
        bytes: Number(formData.ram_bytes),
      },
    });

    walletTransaction.actions.push({
      account: "eosio",
      name: "delegatebw",
      data: {
        from: sessionActor,
        receiver: formData.new_account,
        stake_cpu_quantity: `${tokenInputFormat(formData.stake_cpu)} ${
          config.token_symbol
        }`,
        stake_net_quantity: `${tokenInputFormat(formData.stake_net)} ${
          config.token_symbol
        }`,
        transfer: formData.transfer,
      },
    });

    wallet.submitTransaction(walletTransaction);
  };
  return (
    <>
      <Helmet>
        <title>Create Account | Wallet - WAX Explorer</title>
      </Helmet>

      <form id="advanced" className="forms_type active">
        <p>
          If you need to generate new owner and active private/public key pairs,
          you can use the generate keys feature in the wallet&nbsp;
          <Link to="/wallet/utilities" style={{ color: "#7D70F6" }}>
            https://waxblock.io/wallet/utilities
          </Link>
        </p>
        <br />
        <div className="field_row1">
          <label>
            Name for the new account&nbsp;
            <span data-tip="12 characters long, lowercase and only characters a-z or numbers 1-5 can be used in name.">
              <Icon name="info" />
            </span>
          </label>
          <input
            type="text"
            placeholder="Name of the new account"
            value={formData.new_account}
            onChange={(event) =>
              setFormData({
                ...formData,
                new_account: event.target.value.toLowerCase(),
              })
            }
          />
        </div>
        <div className="field_row1">
          <label>
            Public Owner Key for the new account&nbsp;
            <span data-tip="Public key only, should be 54 characters long and start with PUB_K1">
              <Icon name="info" />
            </span>
          </label>
          <input
            type="text"
            placeholder="Owner Key (Starts with PUB_K1...)"
            value={formData.owner_key}
            onChange={(event) =>
              setFormData({
                ...formData,
                owner_key: event.target.value,
              })
            }
          />
        </div>

        <div className="field_row1">
          <label>
            Public Active Key for the new account&nbsp;
            <span data-tip="Public key only, should be 54 characters long and start with PUB_K1">
              <Icon name="info" />
            </span>
          </label>
          <input
            type="text"
            placeholder="Active Key (Starts with PUB_K1...)"
            value={formData.active_key}
            onChange={(event) =>
              setFormData({
                ...formData,
                active_key: event.target.value,
              })
            }
          />
        </div>

        <div className="field_row1">
          <label>
            NET to Stake for New Account&nbsp;
            <span data-tip="0.2 WAX will allow a few transactions. Change as required.">
              <Icon name="info" />
            </span>
          </label>
          <input
            type="number"
            placeholder={`NET amount in ${config.token_symbol}`}
            value={formData.stake_net}
            onChange={(event) =>
              setFormData({
                ...formData,
                stake_net: event.target.value,
              })
            }
          />
        </div>

        <div className="field_row1">
          <label>
            CPU to Stake for New Account&nbsp;
            <span data-tip="0.2 WAX will allow a few transactions. Change as required.">
              <Icon name="info" />
            </span>
          </label>
          <input
            type="number"
            placeholder={`CPU amount in ${config.token_symbol}`}
            value={formData.stake_cpu}
            onChange={(event) =>
              setFormData({
                ...formData,
                stake_cpu: event.target.value,
              })
            }
          />
        </div>

        <div className="field_row1">
          <label>
            RAM to buy for New Account (in Bytes)&nbsp;
            <span data-tip="Minimum for new account is approximately 3000 Bytes.">
              <Icon name="info" />
            </span>
          </label>
          <input
            type="number"
            placeholder="RAM amount in Bytes"
            value={formData.ram_bytes}
            onChange={(event) =>
              setFormData({
                ...formData,
                ram_bytes: event.target.value,
              })
            }
          />
        </div>

        <div className="field_row1">
          <div
            className="checkbox"
            //style={{ display: "inline-flex" }}
            onClick={() =>
              setFormData({ ...formData, transfer: !formData.transfer })
            }
          >
            <input
              type="checkbox"
              name="transfer"
              className="check_input"
              checked={formData.transfer}
              onChange={() =>
                setFormData({ ...formData, transfer: !formData.transfer })
              }
            />
            &nbsp;
            <label
              className="check_label"
              //htmlFor="transfer-stake"
              style={{ cursor: "pointer" }}
            >
              Check to transfer the staked resources to new account
            </label>
          </div>
        </div>

        <div className="field_row1">
          <input
            type="button"
            onClick={() => handleClick()}
            value="Create Account"
          />
        </div>
      </form>
    </>
  );
};

export default Advanced;
