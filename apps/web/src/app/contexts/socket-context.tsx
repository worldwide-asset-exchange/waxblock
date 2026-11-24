import React, { createContext, useEffect, useState } from "react";

import io, { type Socket } from "socket.io-client";
import config from "../config";
import type { SocketContextValue } from "../types/socket";
import { createRoundRobin } from "../utilities/round-robin";

const SocketContext = createContext<SocketContextValue>(null);

// Attempts on one provider before the socket moves to the next provider in the list.
const RECONNECT_ATTEMPTS_PER_PROVIDER = 3;

const SocketContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<SocketContextValue>(null);

  useEffect(() => {
    //////////No socket for localnet//////////
    if (config.network_type === "localnet") return;
    //////////No socket for localnet//////////

    // Start on a random provider, so visitors spread across providers. When a provider cannot be
    // reached, move to the next one, and wrap around.
    const providers = createRoundRobin(config.socket.urls ?? []).order();
    if (!providers.length) return;

    let stopped = false;
    let index = 0;
    let current: Socket | null = null;

    const connect = (): Socket => {
      const newSocket = io(providers[index % providers.length], {
        path: config.socket.path,
        // WebSocket only: consecutive HTTP long-polling requests must reach the same instance.
        transports: ["websocket"],
        reconnectionAttempts: RECONNECT_ATTEMPTS_PER_PROVIDER,
      });
      newSocket.on("connect", () => {
        if (current === newSocket) setSocket(newSocket);
      });
      newSocket.on("disconnect", () => {
        if (current === newSocket) setSocket(newSocket);
      });
      newSocket.io.on("reconnect_failed", () => {
        if (stopped || current !== newSocket) return;
        newSocket.disconnect();
        index += 1;
        current = connect();
      });
      return newSocket;
    };

    current = connect();

    return () => {
      stopped = true;
      current?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export { SocketContext, SocketContextProvider };
