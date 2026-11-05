import { useContext, useRef } from "react";
import { ChevronUp, X } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { WalletContext } from "../../app/contexts/wallet-context";
import AccountSummary from "./components/account-summary";
import config from "../../app/config";
import { getWalletActiveMenu } from "../../app/utilities/route-tabs";

const walletNavItems = [
  {
    key: "wallet",
    label: "Wallet",
    to: "/wallet",
    className: "wallet-nav-wallet",
  },
  {
    key: "transfer",
    label: "Transfer Tokens",
    to: "/wallet/transfer",
    className: "wallet-nav-transfer",
  },
  {
    key: "resources",
    label: "Manage CPU / NET",
    to: "/wallet/resources",
    className: "wallet-nav-resources",
  },
  {
    key: "ram",
    label: "Buy / Sell RAM",
    to: "/wallet/ram",
    className: "wallet-nav-ram",
  },
  {
    key: "create-account",
    label: "Create Account",
    to: "/wallet/create-account",
    className: "wallet-nav-create",
  },
  {
    key: "permissions",
    label: "Manage keys and permissions",
    to: "/wallet/permissions",
    className: "wallet-nav-permissions",
  },
  {
    key: "msig",
    label: "MSIG",
    to: "/wallet/msig",
    className: "wallet-nav-msig",
  },
  {
    key: "vote",
    label: "Vote",
    to: "/wallet/vote",
    className: "wallet-nav-vote",
  },
  {
    key: "bidnames",
    label: "Name Bids",
    to: "/wallet/bidnames",
    className: "wallet-nav-bidnames",
    publicNetworkOnly: true,
  },
  {
    key: "gbm-rewards",
    label: "Claim Rewards",
    to: "/wallet/gbm-rewards",
    className: "wallet-nav-rewards",
    publicNetworkOnly: true,
  },
  {
    key: "utilities",
    label: "Utilities",
    to: "/wallet/utilities",
    className: "wallet-nav-utilities",
  },
  {
    key: "powerup",
    label: "PowerUp",
    to: "/wallet/powerup",
    className: "wallet-nav-powerup powerup",
    publicNetworkOnly: true,
  },
];

type WalletNavListProps = {
  items: typeof walletNavItems;
  activeMenu: string;
  onNavigate?: () => void;
};

const WalletNavList = ({
  items,
  activeMenu,
  onNavigate,
}: WalletNavListProps) => (
  <ul>
    {items.map((item) => (
      <li
        key={item.key}
        className={`${item.className} ${
          activeMenu === item.key ? "active" : ""
        }`}
      >
        <Link
          to={item.to}
          onClick={onNavigate}
          aria-current={activeMenu === item.key ? "page" : undefined}
        >
          {item.label}
        </Link>
      </li>
    ))}
  </ul>
);

const Wallet = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;
  const mobileNavRef = useRef<HTMLDialogElement>(null);

  const location = useLocation();
  const activeMenu = getWalletActiveMenu(location.pathname);
  const showPublicNetworkItems =
    config.network_type === "mainnet" || config.network_type === "testnet";
  const visibleNavItems = walletNavItems.filter(
    (item) => !item.publicNetworkOnly || showPublicNetworkItems,
  );
  const activeNavItem =
    visibleNavItems.find((item) => item.key === activeMenu) ??
    visibleNavItems[0];
  const closeMobileNav = () => mobileNavRef.current?.close();

  if (!session) {
    return (
      <div className="mid_sec">
        <div className="form_sec full">
          <div className="form_box active">
            <h2>Wallet</h2>
            <p>Please login to view your wallet.</p>
            <input
              type="button"
              value="Login"
              onClick={() => wallet.showWalletConnectModal()}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AccountSummary />
      <div className="mid_sec wallet_tools_layout">
        <div className="side_menu wallet_menu_desktop">
          <WalletNavList items={visibleNavItems} activeMenu={activeMenu} />
        </div>
        <button
          type="button"
          className="wallet_tools_trigger"
          aria-haspopup="dialog"
          aria-label={`Open wallet navigation. Current page: ${activeNavItem.label}`}
          onClick={() => mobileNavRef.current?.showModal()}
        >
          <span>{activeNavItem.label}</span>
          <ChevronUp aria-hidden="true" />
        </button>
        <dialog
          ref={mobileNavRef}
          className="side_menu wallet_tools_drawer"
          aria-labelledby="wallet-tools-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              mobileNavRef.current?.close();
            }
          }}
        >
          <div className="wallet_tools_sheet">
            <div className="wallet_tools_handle" aria-hidden="true" />
            <div className="wallet_tools_header">
              <h2 id="wallet-tools-title">{activeNavItem.label}</h2>
              <button
                type="button"
                onClick={closeMobileNav}
                aria-label="Close wallet navigation"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Wallet navigation">
              <WalletNavList
                items={visibleNavItems}
                activeMenu={activeMenu}
                onNavigate={closeMobileNav}
              />
            </nav>
          </div>
        </dialog>
        <div className="form_sec">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Wallet;
