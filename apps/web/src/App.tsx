import { Routes, Route, useLocation, Navigate } from "react-router";
import { Helmet } from "react-helmet-async";
import ScrollToTop from "./app/components/scroll-to-top";

import "./App.css";

import DefaultLayout from "./layouts/default";
import Home from "./views/home";
import Block from "./views/block";
import Transaction from "./views/transaction";
import Account from "./views/account/account";
import Wallet from "./views/wallet";
import WalletOverview from "./views/wallet/overview";
import Transfer from "./views/wallet/transfer";
import Resources from "./views/wallet/resources";
import Stake from "./views/wallet/resources/stake";
import Unstake from "./views/wallet/resources/unstake";
import Refund from "./views/wallet/resources/refund";
import WalletVote from "./views/wallet/vote/vote";
import WalletVoteProducers from "./views/wallet/vote/producers";
import WalletVoteProxies from "./views/wallet/vote/proxies";
import Ram from "./views/wallet/ram/ram";
import Buy from "./views/wallet/ram/buy";
import Sell from "./views/wallet/ram/sell";
import Permissions from "./views/wallet/permissions";
import Nft from "./views/nft";
import Msig from "./views/wallet/msig";
import MsigDetail from "./views/msig";
import Bidnames from "./views/wallet/bidnames";
import GbmRewards from "./views/wallet/gbm-rewards";
import Basic from "./views/wallet/permissions/basic";
import Advanced from "./views/wallet/permissions/advanced";
import LinkAuth from "./views/wallet/permissions/link-auth";
import Keys from "./views/wallet/utilities/keys/keys";
import Utilities from "./views/wallet/utilities/utilities";
import CancelDeferred from "./views/wallet/utilities/cancel-deferred/cancel-deferred";
import FormatKeys from "./views/wallet/utilities/format-keys/format-keys";
import UploadContract from "./views/wallet/utilities/upload-contract/upload-contract";
import Tokens from "./views/tokens";
import TokensList from "./views/tokens/list";
import TokensDetail from "./views/tokens/detail";
import Chain from "./views/chain";
import ProtocolFeatures from "./views/protocol-features";
import Namebids from "./views/namebids/namebids";
import CreateAccount from "./views/wallet/create-account";
import CreateAccountAdvanced from "./views/wallet/create-account/advanced";
import Key from "./views/key/key";
import PowerUp from "./views/wallet/powerup";
import config from "./app/config";
import Settings from "./views/settings";
import Network from "./views/settings/network";

function LegacyVoteRedirect() {
  const location = useLocation();
  const legacyVotePath = location.pathname.replace(/^\/vote/, "");

  return (
    <Navigate
      to={`/wallet/vote${legacyVotePath}${location.search}${location.hash}`}
      replace
    />
  );
}

function App() {
  const location = useLocation();
  return (
    <>
      <Helmet>
        <title>WAX Block Explorer and Wallet</title>
      </Helmet>
      <ScrollToTop />
      <Routes location={location}>
        <Route path="/" element={<DefaultLayout />}>
          <Route index element={<Home />} />
          <Route path="block" element={<Block />} />
          <Route path="block/:id" element={<Block />} />
          <Route path="transaction" element={<Transaction />} />
          <Route path="transaction/:id" element={<Transaction />} />
          <Route path="key" element={<Key />} />
          <Route path="key/:key" element={<Key />} />
          {/* <Route path="account/:account" element={<Account />} /> */}
          <Route path="account">
            <Route index element={<Account />} />
            <Route path=":account" element={<Account />} />
          </Route>
          <Route path="wallet" element={<Wallet />}>
            <Route index element={<WalletOverview />} />
            <Route path="transfer" element={<Transfer />} />
            <Route path="resources" element={<Resources />}>
              <Route index element={<Stake />} />
              <Route path="stake" element={<Stake />} />
              <Route path="unstake" element={<Unstake />} />
              <Route path="refund" element={<Refund />} />
            </Route>
            <Route path="vote" element={<WalletVote />}>
              <Route index element={<WalletVoteProducers />} />
              <Route path="producers" element={<WalletVoteProducers />} />
              <Route path="proxies" element={<WalletVoteProxies />} />
            </Route>
            <Route path="ram" element={<Ram />}>
              <Route index element={<Buy />} />
              <Route path="buy" element={<Buy />} />
              <Route path="sell" element={<Sell />} />
            </Route>
            <Route path="permissions" element={<Permissions />}>
              <Route index element={<Basic />} />
              <Route path="basic" element={<Basic />} />
              <Route path="advanced" element={<Advanced />} />
              <Route path="link-auth" element={<LinkAuth />} />
            </Route>
            <Route path="msig" element={<Msig />} />
            <Route path="bidnames" element={<Bidnames />} />
            <Route path="gbm-rewards" element={<GbmRewards />} />
            <Route path="utilities" element={<Utilities />}>
              <Route index element={<Keys />} />
              <Route path="keys" element={<Keys />} />
              <Route path="cancel-deferred" element={<CancelDeferred />} />
              <Route path="format-keys" element={<FormatKeys />} />
              <Route path="upload-contract" element={<UploadContract />} />
            </Route>
            <Route path="create-account" element={<CreateAccount />}>
              <Route index element={<CreateAccountAdvanced />} />
              <Route path="advanced" element={<CreateAccountAdvanced />} />
            </Route>
            {config.network_type === "mainnet" ||
            config.network_type === "testnet" ? (
              <Route path="powerup" element={<PowerUp />} />
            ) : null}
          </Route>
          <Route path="nft" element={<Nft />} />
          <Route path="nft/:assetType/:assetId" element={<Nft />} />
          <Route path="msig" element={<MsigDetail />} />
          <Route path="msig/:scope/:name" element={<MsigDetail />} />
          <Route path="tokens" element={<Tokens />}>
            <Route index element={<TokensList />} />
            <Route path=":key" element={<TokensDetail />} />
          </Route>
          <Route path="chain" element={<Chain />} />
          <Route path="protocol-features" element={<ProtocolFeatures />} />
          <Route path="vote/*" element={<LegacyVoteRedirect />} />
          <Route path="namebids" element={<Namebids />} />
          <Route path="settings" element={<Settings />}>
            <Route index element={<Network />} />
            <Route path="network" element={<Network />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
