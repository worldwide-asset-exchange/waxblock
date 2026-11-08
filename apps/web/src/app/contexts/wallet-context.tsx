import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import BlockchainApiManager from "../services/blockchainApiManager";
import { useQuery } from "@tanstack/react-query";
import FetchManager from "../services/fetchManager";
import { getShortTrxId } from "../utilities/transaction";
import config from "../config";
import {
  NetworkEndpoints,
  resolveNetworkEndpoints,
  ENDPOINT_CHANGE_EVENT,
  endpointSettings,
} from "../utilities/network-endpoints";
import { ensureHealthyEndpoint } from "../services/endpointHealth";
import { useLocation, useNavigate } from "react-router";
import { SessionKit, Session, SerializedSession } from "@wharfkit/session";
import { WebRenderer } from "@wharfkit/web-renderer";
import { WalletPluginCloudWallet } from "@wharfkit/wallet-plugin-cloudwallet";
import { WalletPluginAnchor } from "@wharfkit/wallet-plugin-anchor";
import { WalletPluginWombat } from "@wharfkit/wallet-plugin-wombat";
import { WalletPluginCleos } from "@wharfkit/wallet-plugin-cleos";
import type {
  ChainAction,
  MultisigState,
  RammarketTableResponse,
  TableRowsResponse,
  TransactionAlert,
  WalletAccount,
  WalletTransaction,
} from "../types/blockchain";

interface WalletContextType {
  sessionKitRef: React.RefObject<SessionKit | null>;
  session: Session | null;
  walletAccount: WalletAccount;
  transactionAlert: TransactionAlert;
  setTransactionAlert: (value: TransactionAlert) => void;
  tokenPrice: number | null;
  multisig: MultisigState;
  setMultisig: (value: MultisigState | ((prev: MultisigState) => MultisigState)) => void;
  globalQueryParams: Record<string, string>;
  setGlobalQueryParams: (value: Record<string, string>) => void;
  removeUser: (user: SerializedSession) => Promise<void>;
  rammarket: RammarketTableResponse | null;
  ramPrice: number;
  submitTransaction: (transaction: WalletTransaction) => void;
  refresh: string | null;
  login: () => void;
  logout: () => void;
  switchUser: (user: SerializedSession) => Promise<void>;
  showWalletConnectModal: () => Promise<void>;
  connectWallet: (provider: string, autoConnect?: boolean) => Promise<void>;
  networkEndpoints: NetworkEndpoints;
  setNetworkEndpoints: (endpoints: NetworkEndpoints) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

const getChainId = () => {
  return (
    config.chain_id ||
    "1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4"
  );
};

const applyEndpointsToConfig = (endpoints: NetworkEndpoints) => {
  if (config.network_type === "localnet") return;

  config.endpoints.default = endpoints.rpcEndpoint;
  config.endpoints.historyV2 = { [endpoints.historyV2Endpoint]: 100 };
  config.endpoints.lightapi = { [endpoints.lightApiEndpoint]: 100 };
  config.endpoints.nfts.atomicassets = endpoints.atomicEndpoint;
};

const WalletContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [refresh, setRefresh] = useState(null);
  const [session, setSession] = useState<Session | null>(null);

  // WharfKit SessionKit instance
  const sessionKitRef = useRef<SessionKit | null>(null);
  const rendererRef = useRef<WebRenderer | null>(null);

  // Initialize SessionKit
  const initSessionKit = useCallback((endpoint?: string) => {
    if (sessionKitRef.current) {
      return sessionKitRef.current;
    }

    try {
      const chainId = getChainId();
      const chainUrl =
        endpoint || config.endpoints.default || "https://wax.greymass.com";

      const chain = {
        id: chainId,
        url: chainUrl,
      };

      if (!rendererRef.current) {
        rendererRef.current = new WebRenderer();
      }

      const walletPlugins = [];

      if (config.wallets.includes("cloudwallet")) {
        walletPlugins.push(new WalletPluginCloudWallet());
      }
      if (config.wallets.includes("anchor")) {
        walletPlugins.push(new WalletPluginAnchor());
      }
      if (config.wallets.includes("wombat")) {
        walletPlugins.push(new WalletPluginWombat());
      }
      if (config.wallets.includes("cleos")) {
        walletPlugins.push(new WalletPluginCleos());
      }

      sessionKitRef.current = new SessionKit({
        appName: config.app_name || "waxblock.io",
        chains: [chain],
        ui: rendererRef.current,
        walletPlugins: walletPlugins,
      });

      return sessionKitRef.current;
    } catch (error) {
      console.error("WharfKit init error:", error);
      throw error;
    }
  }, []);

