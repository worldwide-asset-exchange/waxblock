import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import BlockchainApiManager from "../services/blockchainApiManager";
import { unixSeconds } from "../utilities/date";

export const nameBidsQueryKey = ["nameBids"] as const;

export function useNameBids() {
  const query = useQuery({
    queryKey: nameBidsQueryKey,
    queryFn: () => BlockchainApiManager.getNameBids(),
  });

  const currentBids = useMemo(() => {
    if (!query.data) return null;
    return query.data.rows
      .filter((row) => row.high_bid >= 0)
      .sort((rowA, rowB) => rowB.high_bid - rowA.high_bid);
  }, [query.data]);

  const claimBids = useMemo(() => {
    if (!query.data) return null;
    return query.data.rows
      .filter((row) => row.high_bid < 0)
      .sort(
        (rowA, rowB) =>
          unixSeconds(rowB.last_bid_time) - unixSeconds(rowA.last_bid_time),
      );
  }, [query.data]);

  return { ...query, currentBids, claimBids };
}
