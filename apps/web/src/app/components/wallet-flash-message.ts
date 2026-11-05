import { useContext } from "react";
import { WalletContext } from "../contexts/wallet-context";

const WalletFlashMessage = () => {
  const wallet = useContext(WalletContext);
  if (!wallet) return null;
  // const { flashMessage } = wallet;

  return "WalletFlashMessage";
};

export default WalletFlashMessage;
