import { Link } from "react-router";
import Skeleton from "react-loading-skeleton";

const BlockProducer = ({ chainInfo }) => {
  return (
    <>
      <div className="chart_box">
        <div className="details">
          <span className="type">Block Producer</span>
          <span className="value" style={{ textTransform: "uppercase" }}>
            {chainInfo ? (
              <>
                <Link to={`/account/${chainInfo.head_block_producer}`}>
                  {chainInfo.head_block_producer}
                </Link>
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

export default BlockProducer;
