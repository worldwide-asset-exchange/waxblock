import Accounts from "./accounts";
import Block from "./block";
import BlockProducer from "./block-producer";
import MarketPrice from "./market-price";
import TransactionsPerSecond from "./transactions-per-second";
import NftsCreated from "./nfts-created";
import AtomicTransactions from "./atomic-transactions";
import CarbonNeutral from "./carbon-neutral";
import config from "../../../../app/config";

const LatestActivity = ({ chainInfo, statistics }) => {
  return (
    <>
      <div className="cont_sec act_sec">
        <h2>Latest Activity</h2>
        <p>The latest activity from the WAX blockchain</p>
        <div className="chart_boxes">
          <BlockProducer chainInfo={chainInfo} />
          <Block chainInfo={chainInfo} />
          <TransactionsPerSecond />
          <MarketPrice statistics={statistics} />
          {config.network_type === "mainnet" ||
          config.network_type === "testnet" ? (
            <>
              <Accounts statistics={statistics} />
              <NftsCreated statistics={statistics} />
              <AtomicTransactions statistics={statistics} />
              <CarbonNeutral />
            </>
          ) : null}
          {/* <Transactions />
          <Staked />
          <Wallets />
          <Accounts />
          <Unstaked />
          <Ram />
          <Cpu /> */}
        </div>
      </div>
    </>
  );
};

export default LatestActivity;
