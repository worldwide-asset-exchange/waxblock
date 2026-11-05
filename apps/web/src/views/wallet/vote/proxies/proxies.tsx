import { useContext, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getMediaUrl } from "../../../../app/utilities/media";
import { WalletContext } from "../../../../app/contexts/wallet-context";
import ApiManager from "../../../../app/services/apiManager";
import { randomNoImageByName } from "../../../../app/utilities/random";
//import proxiesData from "../../../../dummy-data/proxies.json";

const Proxies = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  //const [proxies, setProxies] = useState(proxiesData);
  const savedVoteProxy =
    wallet.walletAccount?.account?.voter_info?.proxy || null;
  const accountActor = session?.actor?.toString() ?? "";
  const [voteProxy, setVoteProxy] = useState(savedVoteProxy);
  const [syncedActor, setSyncedActor] = useState(accountActor);
  if (accountActor !== syncedActor) {
    setSyncedActor(accountActor);
    setVoteProxy(savedVoteProxy);
  }

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

  const handleClick = () => {
    const walletTransaction = {};
    walletTransaction.type = "voteproducer";

    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "voteproducer",
      data: {
        voter: session ? session.actor.toString() : "",
        proxy: voteProxy,
        producers: [],
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  const itemsPerPage = 100;
  const [page, setPage] = useState(1);
  const [itemOffset, setItemOffset] = useState(0);

  const currentItems = useMemo(() => {
    if (!proxies) return [];
    return proxies.slice(0, itemOffset + itemsPerPage);
  }, [proxies, itemOffset, itemsPerPage]);

  const pageCount = proxies ? Math.ceil(proxies.length / itemsPerPage) : 0;

  // Invoke when user click to request another page.
  // const handlePageClick = (event) => {
  //   const newOffset = (event.selected * itemsPerPage) % proxies.length;

  //   setItemOffset(newOffset);
  // };
  const handlePageClick = (page) => {
    setPage(page);
    const newOffset = (page - 1) * itemsPerPage;

    setItemOffset(newOffset);
  };

  return (
    <>
      <Helmet>
        <title>Vote Proxies | Wallet - WAX Explorer</title>
      </Helmet>

      <div id="proxies" className="forms_type active">
        <h3>
          Selected Proxy {voteProxy}
          <input
            type="button"
            className="side_btn"
            value="VOTE"
            onClick={() => handleClick()}
          />
          {/* <span className="select-ct">(1 Selected)</span> */}
        </h3>

        <div className="proxies_inner">
          <table>
            <thead>
              <tr>
                <th>Select</th>
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
                      <td>
                        <Skeleton />
                      </td>
                    </tr>
                  ))}
              {currentItems.map((proxy, index) => (
                <tr key={index}>
                  <td>
                    <span className="radiobtn">
                      <input
                        type="radio"
                        name="voterProxy"
                        id={proxy.account}
                        checked={voteProxy === proxy.account ? true : false}
                        readOnly
                        onClick={() => {
                          setVoteProxy(proxy.account);
                        }}
                      />
                      <label htmlFor={proxy.account}>Proxy</label>
                    </span>
                  </td>
                  <td>{proxy.rank}</td>
                  <td>
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
        </div>
      </div>
    </>
  );
};

export default Proxies;
