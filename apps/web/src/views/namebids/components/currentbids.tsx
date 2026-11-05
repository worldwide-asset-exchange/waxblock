import NameBidsTable from "./name-bids-table";

const CurrentBids = ({
  currentBids,
  wrapped = false,
}: {
  currentBids: Parameters<typeof NameBidsTable>[0]["bids"];
  wrapped?: boolean;
}) => (
  <NameBidsTable
    bids={currentBids}
    wrapped={wrapped}
    paginated={wrapped}
  />
);

export default CurrentBids;
