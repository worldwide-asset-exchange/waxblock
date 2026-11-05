import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";

const Ram = () => {
  const [ramPrice, setRamPrice] = useState(0);
  const location = useLocation();

  useEffect(() => {
    BlockchainApiManager.getTableRows({
      code: "eosio",
      scope: "eosio",
      table: "rammarket",
      lower_bound: "",
      upper_bound: "",
      limit: 1,
    }).then((response) => {
      if (response && response.rows) {
        const connectorBalance = parseFloat(response.rows[0].quote.balance);
        const smartTokensOutstandingSupply = parseFloat(
          response.rows[0].base.balance,
        );
        const ramPrice = connectorBalance / smartTokensOutstandingSupply;
        setRamPrice(ramPrice);
      }
    });
  }, []);

  return (
    <>
      <div className="form_box buy_sell_form active">
        <h2>Buy/Sell RAM</h2>
        <ul className="form_tabs">
          <li
            className={`nav-link ${
              ["/wallet/ram", "/wallet/ram/buy"].includes(location.pathname)
                ? "active"
                : ""
            }`}
          >
            <Link to="/wallet/ram/buy">Buy RAM</Link>
          </li>
          <li
            className={`nav-link ${
              ["/wallet/ram/sell"].includes(location.pathname) ? "active" : ""
            }`}
          >
            <Link to="/wallet/ram/sell">Sell RAM</Link>
          </li>
        </ul>
        <Outlet context={[ramPrice]} />
      </div>
    </>
  );
};

export default Ram;