  const [walletAccount, setWalletAccount] = useState({
    account: null,
    userres: null,
    delband: null,
    balances: [
      {
        contract: "eosio.token",
        decimals: config.token_precision,
        currency: config.token_symbol,
        amount: "0.00000000",
      },
    ],
    accInfo: null,
  });
  const [transactionAlert, setTransactionAlert] = useState(null);
  const [multisig, setMultisig] = useState({
    mode: false,
    walletTransaction: null,
  });
  const [globalQueryParams, setGlobalQueryParams] = useState({});
  const [networkEndpoints, _setNetworkEndpoints] = useState<NetworkEndpoints>(
    () => {
      const endpoints = resolveNetworkEndpoints();
      // Sync config.endpoints on init
      applyEndpointsToConfig(endpoints);
      return endpoints;
    },
  );

  const applyRpcEndpoint = useCallback(
    (rpcEndpoint: string, activeSession: Session | null) => {
      if (config.network_type === "localnet" || !rpcEndpoint) return;

      const chainId = getChainId();

      if (sessionKitRef.current) {
        sessionKitRef.current.setEndpoint(chainId, rpcEndpoint);
      }

      activeSession?.setEndpoint(rpcEndpoint);
    },
    [],
  );

  const loadWalletAccount = useCallback((activeSession: Session) => {
    if (config.network_type === "localnet" && !config.chain_id) return;

    const actor = activeSession.actor.toString();

    BlockchainApiManager.getAccount(actor).then((account) => {
      setWalletAccount((walletAccount) => ({
        ...walletAccount,
        account: account,
      }));
    });

    BlockchainApiManager.getTableRows({
      code: "eosio",
      scope: actor,
      table: "delband",
      limit: -1,
    }).then((response: TableRowsResponse) => {
      setWalletAccount((walletAccount) => ({
        ...walletAccount,
        delband: response,
      }));
    });

    BlockchainApiManager.getTableRows({
      code: "eosio",
      scope: actor,
      table: "userres",
      limit: -1,
    }).then((response) => {
      setWalletAccount((walletAccount) => ({
        ...walletAccount,
        userres: response,
      }));
    });

    BlockchainApiManager.getBalances(actor).then(
      (response: { balances?: WalletAccount["balances"] }) => {
        const balances = response.balances || null;
        setWalletAccount((walletAccount) => ({
          ...walletAccount,
          balances: balances,
        }));
      },
    );

    BlockchainApiManager.getAccInfo(actor).then(
      (response: WalletAccount["accInfo"]) => {
        const accInfo = response || null;
        setWalletAccount((walletAccount) => ({
          ...walletAccount,
          accInfo: accInfo,
        }));
      },
    );
  }, []);

  const activateSession = useCallback(
    (newSession: Session | null | undefined) => {
      const activeSession = newSession ?? null;
      setSession(activeSession);

      if (!activeSession) return;

      applyRpcEndpoint(networkEndpoints.rpcEndpoint, activeSession);
      loadWalletAccount(activeSession);
    },
    [applyRpcEndpoint, loadWalletAccount, networkEndpoints.rpcEndpoint],
  );

