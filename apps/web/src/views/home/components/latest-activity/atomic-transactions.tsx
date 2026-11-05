import Skeleton from "react-loading-skeleton";
import { numberFormat } from "../../../../app/utilities/format";

const AtomicTransactions = ({ statistics }) => {
  return (
    <>
      <div className="chart_box">
        <div className="details">
          <span className="type">NFT transactions (24 hours)</span>
          <span className="value">
            {statistics && statistics.atomicassets ? (
              numberFormat(statistics.atomicassets.transfers_24h)
            ) : (
              <Skeleton />
            )}
          </span>
        </div>
      </div>
    </>
  );
};

export default AtomicTransactions;
