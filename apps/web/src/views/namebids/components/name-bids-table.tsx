import { useMemo, useState } from "react";
import { Link } from "react-router";
import config from "../../../app/config";
import Pagination from "../../../app/components/ui/Pagination";
import { tokenFormat } from "../../../app/utilities/format";
import Skeleton from "react-loading-skeleton";
import { momentformat } from "../../../app/utilities/date";

const PAGE_SIZE = 100;

type NameBid = {
  newname: string;
  high_bidder: string;
  high_bid: number;
  last_bid_time: string;
};

type NameBidsTableProps = {
  bids: NameBid[] | null;
  wrapped?: boolean;
  paginated?: boolean;
  amountAbs?: boolean;
};

const NameBidsTableBody = ({
  bids,
  wrapped = false,
  paginated = false,
  amountAbs = false,
}: NameBidsTableProps) => {
  const [page, setPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const pageCount = bids ? Math.ceil(bids.length / PAGE_SIZE) : 0;

  const visibleBids = useMemo(() => {
    if (!bids) return null;
    if (paginated) {
      const start = page * PAGE_SIZE;
      return bids.slice(start, start + PAGE_SIZE);
    }
    return bids.slice(0, visibleCount);
  }, [bids, page, paginated, visibleCount]);

  const table = (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Bidder</th>
          <th>Amount ({config.token_symbol})</th>
          <th>Bid Time</th>
        </tr>
      </thead>
      <tbody>
        {!bids &&
          Array(5)
            .fill(0)
            .map((_, index) => (
              <tr key={index}>
                <td>
                  <Skeleton />
                </td>
                <td>
                  <Skeleton />
                </td>
                <td>
                  <Skeleton />
                </td>
                <td>
                  <Skeleton />
                </td>
              </tr>
            ))}
        {visibleBids?.map((bid) => (
          <tr key={`${bid.newname}-${bid.high_bidder}-${bid.last_bid_time}`}>
            <td>{bid.newname}</td>
            <td>
              <Link to={`/account/${bid.high_bidder}`}>{bid.high_bidder}</Link>
            </td>
            <td>
              {tokenFormat(
                (amountAbs ? Math.abs(bid.high_bid) : bid.high_bid) /
                  Math.pow(10, config.token_precision),
              )}
            </td>
            <td>{momentformat(bid.last_bid_time, "MMM DD YYYY, HH:mm:ss")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const footer = paginated ? (
    <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
  ) : bids && visibleCount < bids.length ? (
    <div style={{ textAlign: "center" }}>
      <a
        href="#"
        className="more_btn"
        onClick={(e) => {
          e.preventDefault();
          setVisibleCount((count) => count + PAGE_SIZE);
        }}
      >
        view more
      </a>
    </div>
  ) : null;

  if (wrapped) {
    return (
      <div className="table_row">
        <div className="table_row_inner">
          {table}
          {footer}
        </div>
      </div>
    );
  }

  return (
    <>
      {table}
      {footer}
    </>
  );
};

const NameBidsTable = (props: NameBidsTableProps) => {
  const bidsKey = props.bids
    ? `${props.bids.length}:${props.bids[0]?.newname}:${props.bids[props.bids.length - 1]?.newname}`
    : "loading";

  return <NameBidsTableBody key={bidsKey} {...props} />;
};

export default NameBidsTable;
