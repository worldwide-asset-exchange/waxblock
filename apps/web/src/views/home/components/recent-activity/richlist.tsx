import { useState } from "react";
import TopHolders from "./richlist/topholders";
import TopStake from "./richlist/topstake";
import TopRam from "./richlist/topram";

const Richlist = () => {
  const [activeTab, setActiveTab] = useState("topStake");

  return (
    <>
      <ul className="tabbbing">
        <li className={`${activeTab === "topStake" ? "active" : ""}`}>
          <a
            href="#topStake"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("topStake");
            }}
          >
            Top Stake
          </a>
        </li>
        <li className={`${activeTab === "topHolders" ? "active" : ""}`}>
          <a
            href="#topHolders"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("topHolders");
            }}
          >
            Top Holders
          </a>
        </li>
        <li className={`${activeTab === "topRam" ? "active" : ""}`}>
          <a
            href="#topRam"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("topRam");
            }}
          >
            Top RAM
          </a>
        </li>
      </ul>
      <div
        className={`tab ${activeTab === "topStake" ? "active" : null}`}
        id="topStake"
      >
        {activeTab === "topStake" ? <TopStake /> : null}
      </div>
      <div
        className={`tab ${activeTab === "topHolders" ? "active" : null}`}
        id="topHolders"
      >
        {activeTab === "topHolders" ? <TopHolders /> : null}
      </div>
      <div
        className={`tab ${activeTab === "topRam" ? "active" : null}`}
        id="topRam"
      >
        {activeTab === "topRam" ? <TopRam /> : null}
      </div>
    </>
  );
};

export default Richlist;
