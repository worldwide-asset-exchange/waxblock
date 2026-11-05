import { Outlet } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "../app/components/error-fallback";

import Footer from "./components/footer";
import Header from "./components/header";
import Modals from "./components/modals";
import WalletTransactionAlert from "../app/components/wallet-transaction-alert";
import LocalnetSettings from "./components/localnet-settings";
import config from "../app/config";
import AdContainer from "./components/ad-container";

const DefaultLayout = () => {
  if (config.network_type === "localnet" && !config.chain_id) {
    return (
      <>
        <section id="layout" role="main">
          <div className="body_cont">
            <div className="wrapper">
              <LocalnetSettings />
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section id="layout" role="main">
        <Header />
        <AdContainer />
        <div className="body_cont">
          <div className="wrapper">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </div>
        <Footer />
      </section>
      <Modals />
      <WalletTransactionAlert />
    </>
  );
};

export default DefaultLayout;
