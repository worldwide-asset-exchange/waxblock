import { Link, Outlet, useLocation } from "react-router";
import config from "../../../app/config";

const Vote = () => {
  const location = useLocation();

  return (
    <>
      <div className="form_box vote_form active">
        <h2>Vote</h2>
        <ul className="form_tabs">
          <li
            className={`${
              ["/wallet/vote", "/wallet/vote/producers"].includes(
                location.pathname,
              )
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/vote/producers">Producers</Link>
          </li>
          {config.network_type === "mainnet" ? (
            <li
              className={`${
                ["/wallet/vote/proxies"].includes(location.pathname)
                  ? "active"
                  : ""
              }`}
            >
              <Link to="/wallet/vote/proxies">Proxies</Link>
            </li>
          ) : null}
        </ul>
        <Outlet />
      </div>
    </>
  );
};

export default Vote;
