import Permission from "./permission";
import { getPermissionsTree } from "../../../app/utilities/account";

const Permissions = ({ permissions, linkAuth }) => {
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
              <Permission permission={permission} linkAuth={linkAuth} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Permissions;
