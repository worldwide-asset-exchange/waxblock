import { Link } from "react-router";
import Icon from "../../../app/components/ui/Icon";

const Permission = ({ permission, linkAuth }) => {
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
                  <Icon name="key" />
                  <Link to={`/key/${requiredAuthData.key}`}>
                    {requiredAuthData.key}
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
        {linkedAuths.length ? (
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
              {permission.children.map((permission) => (
                <ul key={permission.perm_name}>
                  <li>
                    <Permission permission={permission} linkAuth={linkAuth} />
                  </li>
                </ul>
              ))}
              <div className="children-line"></div>
            </div>
          </div>
          <div className="mask-line"></div>
        </>
      ) : null}
    </>
  );
};

export default Permission;
