import React, { createContext, useEffect, useState } from "react";

import io from "socket.io-client";
import config from "../config";
import type { SocketContextValue } from "../types/socket";

const SocketContext = createContext<SocketContextValue>(null);

const SocketContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<SocketContextValue>(null);

  useEffect(() => {
    //////////No socket for localnet//////////
    if (config.network_type === "localnet") return;
    //////////No socket for localnet//////////

    const newSocket = io(config.socket.url, {
      path: config.socket.path,
      // WebSocket only: the API runs behind a load balancer across independent providers, and
      // HTTP long-polling breaks when consecutive polls land on different instances.
      transports: ["websocket"],
    });
    newSocket.on("connect", () => {
      setSocket(newSocket);
    });
    newSocket.on("disconnect", () => {
      setSocket(newSocket);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export { SocketContext, SocketContextProvider };
