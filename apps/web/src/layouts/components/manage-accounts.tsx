import { useContext, useEffect, useRef, useState } from "react";
import { WalletContext } from "../../app/contexts/wallet-context";
import { Link } from "react-router";
import JdenticonModule from "react-jdenticon";
import { SerializedSession } from "@wharfkit/session";
import config from "../../app/config";
import Switch from "../../app/components/ui/Switch";
import Icon from "../../app/components/ui/Icon";

const Jdenticon =
  typeof JdenticonModule === "function"
    ? JdenticonModule
    : JdenticonModule.default;

const ManageAccounts = () => {
  const wallet = useContext(WalletContext);
  const { session, multisig, setMultisig, removeUser } = wallet;

  const [sessions, setSessions] = useState<SerializedSession[]>([]);

  const loadSessions = () => {
    const sessionKit = wallet.sessionKitRef.current;
    if (sessionKit) {
      sessionKit.getSessions().then(setSessions);
    }
  };

  useEffect(() => {
    const sessionKit = wallet.sessionKitRef.current;
    if (sessionKit) {
      sessionKit.getSessions().then(setSessions);
    }
  }, [session, wallet.sessionKitRef]);

  const [searchUser, setSearchUser] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountSearchOpen, setAccountSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [menuOpen]);

  let walletIcon = session?.walletPlugin.metadata.logo?.light || "";
  if (walletIcon && walletIcon.slice(0, 4) !== "data") {
    walletIcon = `data:image/svg+xml;base64,${walletIcon}`;
  }

  return (
    <>
      <div ref={menuRef} className={`user_box ${session ? "logged_in" : ""}`}>
        {session ? (
          <a
            href="#"
            className="user"
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen((open) => !open);
            }}
          >
            {/* <span
              style={{
                background:
                  "url(/common/images/user-icon.png) no-repeat center center",
              }}
            >
              {actor.substring(0, 2)}
            </span> */}
            <span style={{ margin: "-12px 0 0" }}>
              <Jdenticon size="25" value={session?.actor.toString()} />
            </span>
            {session?.actor.toString()}
          </a>
        ) : (
          <a
            href="#"
            className="explore login"
            onClick={(e) => {
              e.preventDefault();
              if (sessions.length) {
                setMenuOpen((open) => !open);
              } else {
                wallet.showWalletConnectModal();
              }
            }}
          >
            Login
          </a>
        )}
        {/* <a href="#" className="logout">Logout</a>   */}
        <div
          className="user_detail"
          style={{ display: menuOpen ? "block" : undefined }}
        >
          {session ? (
            <>
              <div className="user_row">
                <figure>
                  <Jdenticon size="100" value={session?.actor.toString()} />

                  {/* <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={100}
                    height={100}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <path
                      fill="#acdce3"
                      d="M32.5 18.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M53.5 18.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M53.5 81.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M32.5 81.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M11.5 39.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M74.5 39.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M74.5 60.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M11.5 60.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0"
                    />
                    <path
                      fill="#59bac7"
                      d="M11.5 18.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M74.5 18.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M74.5 81.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M11.5 81.5a7,7 0 1,1 14,0a7,7 0 1,1 -14,0M29 29L50 29L50 50L29 50ZM36 48L48 48L48 36L36 36ZM71 29L71 50L50 50L50 29ZM52 36L52 48L64 48L64 36ZM71 71L50 71L50 50L71 50ZM64 52L52 52L52 64L64 64ZM29 71L29 50L50 50L50 71ZM48 64L48 52L36 52L36 64Z"
                    />
                  </svg> */}
                </figure>
                <div className="user_desc">
                  <h3>{session?.actor.toString()}</h3>
                  <span className="acc_state">
                    {session?.permission.toString()}
                    <span className="acc_state_icon">
                      <img
                        src={walletIcon}
                        alt={session?.walletPlugin?.metadata?.name || ""}
                      />
                    </span>
                  </span>
                  <Link
                    to={`/account/${session?.actor.toString()}`}
                    className="acc_btn"
                  >
                    View Account
                  </Link>
                </div>
              </div>
              <div className="multisig_row">
                <span className="text">Multisig Mode</span>
                <Switch
                  className={`slide_btn ${multisig.mode ? "active" : ""}`}
                  checked={multisig.mode}
                  aria-label="Multisig Mode"
                  onCheckedChange={() => {
                    setMultisig((multisig) => ({
                      ...multisig,
                      mode: multisig.mode ? false : true,
                      walletTransaction: null,
                    }));
                  }}
                />
              </div>
            </>
          ) : null}
          <div className="acc_row">
            <span className="text">Accounts ({sessions.length})</span>
            <button
              type="button"
              className="search_btn"
              onClick={() => setAccountSearchOpen((open) => !open)}
              aria-label="Search accounts"
            />
          </div>
          <ul className="user_chain_row">
            {wallet.sessionKitRef.current?.walletPlugins.map((plugin) => (
              <li key={plugin.id}>
                <span className="chain_cnt">
                  {
                    sessions.filter(
                      (session) => session.walletPlugin.id === plugin.id,
                    ).length
                  }
                </span>
                <span className="chain_icon">
                  <img
                    src={plugin.metadata.logo?.light}
                    alt={plugin.metadata.name}
                  />
                </span>
              </li>
            ))}
          </ul>
          <div
            className="login_search_row"
            style={{ display: accountSearchOpen ? "block" : undefined }}
          >
            <input
              id="loginSearch"
              type="text"
              placeholder="Search accounts"
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </div>
          <div className="login_acc_row">
            <ul>
              {sessions
                .filter(
                  (session) => session.chain.toString() === config.chain_id,
                )
                .sort((a, b) =>
                  a.actor.toString().localeCompare(b.actor.toString()),
                )
                .filter((session) =>
                  session.actor.toString().includes(searchUser),
                )
                .map((session: SerializedSession, index: number) => {
                  const walletPlugin =
                    wallet.sessionKitRef.current?.walletPlugins.find(
                      (plugin) => plugin.id === session.walletPlugin.id,
                    );

                  const walletIcon =
                    walletPlugin?.metadata.logo?.light ||
                    walletPlugin?.metadata.logo?.dark ||
                    null;

                  return (
                    <li key={index}>
                      <h3>
                        <span className="acc_icon">
                          <img
                            src={walletIcon}
                            alt={walletPlugin?.metadata?.name || ""}
                          />
                        </span>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            wallet.switchUser(session);
                          }}
                          title={`Switch to the account ${session.actor.toString()}`}
                        >
                          {session.actor.toString()} (
                          {session.permission.toString()})
                        </a>
                      </h3>
                      <div className="acc_actions">
                        <Link
                          to={`/account/${session.actor.toString()}`}
                          title={`Open account page for ${session.actor.toString()}`}
                        >
                          <span className="action_icon">
                            <Icon name="right" />
                          </span>
                        </Link>
                        <a
                          href="#"
                          className="action_icon"
                          onClick={async (e) => {
                            e.preventDefault();
                            await removeUser(session);
                            setSessions((prevSessions) =>
                              prevSessions.filter(
                                (savedSession) =>
                                  !(
                                    savedSession.actor.toString() ===
                                      session.actor.toString() &&
                                    savedSession.permission.toString() ===
                                      session.permission.toString() &&
                                    savedSession.walletPlugin.id ===
                                      session.walletPlugin.id &&
                                    savedSession.chain.toString() ===
                                      session.chain.toString()
                                  ),
                              ),
                            );
                            loadSessions();
                          }}
                          title={`Remove account ${session.actor.toString()} from this list`}
                        >
                          <Icon name="trash" />
                        </a>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
          <div className="profile_btn_row">
            <a
              href="#"
              className="action_button"
              onClick={async (e) => {
                e.preventDefault();
                await wallet.showWalletConnectModal();
                loadSessions();
                setMenuOpen(false);
              }}
            >
              Add Account
            </a>
            {session ? (
              <a
                href="#"
                className="action_button"
                onClick={(e) => {
                  e.preventDefault();
                  wallet.logout();
                }}
              >
                Log Out
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageAccounts;
