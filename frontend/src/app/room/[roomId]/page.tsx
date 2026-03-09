"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "../../../contexts/SocketContext";
import { useGameState, useLocalPlayer } from "../../../contexts/GameStateContext";
import { GameTable } from "../../../components/GameTable";

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const { isConnected } = useSocket();
  const game = useGameState();
  const localPlayer = useLocalPlayer();

  useEffect(() => {
    if (!isConnected || !params.roomId) return;
    // Try to resync when we arrive or reconnect.
    game.requestSync();
  }, [isConnected, params.roomId, game]);

  if (!params.roomId) return null;

  const roomId = params.roomId;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : `Room: ${roomId}`;

  if (!game.state || game.state.phase === "lobby") {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Lobby
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                Waiting for players…
              </h1>
              <p className="mt-2 text-xs text-slate-400">
                Room code: <span className="font-mono text-slate-100">{roomId}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl).catch(() => {});
              }}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800"
            >
              Copy invite link
            </button>
          </header>

          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
            <h2 className="text-sm font-semibold text-slate-100">
              Players in this room
            </h2>
            <ul className="grid gap-2 text-sm">
              {game.players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.avatar}</span>
                    <span className="font-medium text-slate-50">{p.name}</span>
                    {p.id === game.state?.currentPlayerId && (
                      <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                        Host
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Seat {p.seatIndex + 1}
                  </span>
                </li>
              ))}
              {game.players.length === 0 && (
                <li className="text-xs text-slate-500">Waiting for players…</li>
              )}
            </ul>
          </section>

          {localPlayer && localPlayer.seatIndex === 0 && (
            <div className="flex flex-col items-start gap-2 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 md:flex-row md:items-center md:justify-between">
              <p>
                You are the host. Start when everyone has joined. Use 2-player
                mode for duels.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!game.roomId) return;
                    const settings = {
                      twoPlayerMode: game.players.length === 2,
                      multiRound: false,
                    };
                    game.state &&
                      window.dispatchEvent(
                        new CustomEvent("tnah:start-game", {
                          detail: { roomId: game.roomId, settings },
                        }),
                      );
                  }}
                  className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-sky-500/30 hover:bg-sky-400"
                >
                  Start game
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 md:px-8 md:py-6">
        <GameTable />
      </main>
    </div>
  );
}

