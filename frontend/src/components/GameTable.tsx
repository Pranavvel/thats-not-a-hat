"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useGameState, useLocalPlayer } from "../contexts/GameStateContext";

export function GameTable() {
  const { socket } = useSocket();
  const game = useGameState();
  const me = useLocalPlayer();

  useEffect(() => {
    if (!socket) return;
    const handleStartGameEvent = (e: Event) => {
      const custom = e as CustomEvent<{
        roomId: string;
        settings: { twoPlayerMode?: boolean; multiRound?: boolean };
      }>;
      socket.emit(
        "start_game",
        { roomId: custom.detail.roomId, settings: custom.detail.settings },
        () => {},
      );
    };
    window.addEventListener("tnah:start-game", handleStartGameEvent);
    return () => {
      window.removeEventListener("tnah:start-game", handleStartGameEvent);
    };
  }, [socket]);

  if (!game.state || !me) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        Reconnecting to the table…
      </div>
    );
  }

  const players = game.players.slice().sort((a, b) => a.seatIndex - b.seatIndex);
  const myIndex = players.findIndex((p) => p.id === me.id);

  const rotated = myIndex === -1 ? players : [...players.slice(myIndex), ...players.slice(0, myIndex)];

  const isMyTurn = game.state.currentPlayerId === me.id;

  const handleDraw = () => {
    if (!socket || !game.roomId) return;
    socket.emit("draw_card", { roomId: game.roomId, playerId: me.id });
  };

  const handleDeclareGift = () => {
    if (!socket || !game.roomId || !game.state || !game.state.pendingGift) return;
    // In this minimal version, we always tell the truth for the on-screen name.
    socket.emit("declare_gift", {
      roomId: game.roomId,
      playerId: me.id,
      declaredItemName: "a gift",
    });
  };

  const handleRespond = (accept: boolean) => {
    if (!socket || !game.roomId) return;
    socket.emit("respond_to_gift", {
      roomId: game.roomId,
      playerId: me.id,
      accept,
    });
  };

  const phaseLabelMap: Record<string, string> = {
    lobby: "Lobby",
    setup: "Setting up",
    draw_phase: "Draw a card",
    declare_gift: "Declare your gift",
    response_choice: "Accept or refuse",
    penalty_resolution: "Resolving penalty…",
    round_end: "Round end",
    game_over: "Game over",
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Round {game.state.roundNumber || 1}
          </p>
          <p className="text-sm font-medium text-slate-100">
            {phaseLabelMap[game.state.phase] ?? game.state.phase}
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Your penalty cards:{" "}
          <span className="font-semibold text-slate-100">
            {me.penaltyCards.length}/{game.state.settings.maxPenalty}
          </span>
        </p>
      </header>

      <section className="relative flex flex-1 flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/80 p-4 md:p-6">
        <div className="pointer-events-none absolute inset-6 rounded-[30%] border border-slate-800/60" />

        <div className="relative flex h-full w-full flex-col items-center justify-between gap-6">
          {/* Top players */}
          <div className="flex w-full items-center justify-center gap-4 md:gap-8">
            {rotated.slice(1, Math.min(rotated.length, 4)).map((p) => (
              <PlayerSeat key={p.id} player={p} isMe={false} />
            ))}
          </div>

          {/* Center: draw pile + info */}
          <div className="flex flex-col items-center gap-2">
            <motion.div
              className="relative h-24 w-16 rounded-2xl border border-slate-600 bg-slate-800 shadow-lg shadow-slate-900"
              animate={isMyTurn && game.state.phase === "draw_phase" ? { y: [-4, 4, -4] } : { y: 0 }}
              transition={
                isMyTurn && game.state.phase === "draw_phase"
                  ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
                  : undefined
              }
            >
              <div className="absolute inset-1 rounded-2xl bg-slate-900" />
              <p className="relative z-10 mt-7 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Draw pile
              </p>
              <p className="relative z-10 mt-1 text-center text-xs text-slate-100">
                {game.state.drawPile.length} left
              </p>
            </motion.div>
          </div>

          {/* Bottom: local player area */}
          {me && (
            <div className="flex w-full flex-col items-center gap-3">
              <PlayerSeat player={me} isMe />

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                {isMyTurn && game.state.phase === "draw_phase" && (
                  <button
                    type="button"
                    onClick={handleDraw}
                    className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-sky-500/40 hover:bg-sky-400"
                  >
                    Draw card
                  </button>
                )}
                {isMyTurn && game.state.phase === "declare_gift" && (
                  <button
                    type="button"
                    onClick={handleDeclareGift}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 hover:bg-emerald-400"
                  >
                    “I have a nice gift for you”
                  </button>
                )}
                {game.state.phase === "response_choice" &&
                  game.state.pendingGift &&
                  game.state.pendingGift.toPlayerId === me.id && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRespond(true)}
                        className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-300"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(false)}
                        className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-slate-50 hover:bg-rose-400"
                      >
                        That’s not it
                      </button>
                    </>
                  )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface PlayerSeatProps {
  player: ReturnType<typeof useLocalPlayer> extends infer P
    ? P extends null
      ? never
      : NonNullable<P>
    : never;
  isMe: boolean;
}

function PlayerSeat({ player, isMe }: PlayerSeatProps) {
  const cardCount = player.cardStack.length;
  const penaltyCount = player.penaltyCards.length;

  return (
    <motion.div
      className="flex min-w-[120px] flex-col items-center gap-1 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="text-lg">{player.avatar}</span>
        <span className="font-medium text-slate-50">
          {isMe ? `${player.name} (you)` : player.name}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
        <span>Stack: {cardCount}</span>
        <span>Penalties: {penaltyCount}</span>
      </div>
    </motion.div>
  );
}

