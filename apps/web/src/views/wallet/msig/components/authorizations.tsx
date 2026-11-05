import BlockchainApiManager from "../../../../app/services/blockchainApiManager";

const Authorizations = ({ formData, setFormData, actionIndex }) => {
  const addAuthorization = (actionIndex) => {
    formData.actions[actionIndex].authorization.push({
      actor: "",
      permission: "",
    });
    setFormData({ ...formData });
  };

  const removeAuthorization = (actionIndex, index) => {
    formData.actions[actionIndex].authorization.splice(index, 1);
    setFormData({ ...formData });
  };

  const loadRequestedApprovals = async (actionIndex, index) => {
    const actor = formData.actions[actionIndex].authorization[index].actor;
    const permission =
      formData.actions[actionIndex].authorization[index].permission;

    if (!actor || !permission) return;

    const account = await BlockchainApiManager.getAccount(actor);
    if (!account) return;

    for (const accountPermission of account.permissions) {
      if (accountPermission.perm_name !== permission) continue;

      for (const requiredAuthAccount of accountPermission.required_auth
        .accounts) {
        const accountSub = await BlockchainApiManager.getAccount(
          requiredAuthAccount.permission.actor,
        );
        if (!accountSub) return;

        for (const accountSubPermission of accountSub.permissions) {
          if (accountSubPermission.perm_name !== permission) continue;

          for (const requiredAuthAccountSub of accountSubPermission
            .required_auth.accounts) {
            const requestedExists = formData.requested.find(
              (requested) =>
                requested.actor === requiredAuthAccountSub.permission.actor &&
                requested.permission ===
                  requiredAuthAccountSub.permission.permission,
            );

            if (!requestedExists) {
              formData.requested.push({
                actor: requiredAuthAccountSub.permission.actor,
                permission: requiredAuthAccountSub.permission.permission,
              });
            }
          }

          setFormData({ ...formData });
        }
      }
    }
  };

  return (
    <>
      <label>Authorizations</label>
      {formData.actions[actionIndex].authorization &&
        formData.actions[actionIndex].authorization.map(
          (authorization, index) => (
            <div className="field_row_inner del_row" key={index}>
              <div className="field_col autocomplete">
                <input
                  type="text"
                  placeholder="Actor"
                  value={authorization.actor}
                  onChange={(event) => {
                    formData.actions[actionIndex].authorization[index].actor =
                      event.target.value.toLowerCase();
                    setFormData({ ...formData });
                    //autocompleteAuthorizationActor(actionIndex, index);
                  }}
                  onBlur={() => {
                    loadRequestedApprovals(actionIndex, index);
                  }}
                  // onBlur={() => {
                  //   formData.actions[actionIndex].authorization[
                  //     index
                  //   ].showAutocompleteAuthorizationActors = false;
                  //   setFormData({ ...formData });
                  // }}
                  // onFocus={() => {
                  //   formData.actions[actionIndex].authorization[
                  //     index
                  //   ].showAutocompleteAuthorizationActors = true;
                  //   setFormData({ ...formData });
                  // }}
                />
                {/* {formData.actions[actionIndex].authorization[index]
                .showAutocompleteAuthorizationActors ? (
                <div className="autocomplete-items">
                  {autocompleteAuthorizationActors[actionIndex] &&
                    autocompleteAuthorizationActors[actionIndex][index] &&
                    autocompleteAuthorizationActors[actionIndex][index].map(
                      (item, key) => (
                        <div
                          key={key}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectAuthorizationActor(actionIndex, index, item);
                            formData.actions[actionIndex].authorization[
                              index
                            ].showAutocompleteAuthorizationActors = false;
                            setFormData({ ...formData });
                          }}
                        >
                          {item.scope}
                        </div>
                      )
                    )}
                </div>
              ) : null} */}
              </div>
              <div className="field_col">
                <input
                  type="text"
                  placeholder="Permission"
                  value={authorization.permission}
                  onChange={(event) => {
                    setFormData((prev) => ({
                      ...prev,
                      actions: prev.actions.map((action, i) =>
                        i === actionIndex
                          ? {
                              ...action,
                              authorization: action.authorization.map(
                                (auth, j) =>
                                  j === index
                                    ? {
                                        ...auth,
                                        permission: event.target.value,
                                      }
                                    : auth,
                              ),
                            }
                          : action,
                      ),
                    }));
                  }}
                  onBlur={() => {
                    loadRequestedApprovals(actionIndex, index);
                  }}
                />
                {/* <select
                className="cars"
                onChange={(event) => {
                  formData.actions[actionIndex].authorization[
                    index
                  ].permission = event.target.value;
                  setFormData({ ...formData });
                }}
              >
                <option value="">--Select--</option>
                {authorizationPermissions[actionIndex] &&
                  authorizationPermissions[actionIndex][index] &&
                  authorizationPermissions[actionIndex][index].map(
                    (permission, key) => (
                      <option key={key} value={permission.perm_name}>
                        {permission.perm_name}
                      </option>
                    )
                  )}
              </select> */}
              </div>
              <div className="field_col del_col">
                <input
                  type="button"
                  className="delete_auth"
                  defaultValue="Delete"
                  onClick={() => removeAuthorization(actionIndex, index)}
                />
              </div>
            </div>
          ),
        )}
      <input
        type="button"
        className="clone_author"
        value="Add NEW +"
        onClick={() => addAuthorization(actionIndex)}
      />
    </>
  );
};

export default Authorizations;
