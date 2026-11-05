import { useContext, useState } from "react";
import { Helmet } from "react-helmet-async";
import { WalletContext } from "../../../../app/contexts/wallet-context";
import BlockchainApiManager from "../../../../app/services/blockchainApiManager";

const LinkAuth = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const { account } = wallet.walletAccount;
  const [formData, setFormData] = useState({
    permission: "",
    contracts: [
      {
        contract_name: "",
        contract_action: "",
        contract_names: [],
        contract_actions: [],
        show_contract_names: false,
      },
    ],
  });

  const autocompleteContractNames = (index) => {
    // if (
    //   !new RegExp("^[a-z1-5.]{1,12}$", "i").test(
    //     formData.contracts[index].contract_name
    //   )
    // ) {
    //   autocompleteAuthorizationActors[actionIndex][index] = [];
    //   setAutocompleteAuthorizationActors([...autocompleteAuthorizationActors]);
    //   return;
    // }

    let keywords = formData.contracts[index].contract_name;

    if (keywords === "") {
      keywords = "eosio";
    }

    keywords = keywords.toLowerCase();
    BlockchainApiManager.getTableByScope({
      code: "eosio",
      table: "userres",
      lower_bound: keywords,
      upper_bound: keywords.padEnd(12, "z"),
      limit: 10,
    }).then((res) => {
      formData.contracts[index].contract_names = [];
      if (res && res.rows) {
        res.rows.forEach((item) => {
          formData.contracts[index].contract_names.push({
            scope: item.scope,
          });
        });
      }

      setFormData({
        ...formData,
      });
    });
  };

  const selectContractName = (index, item) => {
    setFormData((prev) => ({
      ...prev,
      contracts: prev.contracts.map((contract, i) =>
        i === index
          ? { ...contract, contract_name: item.scope, contract_actions: [] }
          : contract,
      ),
    }));

    const keywords = item.scope.toLowerCase();
    BlockchainApiManager.getAbi(keywords).then((res) => {
      setFormData((prev) => ({
        ...prev,
        contracts: prev.contracts.map((contract, i) =>
          i === index
            ? {
                ...contract,
                contract_actions: res?.abi?.actions ?? [],
              }
            : contract,
        ),
      }));
    });
  };

  const loadContractActions = (index) => {
    const keywords = formData.contracts[index].contract_name.toLowerCase();
    BlockchainApiManager.getAbi(keywords).then((res) => {
      setFormData((prev) => ({
        ...prev,
        contracts: prev.contracts.map((contract, i) =>
          i === index
            ? {
                ...contract,
                contract_actions: res?.abi?.actions ?? [],
              }
            : contract,
        ),
      }));
    });
  };

  const linkAuth = () => {
    const walletTransaction = {};
    walletTransaction.type = "linkauth";
    walletTransaction.actions = [];

    formData.contracts.forEach((contract) => {
      walletTransaction.actions.push({
        account: "eosio",
        name: "linkauth",
        data: {
          account: session ? session.actor.toString() : null,
          code: contract.contract_name,
          type:
            contract.contract_action === "All" ? "*" : contract.contract_action,
          requirement: formData.permission,
        },
      });
    });

    wallet.submitTransaction(walletTransaction);
  };

  const unlinkAuth = () => {
    const walletTransaction = {};
    walletTransaction.type = "unlinkauth";
    walletTransaction.actions = [];

    formData.contracts.forEach((contract) => {
      walletTransaction.actions.push({
        account: "eosio",
        name: "unlinkauth",
        data: {
          account: session ? session.actor.toString() : null,
          code: contract.contract_name,
          type:
            contract.contract_action === "All" ? "*" : contract.contract_action,
        },
      });
    });

    wallet.submitTransaction(walletTransaction);
  };

  const addContract = () => {
    formData.contracts.push({
      contract_name: "",
      contract_action: "",
      contract_names: [],
      contract_actions: [],
    }); //Add new
    setFormData({
      ...formData,
    });
  };
  const removeContract = (index) => {
    formData.contracts.splice(index, 1);
    setFormData({
      ...formData,
    });
  };

  return (
    <>
      <Helmet>
        <title>Link Auth Permissions | Wallet - WAX Explorer</title>
      </Helmet>

      <form id="linkAuth" className="forms_type active">
        <div className="field_row">
          <div className="field_col">
            <label>Permission (only needed for linking)</label>
            <select
              className="cars"
              value={formData.permission}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  permission: event.target.value,
                })
              }
            >
              <option value="">--Select--</option>
              {account &&
                account.permissions.map((permission, index) => (
                  <option key={index} value={permission.perm_name}>
                    {permission.perm_name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        {formData.contracts.map((contract, index) => (
          <div className="field_row_inner del_row" key={index}>
            <div className="field_col autocomplete">
              <label>Contract Name</label>
              <input
                type="text"
                value={contract.contract_name}
                onChange={(event) => {
                  formData.contracts[index].contract_name =
                    event.target.value.toLowerCase();
                  setFormData({
                    ...formData,
                  });
                  autocompleteContractNames(index);
                  loadContractActions(index);
                }}
                onBlur={() => {
                  formData.contracts[index].show_contract_names = false;
                  setFormData({ ...formData });
                }}
                onFocus={() => {
                  formData.contracts[index].show_contract_names = true;
                  setFormData({ ...formData });
                }}
              />
              {formData.contracts[index].show_contract_names ? (
                <div className="autocomplete-items">
                  {formData.contracts[index].contract_names.map((item, key) => (
                    <div
                      key={key}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectContractName(index, item);
                        formData.contracts[index].show_contract_names = false;

                        setFormData({ ...formData });
                      }}
                    >
                      {item.scope}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="field_col">
              <label>Contract Action</label>
              <select
                className="cars"
                value={contract.contract_action}
                onChange={(event) => {
                  setFormData((prev) => ({
                    ...prev,
                    contracts: prev.contracts.map((contract, i) =>
                      i === index
                        ? {
                            ...contract,
                            contract_action: event.target.value,
                          }
                        : contract,
                    ),
                  }));
                }}
              >
                <option value="">--Select--</option>
                <option value="All">All</option>
                {contract.contract_actions.map((contract_action, index) => (
                  <option key={index} value={contract_action.name}>
                    {contract_action.name}
                  </option>
                ))}
              </select>
              {/* <input
                  type="text"
                  value={contract.contract_action}
                  onChange={(event) => {
                    formData.contracts[index].contract_action =
                      event.target.value;
                    setFormData({
                      ...formData,
                    });
                  }}
                /> */}
            </div>
            <div className="field_col del_col">
              <label>&nbsp;</label>
              {index > 0 ? (
                <>
                  <input
                    type="button"
                    className="delete_req"
                    value="Delete"
                    onClick={() => {
                      removeContract(index);
                    }}
                  />
                </>
              ) : null}
            </div>
          </div>
        ))}

        <div className="field_row">
          <input
            type="button"
            className="clone_perm"
            value="Add NEW +"
            onClick={() => {
              addContract();
            }}
          />
        </div>
        <div className="field_row1">
          <input type="button" defaultValue="Link Auth" onClick={linkAuth} />
          &nbsp;
          <input
            type="button"
            defaultValue="Unlink Auth"
            onClick={unlinkAuth}
          />
        </div>
      </form>
    </>
  );
};

export default LinkAuth;
