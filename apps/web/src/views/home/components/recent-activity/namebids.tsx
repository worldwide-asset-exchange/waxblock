import { useState } from "react";
import { Link } from "react-router";
import { useNameBids } from "../../../../app/hooks/useNameBids";
import ClaimBids from "../../../namebids/components/claimbids";
import CurrentBids from "../../../namebids/components/currentbids";

const Namebids = () => {
  const [activeTab, setActiveTab] = useState("currentBids");
  const { error, currentBids, claimBids } = useNameBids();

  if (error) {
    return (
      <>
        <p>Error fetching</p>
      </>
    );
  }

  return (
    <>
      <ul className="tabbbing">
        <li className={`${activeTab === "currentBids" ? "active" : ""}`}>
          <a
            href="#currentBids"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("currentBids");
            }}
          >
            Current Bids
          </a>
        </li>
        <li className={`${activeTab === "claimBids" ? "active" : ""}`}>
          <a
            href="#claimBids"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("claimBids");
            }}
          >
            Bids to claim
          </a>
        </li>
      </ul>
      <div
        className={`tab ${activeTab === "currentBids" ? "active" : null}`}
        id="currentBids"
      >
        {activeTab === "currentBids" ? (
          <>
            <p>
              Please use the{" "}
              <Link
                to={`/wallet/bidnames`}
                style={{ textDecoration: "underline" }}
              >
                Name Bids wallet feature
              </Link>{" "}
              to bid on a new name
            </p>
            <br />
            <br />
            <CurrentBids currentBids={currentBids} />
          </>
        ) : null}
      </div>
      <div
        className={`tab ${activeTab === "claimBids" ? "active" : null}`}
        id="claimBids"
      >
        {activeTab === "claimBids" ? <ClaimBids claimBids={claimBids} /> : null}
      </div>
    </>
  );
};

export default Namebids;
