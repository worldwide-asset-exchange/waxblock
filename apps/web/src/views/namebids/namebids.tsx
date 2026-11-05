import { useState } from "react";
import Icon from "../../app/components/ui/Icon";
import ClaimBids from "./components/claimbids";
import CurrentBids from "./components/currentbids";
import { tokenInputFormat } from "../../app/utilities/format";
import config from "../../app/config";
import { useContext } from "react";
import { WalletContext } from "../../app/contexts/wallet-context";
import Skeleton from "react-loading-skeleton";
import { useNameBids } from "../../app/hooks/useNameBids";

const Namebids = () => {
  const [activeTab, setActiveTab] = useState("currentBids");
  const { isRefetching, error, currentBids, claimBids, refetch } =
    useNameBids();

  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const bidder = session ? session.actor.toString() : "";
  const [formData, setFormData] = useState({
    newname: "",
    bid: 0,
  });

  const handleClick = async () => {
    const walletTransaction = {};
    walletTransaction.type = "bidname";
    walletTransaction.account = {
      account: null,
      permission: "active",
    };
    walletTransaction.actions = [];

    walletTransaction.actions.push({
      account: "eosio",
      name: "bidname",
      data: {
        bidder: bidder,
        newname: formData.newname,
        bid: `${tokenInputFormat(formData.bid, formData.decimals)} ${
          config.token_symbol
        }`,
      },
    });

    wallet.submitTransaction(walletTransaction);
  };

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
      <div className="cont_sec tab_sec block_detail">
        <h2>
          Name Bids
          {isRefetching ? (
            <Skeleton width={50} style={{ float: "right" }} />
          ) : (
            <a
              data-tip="Refresh Bids"
              href="#"
              className="refresh_bids"
              onClick={(e) => {
                e.preventDefault();
                refetch();
              }}
            >
              <Icon name="refresh" /> Refresh
            </a>
          )}
        </h2>

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
              Need to be Claimed
            </a>
          </li>
        </ul>
        <div
          className={`tab no_scroll ${
            activeTab === "currentBids" ? "active" : null
          }`}
          id="currentBids"
        >
          {activeTab === "currentBids" ? (
            <>
              <div className="mid_sec name_bids">
                <div className="form_sec">
                  <div className="form_box permission_form active">
                    <form className="forms_type active">
                      <div className="field_row">
                        <div className="field_row_inner">
                          <div className="field_col">
                            <div className="field_row no-space">
                              <div className="field_col">
                                <label>Your Account Name</label>
                                <input
                                  type="text"
                                  placeholder="Bidder - Login to wallet"
                                  disabled
                                  value={bidder}
                                />
                              </div>
                              <div className="field_col">
                                <label>Name to Bid On</label>
                                <input
                                  type="text"
                                  placeholder="Name to Buy"
                                  value={formData.newname}
                                  onChange={(event) =>
                                    setFormData({
                                      ...formData,
                                      newname: event.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                          <div className="field_col">
                            <div className="field_row no-space">
                              <div className="field_col">
                                <label>
                                  Amount to Bid (in {config.token_symbol})
                                </label>
                                <input
                                  type="number"
                                  placeholder="e.g. 10000"
                                  value={formData.bid}
                                  min={0}
                                  onChange={(event) =>
                                    setFormData({
                                      ...formData,
                                      bid: event.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="field_col">
                                <label>&nbsp;</label>
                                <input
                                  type="button"
                                  defaultValue="Bid"
                                  onClick={handleClick}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <CurrentBids currentBids={currentBids} wrapped />
            </>
          ) : null}
        </div>
        <div
          className={`tab ${activeTab === "claimBids" ? "active" : null}`}
          id="claimBids"
        >
          {activeTab === "claimBids" ? (
            <ClaimBids claimBids={claimBids} paginated />
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Namebids;
