import { useContext } from "react";
import { Helmet } from "react-helmet-async";
import { WalletContext } from "../../../app/contexts/wallet-context";
import Tokens from "../../account/components/tokens";

const WalletOverview = () => {
  const wallet = useContext(WalletContext);
  const { walletAccount } = wallet;

  return (
    <>
      <Helmet>
        <title>Wallet | WAX Explorer</title>
      </Helmet>
      <div className="form_box wallet-overview active">
        <h2>Wallet</h2>
        <Tokens balances={walletAccount.balances} showTransferAction />
      </div>
    </>
  );
};

export default WalletOverview;
