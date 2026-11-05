import { useContext, useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import config from "../../../app/config";
import { WalletContext } from "../../../app/contexts/wallet-context";
import { tokenInputFormat } from "../../../app/utilities/format";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";

const PowerUp = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const [powupState, setPowupState] = useState(null);

  const sessionActor = session?.actor?.toString() ?? "";

  const [formData, setFormData] = useState({
    receiver: "",
    cpu_amount: "",
    net_amount: "",
  });

  useEffect(() => {
    BlockchainApiManager.getTableRows({
      code: "eosio",
      table: "powup.state",
      lower_bound: "",
      upper_bound: "",
      limit: 1,
    }).then((response) => {
      setPowupState(response.rows[0]);
    });
  }, []);

  const priceIntegralDelta = function (
    state,
    start_utilization,
    end_utilization,
  ) {
    const coefficient =
      (parseFloat(state.max_price) - parseFloat(state.min_price)) /
      state.exponent;
    const start_u = start_utilization / state.weight;
    const end_u = end_utilization / state.weight;

    return (
      parseFloat(state.min_price) * end_u -
      parseFloat(state.min_price) * start_u +
      coefficient * Math.pow(end_u, state.exponent) -
      coefficient * Math.pow(start_u, state.exponent)
    );
  };

  const priceFunction = function (state, utilization) {
    let price = parseFloat(state.min_price);
    const new_exponent = state.exponent - 1.0;
    if (new_exponent <= 0.0) {
      return parseFloat(state.max_price);
    } else {
      price +=
        (parseFloat(state.max_price) - parseFloat(state.min_price)) *
        Math.pow(utilization / state.weight, new_exponent);
    }

    return price;
  };

  const calcPowerUpFee = useCallback((state, utilization_increase) => {
    let fee = 0;
    let start_utilization = parseFloat(state.utilization);
    const end_utilization =
      parseFloat(state.utilization) + parseFloat(utilization_increase);

    if (start_utilization < state.adjusted_utilization) {
      fee +=
        (priceFunction(state, state.adjusted_utilization) *
          Math.min(
            utilization_increase,
            state.adjusted_utilization - start_utilization,
          )) /
        state.weight;
      start_utilization = state.adjusted_utilization;
    }

    if (start_utilization < end_utilization) {
      fee += priceIntegralDelta(state, start_utilization, end_utilization);
    }

    if (powupState && fee > 0 && fee < powupState.min_powerup_fee) {
      fee = powupState.min_powerup_fee;
    }

    return fee;
  }, [powupState]);

  const powerUpFees = useMemo(() => {
    if (!powupState) {
      return {
        cpu_fee: 0,
        net_fee: 0,
        fee: 0,
        days: undefined,
        max_payment: 0,
        cpu_frac: 0,
        net_frac: 0,
      };
    }

    const powerup_frac = 1000000000000000;

    const cpu_fee = parseFloat(
      calcPowerUpFee(
        powupState.cpu,
        formData.cpu_amount * Math.pow(10, config.token_precision),
      ),
    ).toFixed(config.token_precision);

    const net_fee = parseFloat(
      calcPowerUpFee(
        powupState.net,
        formData.net_amount * Math.pow(10, config.token_precision),
      ),
    ).toFixed(config.token_precision);

    const fee = (parseFloat(cpu_fee) + parseFloat(net_fee)).toFixed(
      config.token_precision,
    );

    const cpu_frac = parseInt(
      Math.round(
        (formData.cpu_amount *
          Math.pow(10, config.token_precision) *
          powerup_frac) /
          powupState.cpu.weight,
      ),
    );
    const net_frac = parseInt(
      Math.round(
        (formData.net_amount *
          Math.pow(10, config.token_precision) *
          powerup_frac) /
          powupState.net.weight,
      ),
    );

    const max_payment = parseFloat(
      parseFloat(fee) + (parseFloat(fee) * 50) / 100,
    );

    return {
      cpu_fee,
      net_fee,
      fee,
      days: powupState.powerup_days,
      max_payment,
      cpu_frac,
      net_frac,
    };
  }, [calcPowerUpFee, formData.cpu_amount, formData.net_amount, powupState]);

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "powerup";
    // walletTransaction.account = {
    //   account: null,
    //   permission: "active",
    // };
    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "powerup",
      data: {
        payer: sessionActor,
        receiver: formData.receiver || sessionActor,
        days: powerUpFees.days,
        cpu_frac: powerUpFees.cpu_frac,
        net_frac: powerUpFees.net_frac,
        max_payment: `${tokenInputFormat(powerUpFees.max_payment)} ${
          config.token_symbol
        }`,
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>PowerUp | Wallet - WAX Explorer</title>
      </Helmet>

      <div className="form_box active">
        <h2>PowerUp</h2>
        <form>
          <div className="field_row1">
            <label>Receiver</label>
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
            <label>Amount of CPU to PowerUp (in {config.token_symbol})</label>
            <input
              type="number"
              value={formData.cpu_amount}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  cpu_amount: event.target.value,
                })
              }
              placeholder={`Amount in ${config.token_symbol} to rent`}
            />
          </div>

          <div className="field_row1 short_space">
            <label>Amount of NET to PowerUp (in {config.token_symbol})</label>
            <input
              type="number"
              value={formData.net_amount}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  net_amount: event.target.value,
                })
              }
              placeholder={`Amount in ${config.token_symbol} to rent`}
            />
          </div>

          <p>
            Total Fee:
            {/* <br />+ {formData.cpu_fee} CPU
              <br />+ {formData.net_fee} NET */}
            <br />≈ {powerUpFees.fee} {config.token_symbol}
          </p>
          <br />

          <div className="field_row1">
            <input
              type="button"
              onClick={() => handleClick()}
              value={`PowerUp for 1 day`}
              disabled={powerUpFees.fee > 0 ? false : true}
              style={{ opacity: powerUpFees.fee > 0 ? null : 0.5 }}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default PowerUp;
