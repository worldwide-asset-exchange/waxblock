import { createSearchParams, Link, useLocation } from "react-router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { getHeaderActiveMenu } from "../../app/utilities/route-tabs";
import { WalletContext } from "../../app/contexts/wallet-context";
import Search from "./search";
import ManageAccounts from "./manage-accounts";
import config from "../../app/config";
import { createBrowserHistory } from "history";
import NetworkSelector from "./network-selector";

type HeaderMenuProps = {
  activeMenu: string;
  actor?: string;
  currentPath: string;
  drawer?: boolean;
  moreOpen: boolean;
  onMoreToggle: () => void;
  onNavigate: () => void;
};

const moreMenuGroups = [
  {
    title: "Statistics",
    links: [
      { label: "Chain", to: "/chain" },
      { label: "Protocol Features", to: "/protocol-features" },
    ],
  },
  { title: "Validators", links: [{ label: "Vote", to: "/vote" }] },
  { title: "Accounts", links: [{ label: "Name Bids", to: "/namebids" }] },
  {
    title: "Misc",
    links: [
      { label: "Tokens", to: "/tokens" },
    ],
  },
];

const HeaderMenu = ({
  activeMenu,
  actor,
  currentPath,
  drawer = false,
  moreOpen,
  onMoreToggle,
  onNavigate,
}: HeaderMenuProps) => (
  <ul className="site_menu">
    <li className={activeMenu === "home" ? "active" : ""}>
      <Link to="/" onClick={onNavigate}>
        Home
      </Link>
    </li>
    <li className={activeMenu === "account" ? "active" : ""}>
      <Link to={`/account/${actor ?? ""}`} onClick={onNavigate}>
        Account
      </Link>
    </li>
    <li className={activeMenu === "wallet" ? "active" : ""}>
      <Link to="/wallet" onClick={onNavigate}>
        Wallet
      </Link>
    </li>
    {drawer ? (
      moreMenuGroups.flatMap(({ links }) =>
        links.map(({ label, to }) => (
          <li key={to} className={currentPath === to ? "active" : ""}>
            <Link to={to} onClick={onNavigate}>
              {label}
            </Link>
          </li>
        )),
      )
    ) : (
      <li>
        <span
          className={`expand_menu ${
            activeMenu === "more" || moreOpen ? "active" : ""
          }`}
          role="button"
          tabIndex={0}
          aria-expanded={moreOpen}
          onClick={onMoreToggle}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onMoreToggle();
            }
          }}
        >
          More
        </span>
        <div
          className="sub_menu"
          style={{ display: moreOpen ? "block" : undefined }}
        >
          <div className="sub_menu_inner">
            {moreMenuGroups.map(({ title, links }) => (
              <ul key={title}>
                <li>
                  <h3>{title}</h3>
                </li>
                {links.map(({ label, to }) => (
                  <li key={to}>
                    <Link to={to} onClick={onNavigate}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </li>
    )}
    <li
      className={`mobile_settings ${activeMenu === "settings" ? "active" : ""}`}
    >
      <Link to="/settings" onClick={onNavigate}>
        Settings
      </Link>
    </li>
  </ul>
);

const Header = () => {
  const wallet = useContext(WalletContext);
  const history = createBrowserHistory();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDialogElement>(null);
  const location = useLocation();
  const activeMenu = getHeaderActiveMenu(location.pathname);

  const closeMobileMenu = useCallback(() => {
    mobileMenuRef.current?.close();
    setMobileMenuOpen(false);
    setMoreOpen(false);
  }, []);

  const openMobileMenu = () => {
    if (!mobileMenuRef.current?.open) {
      mobileMenuRef.current?.showModal();
    }
    setMobileMenuOpen(true);
  };

  useEffect(() => {
    const collapsedHeader = window.matchMedia("(max-width: 1320px)");
    const closeAtDesktopWidth = () => {
      if (!collapsedHeader.matches) closeMobileMenu();
    };

    closeAtDesktopWidth();
    collapsedHeader.addEventListener("change", closeAtDesktopWidth);
    window.addEventListener("resize", closeAtDesktopWidth);
    return () => {
      collapsedHeader.removeEventListener("change", closeAtDesktopWidth);
      window.removeEventListener("resize", closeAtDesktopWidth);
    };
  }, [closeMobileMenu]);

  //Query params on navigate only for localnet
  useEffect(() => {
    if (!wallet || config.network_type !== "localnet") return;

    history.replace({
      search: `?${createSearchParams(wallet.globalQueryParams).toString()}`,
    });
  }, [history, location, wallet]);

  if (!wallet) return null;
  const { session, multisig } = wallet;

  return (
    <>
      <header>
        <div className="wrapper">
          <Link to="/" className="header_logo">
            {(() => {
              switch (config.network_type) {
                case "mainnet":
                default:
                  return (
                    <img
                      src="/common/images/wax-block-header-logo.png"
                      alt="Wax-block Logo"
                    />
                  );
                case "testnet":
                  return (
                    <img
                      src="/common/images/wax-testnet-block-header-logo.png"
                      alt="Wax-block Logo"
                    />
                  );
                case "localnet":
                  return (
                    <img
                      src="/common/images/wax-localnet-block-header-logo.png"
                      alt="Wax-block Logo"
                    />
                  );
              }
            })()}
          </Link>
          <Link to="/" className="header_logo_mobile">
            <img
              src="/common/images/wax-mobile-icon.png"
              alt="Wax-block Logo"
            />
            {/*  {config.network_type === "mainnet" ? (
              <img
                src="/common/images/wax-block-header-logo.png"
                alt="Wax-block Logo"
              />
            ) : (
              <img
                src="/common/images/wax-testnet-block-header-logo.png"
                alt="Wax-block Logo"
              />
            )} */}
          </Link>
          <nav className="desktop_header_nav">
            <HeaderMenu
              activeMenu={activeMenu}
              actor={session?.actor.toString()}
              currentPath={location.pathname}
              moreOpen={moreOpen}
              onMoreToggle={() => setMoreOpen((open) => !open)}
              onNavigate={closeMobileMenu}
            />
          </nav>
          <dialog
            ref={mobileMenuRef}
            className="mobile_nav_drawer"
            aria-labelledby="mobile-nav-title"
            onClose={() => {
              setMobileMenuOpen(false);
              setMoreOpen(false);
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeMobileMenu();
            }}
          >
            <div className="mobile_nav_header">
              <h2 id="mobile-nav-title">Menu</h2>
              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Close navigation"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <HeaderMenu
              activeMenu={activeMenu}
              actor={session?.actor.toString()}
              currentPath={location.pathname}
              drawer
              moreOpen={moreOpen}
              onMoreToggle={() => setMoreOpen((open) => !open)}
              onNavigate={closeMobileMenu}
            />
            <div className="mobile_nav_network">
              <h3>Network</h3>
              <NetworkSelector
                id="network_selector_mobile"
                className="network_selector_mobile"
                portalContainer={mobileMenuRef}
                side="top"
              />
            </div>
          </dialog>
          <button
            type="button"
            className={`toggle_menu ${mobileMenuOpen ? "active" : ""}`}
            aria-label="Open navigation"
            aria-expanded={mobileMenuOpen}
            onClick={openMobileMenu}
          >
            <span />
          </button>
          <div className="header_actions">
            <Search />
            <Link
              to="/settings"
              className="notifications settings_link"
              title="Settings"
            >
              <img src="/common/images/settings-icon.svg" alt="settings-icon" />
            </Link>
            {multisig.mode === true ? (
              <Link
                to="/wallet/msig"
                className="notifications multisig_indicator"
                aria-label="Open multisig transaction builder"
                title="Multisig mode is on"
              >
                <img
                  src="/common/images/multisig-icon.png"
                  alt=""
                  aria-hidden="true"
                />
              </Link>
            ) : null}
            <NetworkSelector className="network_selector_desktop" />
            <ManageAccounts />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
