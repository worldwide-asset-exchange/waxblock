import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import BlockchainApiManager from "../../../../../app/services/blockchainApiManager";
import { tokenFormat } from "../../../../../app/utilities/format";

const TopHolders = () => {
  const { error, data: topHolders } = useQuery({
    queryKey: [`topHolders`],
    queryFn: () => BlockchainApiManager.getTopHolders(),
  });

  if (error) {
    return (
      <>
        <p>Error fetching</p>
      </>
    );
  }

  // if (isLoading) {
  //   return (
  //     <>
  //       <p>Loading...</p>
  //     </>
  //   );
  // }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Account</th>
            <th>Total WAX</th>
          </tr>
        </thead>
        <tbody>
          {!topHolders &&
            Array(5)
              .fill(0)
              .map((item, index) => (
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
                </tr>
              ))}
          {topHolders &&
            topHolders.map((topHolder, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <Link to={`/account/${topHolder[0]}`}>{topHolder[0]}</Link>
                </td>
                <td> {tokenFormat(topHolder[1], 0)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
};

export default TopHolders;
