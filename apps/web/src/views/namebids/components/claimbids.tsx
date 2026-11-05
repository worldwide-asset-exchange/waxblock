import NameBidsTable from "./name-bids-table";

const ClaimBids = ({
  claimBids,
  paginated = false,
}: {
  claimBids: Parameters<typeof NameBidsTable>[0]["bids"];
  paginated?: boolean;
}) => (
  <NameBidsTable bids={claimBids} paginated={paginated} amountAbs />
);

export default ClaimBids;
