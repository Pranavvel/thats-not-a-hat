"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSocket } from "./SocketContext";

type ArrowDirection = "left" | "right";

interface Card {
  id: string;
  itemName: string;
  arrowDirection: ArrowDirection;
}

type GamePhase =
  | "lobby"
  | "setup"
  | "draw_phase"
  | "declare_gift"
  | "response_choice"
  | "penalty_resolution"
  | "round_end"
  | "game_over";

interface PlayerVisibleCardRef {
  cardId: string;
}

interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  seatIndex: number;
  socketId: string | null;
  cardStack: PlayerVisibleCardRef[];
  penaltyCards: string[];
  totalScore: number;
  isConnected: boolean;
}

interface PendingGift {
  fromPlayerId: string;
  toPlayerId: string;
  cardId: string;
  declaredItemName: string;
  source: "drawn" | "oldest";
}

interface GameSettings {
  twoPlayerMode: boolean;
  multiRound: boolean;
  maxPenalty: number;
}

interface GameState {
  phase: GamePhase;
  roundNumber: number;
  drawPile: Card[];
  discardPile: Card[];
  playersById: Record<string, PlayerState>;
  turnOrder: string[];
  currentPlayerId: string | null;
  pendingGift: PendingGift | null;
  settings: GameSettings;
}

interface RoomUpdatePayload {
  roomId: string;
  players: PlayerState[];
  state: GameState;
}

interface GameStateContextValue {
  roomId: string | null;
  playerId: string | null;
  players: PlayerState[];
  state: GameState | null;
  setIdentity(info: { roomId: string; playerId: string }): void;
  requestSync(): void;
}

const GameStateContext = createContext<GameStateContextValue | undefined>(
  undefined,
);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdate = (payload: RoomUpdatePayload) => {
      setRoomId(payload.roomId);
      setPlayers(payload.players);
      setState(payload.state);
    };

    const handleGameState = (nextState: GameState) => {
      setState(nextState);
    };

    socket.on("room_update", handleRoomUpdate);
    socket.on("game_state", handleGameState);

    return () => {
      socket.off("room_update", handleRoomUpdate);
      socket.off("game_state", handleGameState);
    };
  }, [socket]);

  const value = useMemo(
    () => ({
      roomId,
      playerId,
      players,
      state,
      setIdentity: (info: { roomId: string; playerId: string }) => {
        setRoomId(info.roomId);
        setPlayerId(info.playerId);
      },
      requestSync: () => {
        if (!socket || !roomId) return;
        socket.emit(
          "request_state_sync",
          roomId,
          (res: { ok: boolean; state?: GameState; players?: PlayerState[] }) => {
            if (!res.ok || !res.state || !res.players) return;
            setState(res.state);
            setPlayers(res.players);
          },
        );
      },
    }),
    [roomId, playerId, players, state, socket],
  );

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return ctx;
}

export function useLocalPlayer() {
  const ctx = useGameState();
  if (!ctx.playerId) return null;
  return ctx.players.find((p) => p.id === ctx.playerId) ?? null;
}

