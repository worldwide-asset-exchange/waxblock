import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import Skeleton from "react-loading-skeleton";
import ApiManager from "../../../../app/services/apiManager";
import config from "../../../../app/config";
import { getMediaUrl } from "../../../../app/utilities/media";
import { randomNoImageByName } from "../../../../app/utilities/random";
import LocalnetManager from "../../../../app/services/localnetManager";

const Producers = ({ chainInfo }) => {
  const {
    //  isLoading,
    // error,
    data: producers,
  } = useQuery({
    queryKey: [`producers`],

    queryFn: () =>
      config.network_type === "localnet"
        ? LocalnetManager.getProducers()
        : ApiManager.getProducers(),
  });

  useEffect(() => {}, []);

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Guilds</th>
            <th>Status</th>
            <th>Weighted Votes</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {!producers &&
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
          {producers?.producers?.length > 0 &&
            producers.producers.map((producer, index) => (
              <tr key={index}>
                <td>{producer.rank}</td>
                <td>
                  <div style={{ display: "inline-flex" }}>
                    <img
                      src={
                        getMediaUrl(producer.logo) ||
                        `/${randomNoImageByName(producer.owner)}`
                      }
                      alt=""
                      // width={30}
                      // height={30}
                      style={{ width: "30px" }}
                    />
                    <Link
                      to={`/account/${producer.owner}`}
                      style={{ position: "relative", left: "10px" }}
                    >
                      {producer.owner}
                    </Link>
                  </div>
                </td>
                <td>
                  {chainInfo &&
                  producer.owner === chainInfo.head_block_producer ? (
                    <span className="type">Producing</span>
                  ) : (
                    <>
                      {producer.rank <=
                      Number(
                        producers?.metadata?.active_producer_count || 21,
                      ) ? (
                        <span className="type">
                          Top{" "}
                          {Number(
                            producers?.metadata?.active_producer_count || 21,
                          )}
                        </span>
                      ) : (
                        <span className="type">Standby</span>
                      )}
                    </>
                  )}
                </td>
                <td>{producer.weighted_votes.toLocaleString()}</td>
                <td>{producer.country_name || producer.location_name}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
};

export default Producers;