  const setNetworkEndpoints = useCallback(
    (endpoints: NetworkEndpoints) => {
      applyEndpointsToConfig(endpoints);
      _setNetworkEndpoints(endpoints);
      applyRpcEndpoint(endpoints.rpcEndpoint, session);
    },
    [applyRpcEndpoint, session],
  );

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncEndpoints = () => setNetworkEndpoints(resolveNetworkEndpoints());
    window.addEventListener(ENDPOINT_CHANGE_EVENT, syncEndpoints);
    return () =>
      window.removeEventListener(ENDPOINT_CHANGE_EVENT, syncEndpoints);
  }, [setNetworkEndpoints]);

  useEffect(() => {
    if (config.network_type === "localnet") return;
    const controller = new AbortController();
    const checkSelected = () => {
      if (document.visibilityState === "hidden") return;
      for (const { key } of endpointSettings) {
        void ensureHealthyEndpoint(key, controller.signal).catch(() => {});
      }
    };
    checkSelected();
    const interval = window.setInterval(checkSelected, 60000);
    window.addEventListener("online", checkSelected);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("online", checkSelected);
    };
  }, []);

  const hasRestoredSessionRef = useRef(false);

  useEffect(() => {
    if (hasRestoredSessionRef.current) return;

    const sessionKit = initSessionKit();
    if (!sessionKit) return;

    hasRestoredSessionRef.current = true;

    sessionKit
      .restore({
        chain: config.chain_id,
      })
      .then((restored) => {
        if (restored) {
          activateSession(restored);
        }
      });
  }, [initSessionKit, activateSession]);

  const login = async () => {
    const sessionKit = initSessionKit();
    if (!sessionKit) return;

    const { session } = await sessionKit.login();
    activateSession(session);
  };

  const resetWalletAccount = () => {
    setWalletAccount({
      account: null,
      userres: null,
      delband: null,
      balances: [
        {
          contract: "eosio.token",
          decimals: config.token_precision,
          currency: config.token_symbol,
          amount: "0.00000000",
        },
      ],
      accInfo: null,
    });
  };

  const logout = async () => {
    // Clear session and localStorage
    if (session) {
      try {
        // Optionally clear the session from SessionKit
        const sessionKit = sessionKitRef.current;
        if (sessionKit) {
          await sessionKit.logout();
        }
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
    activateSession(null);
    resetWalletAccount();
  };

  const switchUser = async (selected: SerializedSession) => {
    const sessionKit = initSessionKit();
    if (!sessionKit) return;

    const response = await sessionKit.restore(selected);
    activateSession(response);
  };

  const removeUser = async (selected: SerializedSession) => {
    const sessionKit = initSessionKit();
    if (!sessionKit) return;

    const current = session;
    const restored = await sessionKit.restore(selected);
    await sessionKit.logout(restored);
    if (
      current &&
      `${current.actor.toString()}-${current.permission.toString()}` !==
        `${restored?.actor.toString()}-${restored?.permission.toString()}`
    ) {
      activateSession(undefined);
      await sessionKit.persistSession(current);
      activateSession(current);
    } else {
      activateSession(undefined);
    }
  };

  const showWalletConnectModal = useCallback(async () => {
    try {
      const sessionKit = initSessionKit();
      if (!sessionKit) return;

      const { session } = await sessionKit.login();
      if (!session) return;

      activateSession(session);
    } catch (error) {
      // User cancelled or error occurred - WharfKit handles its own UI
      console.error("Login cancelled or failed:", error);
    }
  }, [activateSession, initSessionKit]);

  const connectWallet = useCallback(
    async (provider: string, autoConnect = false) => {
      try {
        const sessionKit = initSessionKit();
        if (!sessionKit) return;

        let session: Session | null = null;

        if (autoConnect) {
          session = await sessionKit.restore();
        }

        if (!session) {
          const { session: newSession } = await sessionKit.login();
          session = newSession;
        }

        if (!session) {
          return;
        }

        activateSession(session);
      } catch (error) {
        console.error("Connect wallet error:", error);
      }
    },
    [initSessionKit, activateSession],
  );

  const transactionSuccess = useCallback((tx, walletTransaction) => {
    let message = `<a href="/transaction/${tx.transaction_id}" target="_blank" rel="noopener noreferrer">Transaction success - ${getShortTrxId(tx.transaction_id)}...</a>`;

    //Show extra message for MSIG
    if (
      walletTransaction.actions &&
      walletTransaction.actions[0].account === "eosio.msig" &&
      walletTransaction.actions[0].name === "propose"
    ) {
      message +=
        "<br/>" +
        `<a href="/msig/${walletTransaction.actions[0].data.proposer}/${walletTransaction.actions[0].data.proposal_name}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline;">Show MSIG - ${walletTransaction.actions[0].data.proposal_name}</a>`;
    }

    setTransactionAlert({
      type: "success",
      message: message,
      walletTransaction: walletTransaction,
    });
    setTimeout(() => {
      setRefresh(new Date().toISOString());
      if (session) {
        loadWalletAccount(session);
      }
    }, 1000);
  }, [loadWalletAccount, session]);

  const transactionError = useCallback((error, walletTransaction) => {
    console.log("transactionError:", JSON.stringify(error));
    console.log(error);
    let message = "";
    try {
      error = JSON.parse(error);
    } catch {
      // do nothing
    }

    let errorV2: Record<string, unknown> = {};
    try {
      const errorStr = JSON.stringify(error);
      errorV2 = JSON.parse(errorStr);
    } catch {
      // do nothing
    }

    if (
      Array.isArray(errorV2.details) &&
      errorV2.details[0] &&
      typeof errorV2.details[0] === "object" &&
      errorV2.details[0] !== null &&
      "message" in errorV2.details[0]
    ) {
      message += "Transaction failed - " + String(errorV2.details[0].message);
    } else if (error.code === 500) {
      message = "Transaction failed ";
      message += "<br/>" + error.code + ": " + error.message;
      if (error.error.details[0]) {
        message += "<br/>" + error.error.details[0].message;
      }
    } else if (error.message) {
      message = "Transaction failed - " + error.message;
    } else {
      message =
        "Transaction failed - " +
        "An unknown error occurred. Please try again later.";
    }

    setTransactionAlert({
      type: "error",
      message: message,
      walletTransaction: walletTransaction,
    });
  }, []);

  const submitTransaction = useCallback(
    async (walletTransaction) => {
      //Rediect to  Msig Page if ON and doing any tx
      if (multisig.mode === true && location.pathname !== "/wallet/msig") {
        walletTransaction.type = "msig";

        walletTransaction.actions.forEach(function (action) {
          action.authorization = [{ actor: "", permission: "" }];
        });

        setMultisig((multisig) => ({
          ...multisig,
          walletTransaction: Object.assign({}, walletTransaction),
        }));
        navigate("/wallet/msig");
        return;
      }

      if (!session) {
        // Trigger WharfKit login UI
        showWalletConnectModal();
        return;
      }

      try {
        walletTransaction.account = {
          account: session.actor.toString(),
          permission: session.permission.toString(),
        };

        // Prepare actions with authorization
        const actions = walletTransaction.actions;
        const account = walletTransaction.account;

        const authorization = [
          {
            actor: account.account,
            permission: account.permission,
          },
        ];

        // Check if owner permission needed
        actions.forEach((action: ChainAction) => {
          if (
            action.name === "updateauth" &&
            action.data.permission === "owner"
          ) {
            authorization[0].permission = "owner";
          }
          action.authorization = action.authorization || authorization;
        });

        // Execute transaction
        const response = await session.transact({
          actions: actions.map((action: ChainAction) => ({
            account: action.account,
            name: action.name,
            authorization: action.authorization,
            data: action.data,
          })),
        });

        const apiResponse = response.response;

        const tx = {
          transaction_id: String(
            apiResponse?.transaction_id || apiResponse?.transaction?.id || "",
          ),
        };
        transactionSuccess(tx, walletTransaction);
      } catch (error) {
        transactionError(error, walletTransaction);
      }
    },
    [location, multisig, navigate, session, showWalletConnectModal, transactionError, transactionSuccess],
  );

  const { data: tokenPrice = null } = useQuery({
    queryKey: [`token_price`],
    queryFn: async () => {
      if (config.network_type === "localnet") {
        return 0;
      }

      const data = (await FetchManager.get("https://api.coingecko.com", {
        path: "/api/v3/simple/price?ids=WAX&vs_currencies=USD",
      })) as { wax?: { usd?: number } };

      return data.wax?.usd ?? 0;
    },
    refetchInterval: 30 * 60 * 1000,
  });

  const { data: rammarket = null } = useQuery<RammarketTableResponse>({
    queryKey: [`rammarket`],
    queryFn: () =>
      BlockchainApiManager.getTableRows({
        code: "eosio",
        scope: "eosio",
        table: "rammarket",
        lower_bound: "",
        upper_bound: "",
        limit: 1,
      }),
  });

  const ramRow = rammarket?.rows?.[0];
  const ramPrice = ramRow
    ? parseFloat(ramRow.quote?.balance ?? "0") /
      parseFloat(ramRow.base?.balance ?? "1")
    : 0;

  const wallet = {
    sessionKitRef: sessionKitRef,
    refresh: refresh,
    session: session,
    walletAccount: walletAccount,
    login: login,
    logout: logout,
    switchUser: switchUser,
    showWalletConnectModal: showWalletConnectModal,
    connectWallet: connectWallet,
    submitTransaction: submitTransaction,
    transactionAlert: transactionAlert,
    setTransactionAlert: setTransactionAlert,
    multisig: multisig, //{ mode: false, walletTransaction: null }
    setMultisig: setMultisig,
    tokenPrice: tokenPrice,
    globalQueryParams: globalQueryParams,
    setGlobalQueryParams: setGlobalQueryParams,
    removeUser: removeUser,
    rammarket: rammarket,
    ramPrice: ramPrice,
    networkEndpoints: networkEndpoints,
    setNetworkEndpoints: setNetworkEndpoints,
  };

  return (
    <WalletContext.Provider value={wallet as WalletContextType}>
      {children}
    </WalletContext.Provider>
  );
};

export { WalletContext, WalletContextProvider };
