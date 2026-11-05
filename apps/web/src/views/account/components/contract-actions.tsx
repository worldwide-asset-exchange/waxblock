import { useContext, useMemo, useState } from "react";
import { createSearchParams, useNavigate, useSearchParams } from "react-router";
import { WalletContext } from "../../../app/contexts/wallet-context";
import { convertToBoolean } from "../../../app/utilities/utility";

const ContractActions = ({ accountAbi }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wallet = useContext(WalletContext);

  const activeAction = useMemo(() => {
    const actionName = searchParams.get("action");
    if (!actionName) return null;
    return (
      accountAbi.abi.actions.find((action) => action.name === actionName) ??
      null
    );
  }, [accountAbi, searchParams]);

  const actionStruct = useMemo(() => {
    if (!activeAction) return null;
    return (
      accountAbi.abi.structs.find(
        (struct) => struct.name === activeAction.type,
      ) ?? null
    );
  }, [accountAbi, activeAction]);

  const emptyFormData = useMemo(() => {
    const data = {};
    if (actionStruct?.fields) {
      actionStruct.fields.forEach((field) => {
        data[field.name] = "";
      });
    }
    return data;
  }, [actionStruct]);

  const [formEdits, setFormEdits] = useState({});
  const formData = useMemo(
    () => ({ ...emptyFormData, ...formEdits }),
    [emptyFormData, formEdits],
  );

  const pushTransaction = () => {
    const data = {};

    actionStruct.fields.forEach((field) => {
      let value;
      try {
        value = JSON.parse(formData[field.name]);
      } catch {
        value = formData[field.name];
      }

      if (field.type === "bool") {
        value = convertToBoolean(formData[field.name]);
      }

      data[field.name] = typeof value !== "undefined" ? value : "";
    });

    const walletTransaction = {};
    walletTransaction.type = "contractAction";

    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: accountAbi.account_name,
      name: activeAction.name,
      data: data,
      actionStruct: actionStruct,
    });

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <h3>Select Action</h3>
      {accountAbi.abi.actions.map((action, index) => (
        <a
          className={`more_btn ${
            activeAction?.name === action.name ? "active" : ""
          }`}
          style={{
            marginBottom: "10px",
            padding: "10px",
            width: "auto",
            cursor: "pointer",
            marginRight: "10px",
            fontSize: "12px",
            lineHeight: "14px",
            background:
              activeAction?.name === action.name ? "#7D70F6" : "#404047",
            textTransform: "none",
          }}
          key={index}
          onClick={() => {
            setFormEdits({});
            navigate({
              search: `?${createSearchParams({
                action: action.name,
              }).toString()}`,
              hash: "contract-actions",
            });
          }}
        >
          {action.name}
        </a>
      ))}
      {actionStruct && actionStruct.fields ? (
        <div className="mid_sec">
          <div className="form_sec" style={{ width: "100%" }}>
            <div className="form_box active">
              <h3>Enter Data</h3>
              <form>
                {actionStruct.fields.map((field, index) => (
                  <div className="field_row" key={index}>
                    <div className="field_col">
                      <label>{field.name}</label>
                      <input
                        type="text"
                        placeholder={`${field.type}`}
                        value={formData[field.name] ?? ""}
                        onChange={(event) => {
                          setFormEdits((formEdits) => ({
                            ...formEdits,
                            [field.name]: event.target.value,
                          }));
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="field_row1">
                  <input
                    type="button"
                    value="Submit Transaction"
                    onClick={pushTransaction}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ContractActions;
