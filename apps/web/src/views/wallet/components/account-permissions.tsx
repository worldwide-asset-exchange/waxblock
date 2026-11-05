import { getPermissionsTree } from "../../../app/utilities/account";
import AccountPermission from "./account-permission";

const AccountPermissions = ({ permissions, linkAuth }) => {
  const permissionsTree = permissions ? getPermissionsTree(permissions) : [];

  return (
    <>
      <div className="listing-wrapper">
        {/* <ul>
          <li>
            <div>
              <h5> owner (3) </h5>             
            </div>
            <div>
              <ul>
                <li>
                  <div>
                    <h5> active (2) </h5>                   
                  </div>
                  <div className="mask-line" />
                </li>
              </ul>
              <div className="children-line" />
            </div>
            <div className="mask-line" />
          </li>
        </ul> */}

        <ul>
          {permissionsTree.map((permission, index) => (
            <li key={index}>
              <AccountPermission
                permission={permission}
                linkAuth={linkAuth}
                parentPermission={null}
              />
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 25, marginBottom: 15 }}>
          <div style={{ display: "inline-block", verticalAlign: "top" }}>
            <b>**Note:</b>
          </div>
          <div style={{ display: "inline-block", marginLeft: 10 }}>
            {" "}
            PUB_K1 keys are the new format for public keys
            <span> and are interchangeable with the old format</span>. <br />{" "}
            Click on the <Icon name="key" /> icon to see the old format.{" "}
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountPermissions;
import Icon from "../../../app/components/ui/Icon";
