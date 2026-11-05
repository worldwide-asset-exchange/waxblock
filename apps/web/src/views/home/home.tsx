import { Helmet } from "react-helmet-async";
import { useContext, useEffect, useState } from "react";
import Explorer from "./components/explorer";
import LatestActivity from "./components/latest-activity";
import RecentActivity from "./components/recent-activity";
import {
  SocketContext,
  SocketContextProvider,
} from "../../app/contexts/socket-context";
import BlockchainApiManager from "../../app/services/blockchainApiManager";
import config from "../../app/config";

const Home = () => {
  const socket = useContext(SocketContext);

  const [chainInfo, setChainInfo] = useState(null);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {}, []);

  useEffect(() => {
    //////////No socket for localnet//////////
    if (config.network_type === "localnet") {
      const chainInfoInterval = setInterval(
        (function getInfo() {
          BlockchainApiManager.getInfo()
            .then((chainInfo) => {
              setChainInfo(chainInfo);
            })
            .catch((err) => console.log("getInfo error", err));

          return getInfo;
        })(),
        30000,
      );

      setStatistics({
        market_data: {
          current_price: {
            usd: 0,
          },
          market_cap: {
            usd: 0,
          },
          fully_diluted_valuation: {
            usd: 0,
          },
          price_change_percentage_24h: 0,
        },
      });

      return () => {
        clearInterval(chainInfoInterval);
      };
    }
    //////////No socket for localnet//////////

    if (!socket) return;

    socket.off("chainInfo").on("chainInfo", (chainInfo) => {
      setChainInfo(chainInfo);
    });

    socket.off("statistics").on("statistics", (statistics) => {
      setStatistics(statistics);
    });
  }, [socket, socket?.connected]);

  return (
    <>
      <Helmet>
        <title>The Official WAX Blockchain Explorer</title>
      </Helmet>

      <LatestActivity chainInfo={chainInfo} statistics={statistics} />
      {config.network_type === "mainnet" ||
      config.network_type === "testnet" ? (
        <Explorer />
      ) : null}
      <RecentActivity chainInfo={chainInfo} />
    </>
  );
};

const HomeWrapper = () => {
  return (
    <>
      <SocketContextProvider>
        <Home />
      </SocketContextProvider>
    </>
  );
};

export default HomeWrapper;
