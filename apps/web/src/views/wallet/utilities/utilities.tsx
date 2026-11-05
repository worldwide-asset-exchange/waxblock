import { Link, Outlet, useLocation } from "react-router";

const Utilities = () => {
  const location = useLocation();

  return (
    <>
      <div className="form_box manage_form active">
        <ul className="form_tabs">
          <li
            className={`nav-link ${
              ["/wallet/utilities", "/wallet/utilities/keys"].includes(
                location.pathname,
              )
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/utilities/keys">Key Generator</Link>
          </li>
          <li
            className={`nav-link ${
              ["/wallet/utilities/format-keys"].includes(location.pathname)
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/utilities/format-keys">Format Keys</Link>
          </li>
          <li
            className={`nav-link ${
              ["/wallet/utilities/cancel-deferred"].includes(location.pathname)
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/utilities/cancel-deferred">Cancel Deferred</Link>
          </li>
          <li
            className={`nav-link ${
              ["/wallet/utilities/upload-contract"].includes(location.pathname)
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/utilities/upload-contract">Upload Contract</Link>
          </li>
        </ul>

        <Outlet />
      </div>
    </>
  );
};

export default Utilities;
