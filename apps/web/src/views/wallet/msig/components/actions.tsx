import { useState } from "react";
import BlockchainApiManager from "../../../../app/services/blockchainApiManager";
import Authorizations from "./authorizations";

const Actions = ({ formData, setFormData }) => {
  const [autocompleteContracts, setAutocompleteContracts] = useState([[]]);
  const [contractAbis, setContractAbis] = useState([]);
  const [autocompleteNames, setAutocompleteNames] = useState([[]]);

  const addAction = () => {
    formData.actions.push({
      contract: "",
      action: "",
      authorization: [{ actor: "", permission: "" }],
      data: {},
    }); //Add new
    setFormData({ ...formData });
  };

  const removeAction = (actionIndex) => {
    formData.actions.splice(actionIndex, 1);
    setFormData({ ...formData });
  };

  const autocompleteContract = (actionIndex) => {
    if (
      !new RegExp("^[a-z1-5.]{1,12}$", "i").test(
        formData.actions[actionIndex].account,
      )
    ) {
      setAutocompleteContracts((prev) => {
        const next = [...prev];
        next[actionIndex] = [];
        return next;
      });
      return;
    }

    let keywords = formData.actions[actionIndex].account;

    if (keywords === "") {
      keywords = "eosio";
    }

    BlockchainApiManager.getTableByScope({
      code: "eosio",
      table: "userres",
      lower_bound: keywords,
      upper_bound: keywords.padEnd(12, "z"),
      limit: 10,
    }).then((res) => {
      setAutocompleteContracts((prev) => {
        const next = [...prev];
        next[actionIndex] = res.rows.map((item) => ({ scope: item.scope }));
        return next;
      });
    });
  };

  const selectContract = (actionIndex, item) => {
    const contract = item.scope;
    if (contract) {
      setFormData((prev) => ({
        ...prev,
        actions: prev.actions.map((action, i) =>
          i === actionIndex ? { ...action, account: contract } : action,
        ),
      }));
    }

    setContractAbis((prev) => {
      const next = [...prev];
      next[actionIndex] = [];
      return next;
    });
    setAutocompleteNames((prev) => {
      const next = [...prev];
      next[actionIndex] = [];
      return next;
    });

    const account =
      contract || formData.actions[actionIndex]?.account || "eosio";
    BlockchainApiManager.getAbi(account).then((res) => {
      setContractAbis((prev) => {
        const next = [...prev];
        next[actionIndex] = res;
        return next;
      });
      setAutocompleteNames((prev) => {
        const next = [...prev];
        next[actionIndex] = res?.abi?.actions.map((item) => item.name) ?? [];
        return next;
      });
    });
  };

  const selectName = (actionIndex, name) => {
    const abi = contractAbis[actionIndex];
    if (!name || !abi?.abi) return;

    const struct = abi.abi.structs.find((item) => item.name === name);
    if (!struct) return;

    const data = {};
    struct.fields.forEach((field) => {
      data[field.name] = "";
    });

    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === actionIndex ? { ...action, name, data } : action,
      ),
    }));
  };

  return (
    <>
      <div className="field_row1 action_block">
        {formData.actions.length === 0 ? <label>No Actions Found</label> : null}
        {formData.actions.map((action, actionIndex) => (
          <div
            className="action_row"
            style={{ display: "block" }}
            key={actionIndex}
          >
            <div className="field_row1 autocomplete">
              <label className="s_no">
                Action {actionIndex + 1} - {action.account}::
                {action.name}
                <input
                  type="button"
                  className="delete_act"
                  defaultValue="Delete"
                  onClick={() => removeAction(actionIndex)}
                />
              </label>
              <label>Contract</label>
              <input
                type="text"
                value={action.account}
                onChange={(event) => {
                  formData.actions[actionIndex].account = event.target.value;
                  setFormData({ ...formData });
                  autocompleteContract(actionIndex);
                }}
                onBlur={() => {
                  formData.actions[actionIndex].showAutocompleteContracts =
                    false;
                  setFormData({ ...formData });
                }}
                onFocus={() => {
                  formData.actions[actionIndex].showAutocompleteContracts =
                    true;
                  setFormData({ ...formData });
                }}
              />

              {formData.actions[actionIndex].showAutocompleteContracts ? (
                <div
                  className="autocomplete-items"
                  style={{ display: "block" }}
                >
                  {autocompleteContracts[actionIndex] &&
                    autocompleteContracts[actionIndex].map((item, key) => (
                      <div
                        key={key}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectContract(actionIndex, item);
                          formData.actions[
                            actionIndex
                          ].showAutocompleteContracts = false;
                          setFormData({ ...formData });
                        }}
                      >
                        {item.scope}
                      </div>
                    ))}
                </div>
              ) : null}
            </div>
            <div className="field_row1 autocomplete">
              <label>Action</label>
              <input
                type="text"
                value={action.name}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    actions: prev.actions.map((action, i) =>
                      i === actionIndex
                        ? { ...action, name: event.target.value }
                        : action,
                    ),
                  }));
                }}
                onBlur={() => {
                  setFormData((prev) => ({
                    ...prev,
                    actions: prev.actions.map((action, i) =>
                      i === actionIndex
                        ? { ...action, showAutocompleteNames: false }
                        : action,
                    ),
                  }));
                }}
                onFocus={() => {
                  setFormData((prev) => ({
                    ...prev,
                    actions: prev.actions.map((action, i) =>
                      i === actionIndex
                        ? { ...action, showAutocompleteNames: true }
                        : action,
                    ),
                  }));
                }}
              />

              {formData.actions[actionIndex].showAutocompleteNames ? (
                <div
                  className="autocomplete-items"
                  style={{
                    display: "block",
                    height: "300px",
                    overflowY: "scroll",
                  }}
                >
                  {autocompleteNames[actionIndex] &&
                    autocompleteNames[actionIndex].map((name, key) => (
                      <div
                        key={key}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectName(actionIndex, name);
                          formData.actions[actionIndex].showAutocompleteNames =
                            false;
                          setFormData({ ...formData });
                        }}
                      >
                        {name}
                      </div>
                    ))}
                </div>
              ) : null}
            </div>
            <Authorizations
              formData={formData}
              setFormData={setFormData}
              actionIndex={actionIndex}
            />
            {Object.keys(action.data).length ? (
              <>
                <div style={{ marginTop: "15px" }}>
                  <label>Data</label>
                  {Object.keys(action.data).map((key, index) => (
                    <div className="field_row1" key={index}>
                      <label>{key}</label>
                      <input
                        type="text"
                        value={
                          typeof action.data[key] === "object"
                            ? JSON.stringify(action.data[key])
                            : action.data[key]
                        }
                        onChange={(event) => {
                          formData.actions[actionIndex].data[key] =
                            event.target.value;
                          setFormData({ ...formData });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ))}
        <input
          type="button"
          className="add_action"
          value="Add NEW ACTION +"
          onClick={addAction}
        />
      </div>
    </>
  );
};

export default Actions;
