import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import BlockchainApiManager from "../../../../app/services/blockchainApiManager";

const Multisigs = () => {
  const navigate = useNavigate();
  const [, setLoader] = useState(0);

  const { error, data: msigProposals } = useQuery({
    queryKey: [`msigProposals`],

    queryFn: () =>
      BlockchainApiManager.getTableByScope({
        code: "eosio.msig",
        table: "proposal",
        limit: -1,
        lower_bound: "",
      }),
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

  const onMsigProposalClick = async (msigProposal) => {
    msigProposal.proposals_loading = true;
    setLoader(true);
    const approvals2Response = await BlockchainApiManager.getTableRows({
      code: "eosio.msig",
      scope: msigProposal.scope,
      table: "approvals2",
      limit: -1,
    });
    msigProposal.proposals_loading = false;
    setLoader(false);

    if (approvals2Response && approvals2Response.rows) {
      if (msigProposal.count === 1) {
        navigate(
          `/msig/${msigProposal.scope}/${approvals2Response.rows[0].proposal_name}`,
        );
      } else {
        msigProposal.proposals = approvals2Response.rows;
      }
    }
  };

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Proposer</th>
            <th># of Proposals</th>
            <th>Proposal</th>
          </tr>
        </thead>
        <tbody>
          {!msigProposals &&
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
          {msigProposals &&
            msigProposals.rows.map((msigProposal, index) => (
              <tr key={index}>
                <td>
                  <Link to={`/account/${msigProposal.scope}`}>
                    {msigProposal.scope}
                  </Link>
                </td>
                <td> {msigProposal.count} </td>
                <td>
                  {!msigProposal.proposals &&
                  !msigProposal.proposals_loading ? (
                    <span
                      className="type"
                      onClick={() => onMsigProposalClick(msigProposal)}
                      style={{ cursor: "pointer" }}
                    >
                      {msigProposal.count > 1
                        ? "Show Proposals"
                        : "Open Proposal"}
                    </span>
                  ) : null}

                  {msigProposal.proposals_loading ? (
                    <span className="type">Loading proposals...</span>
                  ) : null}

                  {msigProposal.proposals &&
                    msigProposal.proposals.map((proposal, index) => (
                      <Link
                        to={`/msig/${msigProposal.scope}/${proposal.proposal_name}`}
                        key={index}
                        style={{ display: "block" }}
                      >
                        {proposal.proposal_name}
                      </Link>
                    ))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
};

export default Multisigs;
