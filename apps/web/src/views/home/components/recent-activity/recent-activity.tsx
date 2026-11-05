import { useLocation } from "react-router";
import { createBrowserHistory } from "history";
import Producers from "./producers";
import Transactions from "./transactions";
import Proxies from "./proxies";
import Richlist from "./richlist";
import Namebids from "./namebids";
import Multisigs from "./multisigs";
import config from "../../../../app/config";
import { getHomeTabFromHash } from "../../../../app/utilities/route-tabs";

const RecentActivity = ({ chainInfo }) => {
  const location = useLocation();
  const history = createBrowserHistory();
  const activeTab = getHomeTabFromHash(location.hash);

  return (
    <>
      <div className="cont_sec tab_sec">
        <h2>Recent Activity</h2>
        <ul className="tabbbing">
          <li className={`${activeTab === "producers" ? "active" : ""}`}>
            <a
              href="#producers"
              onClick={() => history.push({ hash: "producers" })}
            >
              Guilds
            </a>
          </li>
          {config.network_type === "mainnet" ||
          config.network_type === "testnet" ? (
            <li className={`${activeTab === "transactions" ? "active" : ""}`}>
              <a
                href="#transactions"
                onClick={() => history.push({ hash: "transactions" })}
              >
                Transactions
              </a>
            </li>
          ) : null}
          {config.network_type === "mainnet" ? (
            <li className={`${activeTab === "proxies" ? "active" : ""}`}>
              <a
                href="#proxies"
                onClick={() => history.push({ hash: "proxies" })}
              >
                Proxies
              </a>
            </li>
          ) : null}

          {config.network_type === "mainnet" ||
          config.network_type === "testnet" ? (
            <li className={`${activeTab === "richlist" ? "active" : ""}`}>
              <a
                href="#richlist"
                onClick={() => history.push({ hash: "richlist" })}
              >
                Rich List
              </a>
            </li>
          ) : null}

          <li className={`${activeTab === "namebids" ? "active" : ""}`}>
            <a
              href="#namebids"
              onClick={() => history.push({ hash: "namebids" })}
            >
              Name Bids
            </a>
          </li>
          <li className={`${activeTab === "multisigs" ? "active" : ""}`}>
            <a
              href="#multisigs"
              onClick={() => history.push({ hash: "multisigs" })}
            >
              Multisigs
            </a>
          </li>
        </ul>
        <div
          className={`tab ${activeTab === "producers" ? "active" : ""}`}
          id="producers"
        >
          {activeTab === "producers" ? (
            <Producers chainInfo={chainInfo} />
          ) : null}
        </div>
        <div
          className={`tab ${activeTab === "transactions" ? "active" : ""}`}
          id="transactions"
        >
          {activeTab === "transactions" ? <Transactions /> : null}
        </div>
        <div
          className={`tab ${activeTab === "proxies" ? "active" : ""}`}
          id="proxies"
        >
          {activeTab === "proxies" ? <Proxies /> : null}
        </div>
        <div
          className={`tab ${activeTab === "richlist" ? "active" : ""}`}
          id="richlist"
        >
          {activeTab === "richlist" ? <Richlist /> : null}
        </div>
        <div
          className={`tab ${activeTab === "namebids" ? "active" : ""}`}
          id="namebids"
        >
          {activeTab === "namebids" ? <Namebids /> : null}
        </div>
        <div
          className={`tab ${activeTab === "multisigs" ? "active" : ""}`}
          id="multisigs"
        >
          {activeTab === "multisigs" ? <Multisigs /> : null}
        </div>
      </div>
    </>
  );
};

export default RecentActivity;
