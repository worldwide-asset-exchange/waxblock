import { useContext, useState } from "react";
import { Helmet } from "react-helmet-async";
import { WalletContext } from "../../../../app/contexts/wallet-context";
import {
  buildSortedAuthority,
  EditableAuthority,
  normalizePublicKey,
  parseAuthorization,
} from "../../../../app/utilities/authority";
import type {
  ChainAction,
  WalletTransaction,
} from "../../../../app/types/blockchain";

type AdvancedFormData = {
  current_permission: string;
  permission: string;
  parent: string;
  threshold: string | number;
  authorities: EditableAuthority[];
  authorized_by: string;
};

const Advanced = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const { account } = wallet.walletAccount;
  const [formData, setFormData] = useState<AdvancedFormData>({
    current_permission: "",
    permission: "",
    parent: "",
    threshold: 1,
    authorities: [],
    authorized_by: "",
  });

  const buildPermissionFormData = (
    current_permission: string,
  ): AdvancedFormData => {
    const selectedPermission = account?.permissions.find(
      (permission) => permission.perm_name === current_permission,
    );

    const authorities: EditableAuthority[] = [];
    if (selectedPermission) {
      selectedPermission.required_auth.keys.forEach((authority) => {
        authorities.push({
          type: "key",
          authority: normalizePublicKey(authority.key),
          weight: authority.weight,
        });
      });
      selectedPermission.required_auth.accounts.forEach((authority) => {
        authorities.push({
          type: "account",
          authority:
            authority.permission.actor + "@" + authority.permission.permission,
          weight: authority.weight,
        });
      });
      selectedPermission.required_auth.waits.forEach((authority) => {
        authorities.push({
          type: "wait",
          authority: authority.wait_sec,
          weight: authority.weight,
        });
      });
    }

    return {
      current_permission,
      permission: selectedPermission ? selectedPermission.perm_name : "",
      parent: selectedPermission ? selectedPermission.parent : "active",
      threshold: selectedPermission
        ? selectedPermission.required_auth.threshold
        : 1,
      authorities,
      authorized_by: formData.authorized_by,
    };
  };

  const addAuthority = () => {
    setFormData({
      ...formData,
      authorities: [
        ...formData.authorities,
        { type: "key", authority: "", weight: 1 },
      ],
    });
  };

  const removeAuthority = (index) => {
    setFormData({
      ...formData,
      authorities: formData.authorities.filter(
        (_, authorityIndex) => authorityIndex !== index,
      ),
    });
  };

  const handleUpdateAuth = async () => {
    const walletTransaction: WalletTransaction = {
      type: "updateauth",
      actions: [],
    };

    let action: ChainAction;
    try {
      action = {
        account: "eosio",
        name: "updateauth",
        data: {
          account: session ? session.actor.toString() : null,
          permission: formData.permission,
          parent: formData.parent,
          auth: buildSortedAuthority(formData.threshold, formData.authorities),
        },
      };

      if (formData.authorized_by.trim() !== "") {
        action.authorization = [parseAuthorization(formData.authorized_by)];
      }
    } catch (error) {
      wallet.setTransactionAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Invalid authority.",
        walletTransaction: null,
      });
      return;
    }

    walletTransaction.actions.push(action);

    wallet.submitTransaction(walletTransaction);
  };

  const handleDeleteAuth = (permission) => {
    wallet.submitTransaction({
      type: "deleteauth",
      actions: [
        {
          account: "eosio",
          name: "deleteauth",
          data: {
            account: session ? session.actor.toString() : null,
            permission: permission,
          },
        },
      ],
    });
  };

  return (
    <>
      <Helmet>
        <title>Advanced Permissions | Wallet - WAX Explorer</title>
      </Helmet>

      <form id="advanced" className="forms_type active">
        <div className="field_row">
          <div className="field_col">
            <label>Change Permission</label>
            <select
              className="cars"
              value={formData.current_permission}
              onChange={(event) =>
                setFormData(buildPermissionFormData(event.target.value))
              }
            >
              <option value="">--New--</option>
              {account &&
                account.permissions.map((permission, index) => (
                  <option key={index} value={permission.perm_name}>
                    {permission.perm_name}
                  </option>
                ))}
            </select>
          </div>
          {!["", "owner", "active"].includes(formData.current_permission) ? (
            <>
              <div className="field_col">
                <label>&nbsp;</label>
                <input
                  type="button"
                  className="delete_pubkey"
                  value={`Delete ${formData.current_permission}`}
                  onClick={() => {
                    handleDeleteAuth(formData.current_permission);
                  }}
                />
              </div>
            </>
          ) : null}
        </div>
        <div className="field_row no-space">
          <div className="field_col">
            <div className="field_row">
              <div className="field_col">
                <label>Permission name</label>
                <input
                  type="text"
                  value={formData.permission}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      permission: event.target.value,
                    })
                  }
                />
              </div>
              <div className="field_col">
                <label>Parent</label>
                <input
                  type="text"
                  value={formData.parent}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      parent: event.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <div className="field_col">
            <div className="field_row">
              <div className="field_col">
                <label>Threshold</label>
                <input
                  type="number"
                  value={formData.threshold}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      threshold: event.target.value,
                    })
                  }
                />
              </div>
              <div className="field_col">
                <label>Authorized by (optional)</label>
                <input
                  type="text"
                  value={formData.authorized_by}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      authorized_by: event.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        {formData.authorities.map((authority, index) => (
          <div className="field_row no-space" key={index}>
            <div className="field_row_inner del_row1">
              <div className="field_col">
                <div className="field_row">
                  <div className="field_col">
                    <label>Type</label>
                    <select
                      className="cars"
                      value={authority.type}
                      onChange={(event) => {
                        setFormData({
                          ...formData,
                          authorities: formData.authorities.map(
                            (authority, authorityIndex) =>
                              authorityIndex === index
                                ? {
                                    ...authority,
                                    type: event.target
                                      .value as EditableAuthority["type"],
                                    authority: "",
                                  }
                                : authority,
                          ),
                        });
                      }}
                    >
                      <option value="key">Key</option>
                      <option value="account">Account</option>
                      <option value="wait">Wait secs</option>
                    </select>
                  </div>
                  {authority.type === "key" ? (
                    <div className="field_col">
                      <label>Public key</label>
                      <input
                        type="text"
                        value={authority.authority}
                        onChange={(event) => {
                          setFormData({
                            ...formData,
                            authorities: formData.authorities.map(
                              (authority, authorityIndex) =>
                                authorityIndex === index
                                  ? {
                                      ...authority,
                                      authority: event.target.value,
                                    }
                                  : authority,
                            ),
                          });
                        }}
                      />
                    </div>
                  ) : null}
                  {authority.type === "account" ? (
                    <div className="field_col">
                      <label>Actor@permission</label>
                      <input
                        type="text"
                        value={authority.authority}
                        onChange={(event) => {
                          setFormData({
                            ...formData,
                            authorities: formData.authorities.map(
                              (authority, authorityIndex) =>
                                authorityIndex === index
                                  ? {
                                      ...authority,
                                      authority: event.target.value,
                                    }
                                  : authority,
                            ),
                          });
                        }}
                      />
                    </div>
                  ) : null}
                  {authority.type === "wait" ? (
                    <div className="field_col">
                      <label>Time in seconds to wait</label>
                      <input
                        type="number"
                        value={authority.authority}
                        onChange={(event) => {
                          setFormData({
                            ...formData,
                            authorities: formData.authorities.map(
                              (authority, authorityIndex) =>
                                authorityIndex === index
                                  ? {
                                      ...authority,
                                      authority: event.target.value,
                                    }
                                  : authority,
                            ),
                          });
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="field_col">
                <div className="field_row">
                  <div className="field_col">
                    <label>Weight</label>
                    <input
                      type="number"
                      value={authority.weight}
                      onChange={(event) => {
                        setFormData({
                          ...formData,
                          authorities: formData.authorities.map(
                            (authority, authorityIndex) =>
                              authorityIndex === index
                                ? {
                                    ...authority,
                                    weight: event.target.value,
                                  }
                                : authority,
                          ),
                        });
                      }}
                    />
                  </div>
                  <div className="field_col del_col">
                    <label>&nbsp;</label>
                    <input
                      type="button"
                      className="delete_pubkey"
                      value="Delete"
                      onClick={() => {
                        removeAuthority(index);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="field_row">
          <input
            type="button"
            className="clone_perm"
            value="Add NEW +"
            onClick={() => {
              addAuthority();
            }}
          />
        </div>
        <div className="field_row1">
          <input
            type="button"
            //defaultValue="UPDATE KEYS"
            value={
              formData.current_permission !== ""
                ? "Update permission"
                : "Add new permission"
            }
            onClick={handleUpdateAuth}
          />
        </div>
      </form>
    </>
  );
};

export default Advanced;
