import { Helmet } from "react-helmet-async";
import { Link, Outlet, useLocation } from "react-router";
import { useContext } from "react";
import { WalletContext } from "../../../app/contexts/wallet-context";
import AccountPermissions from "../components/account-permissions";

const Permissions = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const { account, accInfo } = wallet.walletAccount;
  const location = useLocation();

  const permissions = account ? account.permissions : null;
  const linkAuth = accInfo ? accInfo.linkauth : null;

  return (
    <>
      <Helmet>
        <title>Permissions | Wallet - WAX Explorer</title>
      </Helmet>

      <div className="form_box permission_form active">
        <ul className="form_tabs">
          <li
            className={`nav-link ${
              ["/wallet/permissions", "/wallet/permissions/basic"].includes(
                location.pathname,
              )
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/permissions/basic">Simple</Link>
          </li>
          <li
            className={`nav-link ${
              ["/wallet/permissions/advanced"].includes(location.pathname)
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/permissions/advanced">Advanced</Link>
          </li>
          <li
            className={`nav-link ${
              ["/wallet/permissions/link-auth"].includes(location.pathname)
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/permissions/link-auth">Link Auth</Link>
          </li>
        </ul>
        <Outlet />
      </div>
      {session ? (
        <div className="tab_sec">
          <ul className="tabbbing">
            <li className="active">
              <a href="#currentPermission">Current Permission</a>
            </li>
            {/* <li>
              <a href="#tab2">New Permissions</a>
            </li> */}
          </ul>
          <div
            className="tab listing currentPermission active"
            id="currentPermission"
            style={{ color: "#fff" }}
          >
            <AccountPermissions permissions={permissions} linkAuth={linkAuth} />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Permissions;
