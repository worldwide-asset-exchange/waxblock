import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import Icon from "../../../app/components/ui/Icon";
import config from "../../../app/config";
import { getMediaUrl } from "../../../app/utilities/media";
import { WalletContext } from "../../../app/contexts/wallet-context";
import ApiManager from "../../../app/services/apiManager";
import LocalnetManager from "../../../app/services/localnetManager";
import { randomNoImageByName } from "../../../app/utilities/random";
//import producersData from "../../../dummy-data/producers.json";

const Producers = () => {
  const wallet = useContext(WalletContext);
  const { session, setTransactionAlert } = wallet;
  //const [producers, setProducers] = useState(producersData);
  const accountName = wallet.walletAccount?.account?.account_name;
  const defaultVoteProducers =
    wallet.walletAccount?.account?.voter_info?.producers || [];
  const [editedVoteProducers, setEditedVoteProducers] = useState(null);
  const [lastAccount, setLastAccount] = useState(accountName);

  if (accountName !== lastAccount) {
    setLastAccount(accountName);
    setEditedVoteProducers(null);
  }

  const voteProducers = editedVoteProducers ?? defaultVoteProducers;

  const {
    //  isLoading,
    // error,
    data: producers,
    refetch,
  } = useQuery({
    queryKey: [`producers`],

    queryFn: () =>
      config.network_type === "localnet"
        ? LocalnetManager.getProducers()
        : ApiManager.getProducers(),

    enabled: false,
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [refetch]);

  useEffect(() => {
    if (voteProducers.length > 30) {
      setTransactionAlert({
        type: "warning",
        message: "Please select a maximum of 30 producers to vote",
      });
    } else {
      setTransactionAlert(null);
    }
  }, [setTransactionAlert, voteProducers]);

  const addVoteProducer = (producer_owner) => {
    setEditedVoteProducers([...voteProducers, producer_owner]);
  };

  const removeVoteProducer = (producer_owner) => {
    setEditedVoteProducers(
      voteProducers.filter((voteProducer) => producer_owner !== voteProducer),
    );
  };

  const handleClick = () => {
    const voteProducersSorted = voteProducers.sort();
    console.log(voteProducersSorted);

    const walletTransaction = {};
    walletTransaction.type = "voteproducer";

    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "voteproducer",
      data: {
        voter: session ? session.actor.toString() : "",
        proxy: "",
        producers: voteProducersSorted,
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>Vote Producers | Wallet - WAX Explorer</title>
      </Helmet>

      <div id="producers" className="forms_type active">
        <h3>
          Selected Producers ({voteProducers.length}/30)
          <input
            type="button"
            className="side_btn"
            value="VOTE"
            onClick={() => handleClick()}
          />
          <span className="select-ct">({voteProducers.length} Selected)</span>
        </h3>
        {/* {walletAccount && walletAccount.account ? (
            <>
              <p>
                <strong>Vote Strength:</strong>{" "}
                {(
                  (votingPower.voting_power_decay / votingPower.voting_power) *
                  100
                ).toFixed(2)}
                % ({tokenFormat(votingPower.voting_power_decay)} /{" "}
                {tokenFormat(votingPower.voting_power)} WAX)
              </p>
            </>
          ) : null}

          <br /> */}
        <div className="votes">
          {voteProducers.map((voteProducer, index) => {
            return (
              <span className="vote_name" data-vote="vote1" key={index}>
                {voteProducer}
                <span
                  className="close_vote"
                  onClick={() => removeVoteProducer(voteProducer)}
                >
                  <Icon name="x" />
                </span>
              </span>
            );
          })}
        </div>

        <div className="producers_inner">
          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th>Rank</th>
                <th>Account</th>
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
              {producers &&
                producers.producers.map((producer, index) => (
                  <tr key={index}>
                    <td>
                      <span
                        className={`checkbox ${
                          voteProducers.includes(producer.owner) ? "active" : ""
                        }`}
                        onClick={() => {
                          if (voteProducers.includes(producer.owner)) {
                            removeVoteProducer(producer.owner);
                          } else {
                            addVoteProducer(producer.owner);
                          }
                        }}
                      ></span>
                    </td>
                    <td>{producer.rank}</td>
                    <td>
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
                    </td>
                    <td>{producer.weighted_votes.toLocaleString()}</td>
                    <td>{producer.country_name || producer.location_name}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Producers;
