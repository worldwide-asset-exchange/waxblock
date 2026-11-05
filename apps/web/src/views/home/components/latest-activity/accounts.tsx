import Skeleton from "react-loading-skeleton";
import { numberFormat } from "../../../../app/utilities/format";

const Accounts = ({ statistics }) => {
  return (
    <>
      <div className="chart_box">
        <div className="details">
          <span className="type">Accounts</span>
          <span className="value">
            {statistics ? (
              <>{numberFormat(statistics.total_accounts)}</>
            ) : (
              <Skeleton />
            )}
          </span>
          <span className="val_change">
            {statistics ? (
              <>
                <>
                  {statistics.total_accounts_change > 0 ? (
                    <>
                      <img src="common/images/up_arr.svg" alt="up_arr" />+
                      {statistics.total_accounts_change.toLocaleString()} (24
                      hours)
                    </>
                  ) : null}
                </>
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

export default Accounts;
