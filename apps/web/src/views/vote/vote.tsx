import { Link, Outlet, useLocation } from "react-router";
import config from "../../app/config";
import AccountSummary from "../wallet/components/account-summary";

const Vote = () => {
  const location = useLocation();

  return (
    <>
      <AccountSummary />
      <div className="mid_sec">
        <div className="form_sec full">
          <div className="form_box vote_form active">
            <h2>Vote</h2>
            <ul className="form_tabs">
              <li
                className={`${
                  ["/vote", "/vote/producers"].includes(location.pathname)
                    ? "active"
                    : ""
                }`}
              >
                <Link to="/vote">Producers</Link>
              </li>
              {config.network_type === "mainnet" ? (
                <li
                  className={`${
                    ["/vote/proxies"].includes(location.pathname)
                      ? "active"
                      : ""
                  }`}
                >
                  <Link to="/vote/proxies">Proxies</Link>
                </li>
              ) : null}
            </ul>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default Vote;
