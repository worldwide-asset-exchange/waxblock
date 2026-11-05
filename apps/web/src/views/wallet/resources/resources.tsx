import { Link, Outlet, useLocation } from "react-router";

const Resources = () => {
  const location = useLocation();

  return (
    <>
      <div className="form_box manage_form active">
        <h2>Manage CPU/NET</h2>

        <ul className="form_tabs">
          <li
            className={`nav-link ${
              ["/wallet/resources", "/wallet/resources/stake"].includes(
                location.pathname,
              )
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/resources/stake">Stake</Link>
          </li>
          <li
            className={`nav-link ${
              ["/wallet/resources/unstake"].includes(location.pathname)
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/resources/unstake">Unstake</Link>
          </li>
          <li
            className={`nav-link ${
              ["/wallet/resources/refund"].includes(location.pathname)
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/resources/refund">Refund</Link>
          </li>
        </ul>

        <Outlet />
      </div>
    </>
  );
};

export default Resources;
