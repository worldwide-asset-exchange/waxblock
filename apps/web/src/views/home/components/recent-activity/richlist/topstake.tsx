import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import config from "../../../../../app/config";
import BlockchainApiManager from "../../../../../app/services/blockchainApiManager";
import { tokenFormat } from "../../../../../app/utilities/format";

const TopStake = () => {
  const { error, data: topStakeHolders } = useQuery({
    queryKey: [`topStakeHolders`],
    queryFn: () => BlockchainApiManager.getTopStakeHolders(),
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
            <th>CPU WAX</th>
            <th>NET WAX</th>
            <th>Total WAX</th>
          </tr>
        </thead>
        <tbody>
          {!topStakeHolders &&
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
                  <td>
                    <Skeleton />
                  </td>
                  <td>
                    <Skeleton />
                  </td>
                </tr>
              ))}
          {topStakeHolders &&
            topStakeHolders
              .filter(
                (topStakeHolder) =>
                  !["eosio.reserv"].includes(topStakeHolder[0]),
              )
              .map((topStakeHolder, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <Link to={`/account/${topStakeHolder[0]}`}>
                      {topStakeHolder[0]}
                    </Link>
                  </td>
                  <td>
                    {tokenFormat(
                      topStakeHolder[1] / Math.pow(10, config.token_precision),
                      0,
                    )}
                  </td>
                  <td>
                    {tokenFormat(
                      topStakeHolder[2] / Math.pow(10, config.token_precision),
                      0,
                    )}
                  </td>
                  <td>
                    {tokenFormat(
                      topStakeHolder[1] / Math.pow(10, config.token_precision) +
                        topStakeHolder[2] /
                          Math.pow(10, config.token_precision),
                      0,
                    )}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </>
  );
};

export default TopStake;
