"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";

type ServerToClientEvents = {
  room_update: (payload: unknown) => void;
  game_state: (state: unknown) => void;
  drawn_card: (payload: unknown) => void;
  gift_declared: (payload: unknown) => void;
};

type ClientToServerEvents = Record<string, (...args: any[]) => void>;

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: GameSocket | null;
  isConnected: boolean;
  lastDisconnectReason: string | null;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastDisconnectReason, setLastDisconnectReason] =
    useState<string | null>(null);

  useEffect(() => {
    const s: GameSocket = io(SOCKET_URL, {
      transports: ["websocket"],
    });
    setSocket(s);

    s.on("connect", () => {
      setIsConnected(true);
      setLastDisconnectReason(null);
    });
    s.on("disconnect", (reason) => {
      setIsConnected(false);
      setLastDisconnectReason(
        typeof reason === "string" ? reason : "disconnected",
      );
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      lastDisconnectReason,
    }),
    [socket, isConnected, lastDisconnectReason],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return ctx;
}

