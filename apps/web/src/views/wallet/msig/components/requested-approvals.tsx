const RequestedApprovals = ({ formData, setFormData }) => {
  const addRequested = () => {
    formData.requested.push({ actor: "", permission: "" });
    setFormData({ ...formData });
  };

  const removeRequested = (index) => {
    formData.requested.splice(index, 1);
    setFormData({ ...formData });
  };

  return (
    <>
      <div className="field_row req_appr">
        <label>Request Approvals</label>
        {formData.requested &&
          formData.requested.map((requested, index) => (
            <div className="field_row_inner del_row" key={index}>
              <div className="field_col autocomplete">
                <input
                  type="text"
                  name="actor"
                  placeholder="Actor"
                  required
                  value={requested.actor}
                  onChange={(event) => {
                    formData.requested[index].actor =
                      event.target.value.toLowerCase();
                    setFormData({ ...formData });
                    //autocompleteRequestedActor(index);
                    //loadRequestedActorPermissions(index)
                  }}
                  // onBlur={() => {
                  //   formData.requested[
                  //     index
                  //   ].showAutocompleteRequestedActors = false;
                  //   setFormData({ ...formData });
                  // }}
                  // onFocus={() => {
                  //   formData.requested[
                  //     index
                  //   ].showAutocompleteRequestedActors = true;
                  //   setFormData({ ...formData });
                  // }}
                />
                {/* {formData.requested[index].showAutocompleteRequestedActors ? (
                <div className="autocomplete-items">
                  {autocompleteRequestedActors[index] &&
                    autocompleteRequestedActors[index].map((item, key) => (
                      <div
                        key={key}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectRequestedActor(index, item);
                          formData.requested[
                            index
                          ].showAutocompleteRequestedActors = false;
                          setFormData({ ...formData });
                        }}
                      >
                        {item.scope}
                      </div>
                    ))}
                </div>
              ) : null} */}
              </div>
              <div className="field_col">
                <input
                  type="text"
                  name="permission"
                  placeholder="Permission"
                  required
                  value={requested.permission}
                  onChange={(event) => {
                    setFormData((prev) => ({
                      ...prev,
                      requested: prev.requested.map((item, i) =>
                        i === index
                          ? { ...item, permission: event.target.value }
                          : item,
                      ),
                    }));
                  }}
                />
                {/* <select
                className="cars"
                onChange={(event) => {
                  formData.requested[index].permission = event.target.value;
                  setFormData({ ...formData });
                }}
              >
                <option value="">--Select--</option>
                {requestedPermissions[index] &&
                  requestedPermissions[index].map((permission, key) => (
                    <option key={key} value={permission.perm_name}>
                      {permission.perm_name}
                    </option>
                  ))}
              </select> */}
              </div>
              <div className="field_col del_col">
                <input
                  type="button"
                  className="delete_req"
                  defaultValue="Delete"
                  onClick={() => removeRequested(index)}
                />
              </div>
            </div>
          ))}
        <input
          type="button"
          className="clone_req"
          value="Add NEW +"
          onClick={addRequested}
        />
      </div>
    </>
  );
};

export default RequestedApprovals;
