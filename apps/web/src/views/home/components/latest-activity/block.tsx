import { Link } from "react-router";
import Skeleton from "react-loading-skeleton";
import { numberFormat } from "../../../../app/utilities/format";

const Block = ({ chainInfo }) => {
  return (
    <>
      <div className="chart_box">
        <div className="details">
          <span className="type">Latest Block</span>
          <span className="value">
            {chainInfo ? (
              <Link to={`/block/${chainInfo.head_block_num}`}>
                {numberFormat(chainInfo.head_block_num)}
              </Link>
            ) : (
              <Skeleton />
            )}
          </span>
          <span className="val_change">
            {chainInfo ? (
              <>
                <Link to={`/block/${chainInfo.last_irreversible_block_num}`}>
                  {numberFormat(chainInfo.last_irreversible_block_num)}
                </Link>
                &nbsp; (
                {chainInfo.last_irreversible_block_num -
                  chainInfo.head_block_num}
                )
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

export default Block;
