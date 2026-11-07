import { addHours, addMonths, isAfter, isBefore } from "date-fns";
import { useContext, useEffect, useMemo } from "react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import config from "../../../app/config";
import { WalletContext } from "../../../app/contexts/wallet-context";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";
import Countdown from "react-countdown";
import { dateToISO, momentformat } from "../../../app/utilities/date";
import { tokenFormat } from "../../../app/utilities/format";
import { useQuery } from "@tanstack/react-query";
import { APIClient } from "@wharfkit/antelope";
import {
  calculateVoterFunding,
  fetchWaxInflationPolicy,
} from "../../../app/services/waxInflation";

function stringToBigInt(value) {
  return BigInt(value.toString().split(".")[0]);
}

function dateToBigInt(value) {
  const date = new Date(dateToISO(value) || value).getTime();
  return BigInt(date * 1000);
}

function fixVoterInfo(voter_info) {
  voter_info.unpaid_voteshare = stringToBigInt(voter_info.unpaid_voteshare);
  if (typeof voter_info.unpaid_voteshare_last_updated !== "bigint") {
    voter_info.unpaid_voteshare_last_updated = dateToBigInt(
      voter_info.unpaid_voteshare_last_updated,
    );
  }
  voter_info.unpaid_voteshare_change_rate = stringToBigInt(
    voter_info.unpaid_voteshare_change_rate,
  );
  return voter_info;
}

function fixGState(_gstate) {
  _gstate.total_unpaid_voteshare = stringToBigInt(
    _gstate.total_unpaid_voteshare,
  );
  _gstate.total_voteshare_change_rate = stringToBigInt(
    _gstate.total_voteshare_change_rate,
  );
  _gstate.voters_bucket = stringToBigInt(_gstate.voters_bucket);
  _gstate.total_unpaid_voteshare_last_updated = dateToBigInt(
    _gstate.total_unpaid_voteshare_last_updated,
  );
  _gstate.last_pervote_bucket_fill = dateToBigInt(
    _gstate.last_pervote_bucket_fill,
  );
  return _gstate;
}

