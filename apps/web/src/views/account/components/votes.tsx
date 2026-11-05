import { Link } from "react-router";
import config from "../../../app/config";
import { calculateVotingPower } from "../../../app/utilities/account";
import { tokenFormat } from "../../../app/utilities/format";

const Votes = ({ account }) => {
  if (!account) return;

  const votingPower = calculateVotingPower({ account });

  return (
    <div style={{ margin: "0 0 20px" }}>
      {account ? (
        <>
          {account.voter_info &&
          (account.voter_info.proxy !== "" ||
            account.voter_info.producers.length) ? (
            <>
              <p style={{ paddingBottom: "10px" }}>
                <strong>Account Vote Strength:</strong>{" "}
                {(
                  (votingPower.voting_power_decay / votingPower.voting_power) *
                    100 || 0
                ).toFixed(2)}
                % ({tokenFormat(votingPower.voting_power_decay)} /{" "}
                {tokenFormat(votingPower.voting_power)} {config.token_symbol})
              </p>

              {account.voter_info && account.voter_info.is_proxy === 1 ? (
                <p style={{ paddingBottom: "10px" }}>
                  This account is a proxy with a vote weight of{" "}
                  {tokenFormat(votingPower.voting_power_proxied)}{" "}
                  {config.token_symbol}
                </p>
              ) : null}

              {account.voter_info && account.voter_info.proxy !== "" ? (
                <p style={{ paddingBottom: "10px" }}>
                  This account is proxying all votes to{" "}
                  <Link
                    to={`/account/${account.voter_info.proxy}`}
                    style={{ color: "#7D70F6" }}
                  >
                    {account.voter_info.proxy}
                  </Link>
                  .
                </p>
              ) : null}

              {account.voter_info && account.voter_info.producers.length ? (
                <p style={{ paddingBottom: "10px" }}>
                  Voting for {account.voter_info.producers.length} Producers:
                  <br />
                  {account.voter_info.producers.map((producer) => (
                    <span
                      key={producer}
                      style={{ display: "inline-block", width: "150px" }}
                    >
                      <Link
                        to={`/account/${producer}`}
                        style={{ color: "#7D70F6" }}
                      >
                        {producer}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p style={{ paddingBottom: "10px" }}>
                This account has not voted for validators.{" "}
                <Link to={`/wallet/vote`} className="more_btn">
                  Vote now!
                </Link>
              </p>
            </>
          )}
        </>
      ) : null}
    </div>
  );
};

export default Votes;
