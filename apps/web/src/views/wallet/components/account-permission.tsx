import { Numeric } from "eosjs";
import { useState } from "react";
import { Link } from "react-router";
import Icon from "../../../app/components/ui/Icon";

const AccountPermission = ({ permission, linkAuth, parentPermission }) => {
  const authItemStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  };

  const linkedAuths =
    linkAuth &&
    linkAuth.filter(
      (linkedAuth) => linkedAuth.requirement === permission.perm_name,
    );

  const [toggleFormatKeys, setToggleFormatkeys] = useState([]);

  const formatPublicKey = (public_key) => {
    const key = Numeric.stringToPublicKey(public_key);
    let format_key;
    if (public_key.startsWith("PUB_K1")) {
      format_key = Numeric.publicKeyToLegacyString(key);
    } else if (public_key.startsWith("EOS")) {
      format_key = Numeric.publicKeyToString(key);
    }

    return format_key;
  };

  return (
    <>
      <div>
        <h5>
          {permission.perm_name} ({permission.required_auth.threshold})
        </h5>
        <ul>
          {[
            ...permission.required_auth.accounts,
            ...permission.required_auth.keys,
            ...permission.required_auth.waits,
          ].map((requiredAuthData, index) => (
            <li key={index}>
              {requiredAuthData.permission ? (
                <span style={authItemStyle}>
                  <span>+{requiredAuthData.weight}</span>
                  <Icon name="user" />
                  <a href={`/account/${requiredAuthData.permission.actor}`}>
                    {requiredAuthData.permission.actor}
                  </a>
                  &nbsp;@{requiredAuthData.permission.permission}
                </span>
              ) : null}
              {requiredAuthData.key ? (
                <span style={authItemStyle}>
                  <span>+{requiredAuthData.weight}</span>
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      if (
                        toggleFormatKeys[index] &&
                        toggleFormatKeys[index] === requiredAuthData.key
                      ) {
                        delete toggleFormatKeys[index];
                      } else {
                        toggleFormatKeys[index] = requiredAuthData.key;
                      }

                      setToggleFormatkeys([...toggleFormatKeys]);
                    }}
                  >
                    <Icon name="key" />
                  </span>
                  <Link to={`/key/${requiredAuthData.key}`}>
                    {toggleFormatKeys[index] &&
                    toggleFormatKeys[index] === requiredAuthData.key
                      ? requiredAuthData.key
                      : formatPublicKey(requiredAuthData.key)}
                  </Link>
                </span>
              ) : null}
              {requiredAuthData.wait_sec ? (
                <span style={authItemStyle}>
                  <span>+{requiredAuthData.weight}</span>
                  <Icon name="clock" />
                  <span>{requiredAuthData.wait_sec}</span>
                </span>
              ) : null}
              <br style={{ paddingBottom: 5 }} />
            </li>
          ))}
        </ul>
        {linkedAuths && linkedAuths.length ? (
          <ul
            className="linked-permissions-bg"
            style={{ marginTop: 0, padding: "13px 15px 10px" }}
          >
            {linkedAuths.map((linkedAuth, index) => (
              <li key={index}>
                {linkedAuth.code}::{linkedAuth.type}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {permission.children.length > 0 ? (
        <>
          <div>
            <div style={{ position: "relative" }}>
              <ul>
                {permission.children.map((childrenPermission) => (
                  <li key={childrenPermission.perm_name}>
                    <AccountPermission
                      permission={childrenPermission}
                      linkAuth={linkAuth}
                      parentPermission={permission}
                    />
                  </li>
                ))}
              </ul>
              <div className="children-line"></div>
            </div>
          </div>
          <div className="mask-line"></div>
        </>
      ) : null}

      {parentPermission &&
      parentPermission.children[parentPermission.children.length - 1] &&
      parentPermission.children[parentPermission.children.length - 1]
        .perm_name === permission.perm_name ? (
        <div className="mask-line"></div>
      ) : null}
    </>
  );
};

export default AccountPermission;