//const user = {actor:'tc1b2.wam',permission:'active'};
const GbmRewards = () => {
  const wallet = useContext(WalletContext);
  const { session, walletAccount } = wallet;

  const [global, setGlobal] = useState(null);
  const [currencyStats, setCurrencyStats] = useState(null);
  const [genesis, setGenesis] = useState(null);
  const [voters, setVoters] = useState(null);
  const [nextGenesisRewards, setNextGenesisRewards] = useState(0);
  const { data: inflationPolicy, isError: policyError } = useQuery({
    queryKey: ["waxInflationPolicy", config.chain_id, config.endpoints.default],
    queryFn: () =>
      fetchWaxInflationPolicy(new APIClient({ url: config.endpoints.default })),
    enabled: Boolean(session),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
  const toDate = (value) => new Date(dateToISO(value) || value);
  /* global BigInt */

  useEffect(() => {
    BlockchainApiManager.getTableRows({
      code: "eosio",
      scope: "eosio",
      table: "global",
      lower_bound: "",
      upper_bound: "",
      limit: 1,
    }).then((response) => {
      setGlobal(response);
    });

    BlockchainApiManager.getCurrencyStats({
      code: "eosio.token",
      symbol: "WAX",
    }).then((response) => {
      setCurrencyStats(response);
    });

    if (session) {
      const actor = session.actor.toString();
      BlockchainApiManager.getTableRows({
        code: "eosio",
        scope: actor,
        table: "genesis",
        lower_bound: "",
        upper_bound: "",
        limit: 1,
      }).then((response) => {
        setGenesis(response);
      });

      BlockchainApiManager.getTableRows({
        code: "eosio",
        scope: "eosio",
        table: "voters",
        lower_bound: actor,
        upper_bound: actor,
        limit: 1,
      }).then((response) => {
        setVoters(response);
      });
    }
  }, [session]);

  const calculateNextGenesisRewards = () => {
    const rewardsPerDay = parseFloat(genesis.rows[0].balance) / 1096;
    const currentDate = new Date();
    const lastClaimDate = toDate(genesis.rows[0].last_claim_time);
    const nextGenesisRewards =
      (rewardsPerDay / 86400) *
      Math.max(0, (currentDate.getTime() - lastClaimDate.getTime()) / 1000);
    setNextGenesisRewards(nextGenesisRewards);
  };

  const nextVotersRewards = useMemo(() => {
    if (!inflationPolicy || policyError) return null;
    let voter_info =
      walletAccount && walletAccount.account
        ? { ...walletAccount.account.voter_info }
        : null;
    let _gstate = global ? { ...global.rows[0] } : null;
    const token_supply = currencyStats
      ? parseFloat(currencyStats.WAX.supply)
      : null;

    if (!voter_info || !_gstate || !token_supply) return 0;

    const ct = BigInt(new Date().getTime() * 1000);
    _gstate = fixGState(_gstate);
    voter_info = fixVoterInfo(voter_info);
    const oneE6 = BigInt(Math.pow(10, 6));
    const WAX_DECIMAL_PLACES = Math.pow(10, 8);
    const multiplierSmallInt = Math.pow(10, 12);
    const multiplier = BigInt(multiplierSmallInt);
    const usecs_since_last_fill = ct - _gstate.last_pervote_bucket_fill;
    const to_voters = calculateVoterFunding(
      token_supply * WAX_DECIMAL_PLACES,
      Number(usecs_since_last_fill) / 1_000_000,
      inflationPolicy,
    );
    _gstate.voters_bucket += to_voters;
    _gstate.total_unpaid_voteshare +=
      (_gstate.total_voteshare_change_rate *
        (ct - _gstate.total_unpaid_voteshare_last_updated)) /
      oneE6;
    const unpaid_voteshare =
      voter_info.unpaid_voteshare +
      (voter_info.unpaid_voteshare_change_rate *
        (ct - voter_info.unpaid_voteshare_last_updated)) /
        oneE6;
    let reward = 0;
    try {
      reward =
        (_gstate.voters_bucket *
          ((multiplier * unpaid_voteshare) / _gstate.total_unpaid_voteshare)) /
        multiplier;
    } catch (e) {
      console.error("calculateRewards: " + e.toString());
    }
    if (reward > _gstate.voters_bucket) {
      reward = _gstate.voters_bucket;
    }

    reward = parseFloat(reward) / WAX_DECIMAL_PLACES;

    return reward;
  }, [walletAccount, global, currencyStats, inflationPolicy, policyError]);

  const nextGenesisClaimDate = addMonths(new Date(), 1).getTime();

  const nextVotersClaimDate = useMemo(() => {
    if (voters?.rows[0]?.last_claim_time) {
      const votersClaimDate = addHours(
        toDate(voters.rows[0].last_claim_time),
        24,
      );
      if (isAfter(votersClaimDate, new Date())) {
        return votersClaimDate.getTime();
      }
    }
    return null;
  }, [voters]);

  const claim = (type) => {
    const walletTransaction = {};
    walletTransaction.type = "claim";
    walletTransaction.account = {
      account: null,
      permission: "active",
    };
    walletTransaction.actions = [];

    const actor = session ? session.actor.toString() : "";
    if (type === "genesis" || type === "both") {
      walletTransaction.actions.push({
        account: "eosio",
        name: "claimgenesis",
        data: {
          claimer: actor,
        },
      });
    }

    if (type === "voter" || type === "both") {
      walletTransaction.actions.push({
        account: "eosio",
        name: "claimgbmvote",
        data: {
          owner: actor,
        },
      });
    }

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>GbmRewards | Wallet - WAX Explorer</title>
      </Helmet>

      <div className="form_box active">
        <form className="forms_type active">
          <h2>Genesis and voting rewards</h2>
          {!session ? (
            <p>
              Please login to claim genesis (GBM) and voting rewards. Genesis
              rewards will be liquid and voting rewards will be staked
              automatically.
            </p>
          ) : (
            <>
              {genesis &&
                genesis.rows.length > 0 &&
                isBefore(
                  toDate(genesis.rows[0].last_claim_time),
                  new Date(1656633600 * 1000),
                ) && (
                  <>
                    <p>
                      <strong>Last Genesis Claim:</strong>&nbsp;
                      {momentformat(
                        genesis.rows[0].last_claim_time,
                        "MMM DD YYYY, HH:mm:ss",
                      )}
                    </p>
                    <p>
                      <strong>Next Genesis Claim:</strong>&nbsp;
                      {nextGenesisClaimDate ? (
                        <Countdown
                          date={nextGenesisClaimDate}
                          renderer={({
                            hours,
                            minutes,
                            seconds,
                            completed,
                          }) => {
                            if (completed) {
                              // Render a completed state
                              return "Now";
                            } else {
                              calculateNextGenesisRewards();

                              // Render a countdown
                              return (
                                <span>
                                  {hours} Hours {minutes} Minutes {seconds}{" "}
                                  Seconds
                                </span>
                              );
                            }
                          }}
                        />
                      ) : (
                        "Now"
                      )}
                    </p>
                    <p>
                      <strong>Next Genesis Rewards:</strong>&nbsp;
                      {tokenFormat(
                        nextGenesisRewards > 0 ? nextGenesisRewards : 0,
                        config.token_precision,
                      )}{" "}
                      WAX
                    </p>

                    <br />
                  </>
                )}
              {voters && voters.rows.length ? (
                <>
                  <p>
                    <strong>Last Voter Claim:</strong>&nbsp;
                    {momentformat(
                      voters &&
                        voters.rows[0] &&
                        voters.rows[0].last_claim_time,
                      "MMM DD YYYY, HH:mm:ss",
                    )}
                  </p>
                  <p>
                    <strong>Next Voter Claim:</strong>&nbsp;
                    {nextVotersClaimDate ? (
                      <Countdown
                        date={nextVotersClaimDate}
                        renderer={({ hours, minutes, seconds, completed }) => {
                          if (completed) {
                            // Render a completed state
                            return "Now";
                          } else {
                            // Render a countdown
                            return (
                              <span>
                                {hours} Hours {minutes} Minutes {seconds}{" "}
                                Seconds
                              </span>
                            );
                          }
                        }}
                      />
                    ) : (
                      "Now"
                    )}
                  </p>
                  <p>
                    <strong>Next Voter Rewards:</strong>&nbsp;{" "}
                    {nextVotersRewards === null
                      ? "Unavailable"
                      : `${tokenFormat(Math.max(0, nextVotersRewards))} WAX`}
                  </p>
                </>
              ) : (
                <p>Not voting for BPs or a proxy.</p>
              )}

              <br />
              <div className="field_row1">
                {genesis &&
                genesis.rows.length > 0 &&
                isBefore(
                  toDate(genesis.rows[0].last_claim_time),
                  new Date(1656633600 * 1000),
                ) ? (
                  <>
                    <input
                      type="button"
                      value="Claim Genesis"
                      style={{
                        background: !nextGenesisClaimDate
                          ? "#7D70F6"
                          : "#404047",
                      }}
                      onClick={() => {
                        if (nextGenesisClaimDate) return;
                        claim("genesis");
                      }}
                    />
                    &nbsp;
                  </>
                ) : null}
                {voters && voters.rows.length ? (
                  <>
                    <input
                      type="button"
                      value="Claim Vote"
                      style={{
                        background: !nextVotersClaimDate
                          ? "#7D70F6"
                          : "#404047",
                      }}
                      onClick={() => {
                        if (nextVotersClaimDate) return;
                        claim("voter");
                      }}
                    />
                    &nbsp;
                  </>
                ) : null}
                {genesis &&
                genesis.rows.length > 0 &&
                isBefore(
                  toDate(genesis.rows[0].last_claim_time),
                  new Date(1656633600 * 1000),
                ) &&
                voters &&
                voters.rows.length ? (
                  <>
                    <input
                      type="button"
                      value="Claim Both"
                      style={{
                        background:
                          !nextGenesisClaimDate && !nextVotersClaimDate
                            ? "#7D70F6"
                            : "#404047",
                      }}
                      onClick={() => {
                        if (nextGenesisClaimDate && nextVotersClaimDate) return;
                        claim("both");
                      }}
                    />
                  </>
                ) : null}
              </div>
            </>
          )}
        </form>
      </div>
    </>
  );
};

export default GbmRewards;
