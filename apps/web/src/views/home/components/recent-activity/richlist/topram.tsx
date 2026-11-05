import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import BlockchainApiManager from "../../../../../app/services/blockchainApiManager";
import { bytesFormat } from "../../../../../app/utilities/format";

const TopRam = () => {
  const { error, data: topRamHolders } = useQuery({
    queryKey: [`topRamHolders`],
    queryFn: () => BlockchainApiManager.getTopRamHolders(),
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
            <th>Total RAM</th>
          </tr>
        </thead>
        <tbody>
          {!topRamHolders &&
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
          {topRamHolders &&
            topRamHolders.map((topRamHolder, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <Link to={`/account/${topRamHolder[0]}`}>
                    {topRamHolder[0]}
                  </Link>
                </td>
                <td> {bytesFormat(topRamHolder[1], 2)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
};

export default TopRam;
