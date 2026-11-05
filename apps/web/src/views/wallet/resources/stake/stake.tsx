import { useContext, useState } from "react";
import { Helmet } from "react-helmet-async";
import config from "../../../../app/config";
import { WalletContext } from "../../../../app/contexts/wallet-context";
import { calculateBreakDown } from "../../../../app/utilities/account";
import { tokenInputFormat } from "../../../../app/utilities/format";

const Stake = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const { account, delband, userres } = wallet.walletAccount;

  const sessionActor = session?.actor?.toString() ?? "";

  const [formData, setFormData] = useState({
    receiver: "",
    stake_net_quantity: "0",
    stake_cpu_quantity: "0",
    transfer: false,
    stake_net_percentage: 0,
    stake_cpu_percentage: 0,
  });

  const breakdown = calculateBreakDown({ account, delband, userres });

  const calculatePercentageStake = (percentage, resource) => {
    let stake_cpu_quantity = "0";
    let stake_net_quantity = "0";
    let stake_cpu_percentage = formData.stake_cpu_percentage;
    let stake_net_percentage = formData.stake_net_percentage;
    switch (resource) {
      case "cpu":
        stake_cpu_percentage = percentage;
        if (stake_cpu_percentage + stake_net_percentage > 100) {
          stake_net_percentage = 100 - stake_cpu_percentage;
        }
        break;
      case "net":
        stake_net_percentage = percentage;
        if (stake_cpu_percentage + stake_net_percentage > 100) {
          stake_cpu_percentage = 100 - stake_net_percentage;
        }
        break;
      default:
        break;
    }
    stake_cpu_quantity = (
      (breakdown.liquidBalance * stake_cpu_percentage) /
      100
    )?.toFixed(8);
    stake_net_quantity = (
      (breakdown.liquidBalance * stake_net_percentage) /
      100
    )?.toFixed(8);

    setFormData((formData) => ({
      ...formData,
      stake_cpu_quantity: stake_cpu_quantity,
      stake_net_quantity: stake_net_quantity,
      stake_cpu_percentage: stake_cpu_percentage,
      stake_net_percentage: stake_net_percentage,
    }));
  };

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "delegatebw";
    // walletTransaction.account = {
    //   account: null,
    //   permission: "active",
    // };
    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "delegatebw",
      data: {
        from: sessionActor,
        receiver: formData.receiver || sessionActor,
        stake_cpu_quantity: `${tokenInputFormat(formData.stake_cpu_quantity?.replace(",", "."))} ${
          config.token_symbol
        }`,
        stake_net_quantity: `${tokenInputFormat(formData.stake_net_quantity?.replace(",", "."))} ${
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
        <title>Stake | Wallet - WAX Explorer</title>
      </Helmet>
      <form id="stake" className="forms_type active">
        <div className="field_row1">
          <label>Receiver of Stake</label>
          <input
            type="text"
            placeholder="Reciever"
            value={formData.receiver || sessionActor}
            onChange={(event) =>
              setFormData({
                ...formData,
                receiver: event.target.value.toLowerCase(),
              })
            }
          />
        </div>
        <div className="field_row1 short_space">
          <label>Amount of {config.token_symbol} to Stake for CPU</label>
          <input
            type="text"
            value={formData.stake_cpu_quantity}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setFormData({
                  ...formData,
                  stake_cpu_quantity: value,
                  stake_cpu_percentage: 0,
                });
              }
            }}
          />
        </div>
        <div className="field_row1">
          <input
            className="small_btn"
            type="button"
            defaultValue="25%"
            onClick={() => calculatePercentageStake(25, "cpu")}
          />
          <input
            className="small_btn"
            type="button"
            defaultValue="50%"
            onClick={() => calculatePercentageStake(50, "cpu")}
          />
          <input
            className="small_btn"
            type="button"
            defaultValue="75%"
            onClick={() => calculatePercentageStake(75, "cpu")}
          />
          <input
            className="small_btn"
            type="button"
            defaultValue="100%"
            onClick={() => calculatePercentageStake(100, "cpu")}
          />
        </div>

        <div className="field_row1 short_space">
          <label>Amount of {config.token_symbol} to Stake for NET</label>
          <input
            type="text"
            value={formData.stake_net_quantity}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setFormData({
                  ...formData,
                  stake_net_quantity: value,
                  stake_net_percentage: 0,
                });
              }
            }}
          />
        </div>
        <div className="field_row1">
          <input
            className="small_btn"
            type="button"
            defaultValue="25%"
            onClick={() => calculatePercentageStake(25, "net")}
          />
          <input
            className="small_btn"
            type="button"
            defaultValue="50%"
            onClick={() => calculatePercentageStake(50, "net")}
          />
          <input
            className="small_btn"
            type="button"
            defaultValue="75%"
            onClick={() => calculatePercentageStake(75, "net")}
          />
          <input
            className="small_btn"
            type="button"
            defaultValue="100%"
            onClick={() => calculatePercentageStake(100, "net")}
          />
        </div>
        {sessionActor !== (formData.receiver || sessionActor) ? (
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
                //id="transfer-stake"
                //style={{ marginTop: "-10px" }}
                checked={formData.transfer}
              />
              &nbsp;
              <label
                className="check_label"
                //htmlFor="transfer-stake"
                style={{ cursor: "pointer" }}
              >
                Transfer stake to new account
              </label>
            </div>
          </div>
        ) : null}

        <div className="field_row1">
          <input
            type="button"
            onClick={() => handleClick()}
            value={`${
              formData.stake_cpu_quantity > 0 || formData.stake_net_quantity > 0
                ? `Stake ${formData.stake_cpu_quantity || 0} ${config.token_symbol} of CPU and ${formData.stake_net_quantity || 0} ${config.token_symbol} of NET`
                : `Stake`
            }`}
          />
        </div>
      </form>
    </>
  );
};

export default Stake;
