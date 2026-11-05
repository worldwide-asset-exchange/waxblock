import Skeleton from "react-loading-skeleton";
import {
  currencyFormat,
  shortNumberFormat,
} from "../../../../app/utilities/format";

const MarketPrice = ({ statistics }) => {
  return (
    <>
      <div className="chart_box">
        <div className="details">
          <span className="type">Price / Marketcap</span>
          <span className="value">
            {statistics && statistics.market_data ? (
              <>
                ${currencyFormat(statistics.market_data.current_price.usd, 3)} /
                ${shortNumberFormat(statistics.market_data.market_cap.usd)}
              </>
            ) : (
              <Skeleton />
            )}
          </span>

          <span className="val_change">
            {statistics && statistics.market_data ? (
              <>
                {statistics.market_data.price_change_percentage_24h >= 0 ? (
                  <img src="common/images/up_arr.svg" alt="up_arr" />
                ) : (
                  <img src="common/images/down_arr.svg" alt="down_arr" />
                )}
                {statistics.market_data.price_change_percentage_24h.toLocaleString()}
                %
              </>
            ) : (
              <Skeleton />
            )}
          </span>
        </div>
      </div>
    </>
  );
};

export default MarketPrice;
