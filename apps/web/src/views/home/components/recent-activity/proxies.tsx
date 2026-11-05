import React, { useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getMediaUrl } from "../../../../app/utilities/media";
import ApiManager from "../../../../app/services/apiManager";
import { randomNoImageByName } from "../../../../app/utilities/random";

const Proxies = React.memo(function Proxies() {
  const {
    //  isLoading,
    // error,
    data: proxies,
    refetch,
  } = useQuery({
    queryKey: [`proxies`],
    queryFn: () => ApiManager.getProxies(),
    enabled: false,
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [refetch]);

  const itemsPerPage = 100;
  const [page, setPage] = useState(1);

  const pageCount = useMemo(
    () => (proxies ? Math.ceil(proxies.length / itemsPerPage) : 0),
    [proxies, itemsPerPage],
  );

  const currentItems = useMemo(
    () => (proxies ? proxies.slice(0, page * itemsPerPage) : []),
    [proxies, page, itemsPerPage],
  );

  const handlePageClick = (nextPage) => {
    setPage(nextPage);
  };

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Account</th>
            <th>Total WAX</th>
            <th>Proxied Accounts</th>
            <th>Voting For</th>
          </tr>
        </thead>
        <tbody>
          {!proxies &&
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
          {currentItems.map((proxy, index) => (
            <tr key={index}>
              <td>{proxy.rank}</td>
              <td>
                <div style={{ display: "inline-flex" }}>
                  <img
                    src={
                      getMediaUrl(proxy.logo_256) ||
                      `/${randomNoImageByName(proxy.account)}`
                    }
                    alt=""
                    // width={30}
                    // height={30}
                    style={{ width: "30px" }}
                  />
                  <Link
                    to={`/account/${proxy.account}`}
                    style={{ position: "relative", left: "10px" }}
                  >
                    {proxy.account}
                  </Link>
                </div>
              </td>
              <td>{proxy.proxied_eos.toLocaleString()}</td>
              <td>{proxy.vote_count.toLocaleString()}</td>
              <td>{proxy.producer_count.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {page + 1 <= pageCount ? (
        <div style={{ textAlign: "center" }}>
          <a
            href="#"
            className="more_btn"
            onClick={(e) => {
              e.preventDefault();
              handlePageClick(page + 1);
            }}
          >
            view more
          </a>
        </div>
      ) : null}
    </>
  );
});

export default Proxies;
