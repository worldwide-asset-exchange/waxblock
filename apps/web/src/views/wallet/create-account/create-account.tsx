import { Helmet } from "react-helmet-async";
import { Link, Outlet, useLocation } from "react-router";

const CreateAccount = () => {
  const location = useLocation();

  return (
    <>
      <Helmet>
        <title>Create Account | Wallet - WAX Explorer</title>
      </Helmet>

      <div className="form_box permission_form active">
        <ul className="form_tabs">
          <li
            className={`nav-link ${
              [
                "/wallet/create-account",
                "/wallet/create-account/advanced",
              ].includes(location.pathname)
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/create-account/advanced">Advanced</Link>
          </li>
        </ul>
        <Outlet />
      </div>
    </>
  );
};

export default CreateAccount;
