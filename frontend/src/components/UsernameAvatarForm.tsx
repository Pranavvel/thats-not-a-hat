"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../contexts/SocketContext";
import { useGameState } from "../contexts/GameStateContext";

const AVATAR_OPTIONS = ["🎩", "🎁", "🧠", "😈", "🤔", "🎉", "🧢", "🕶️"];

export function UsernameAvatarForm() {
  const { socket, isConnected } = useSocket();
  const game = useGameState();
  const router = useRouter();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0] ?? "🎩");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !isConnected || !name.trim();

  const handleCreate = () => {
    if (!socket) return;
    setError(null);
    setIsCreating(true);
    socket.emit(
      "create_room",
      {
        playerId: crypto.randomUUID(),
        name: name.trim(),
        avatar,
        isPublic: true,
      },
      (res: { ok: boolean; roomId?: string; playerId?: string; error?: string }) => {
        setIsCreating(false);
        if (!res.ok || !res.roomId || !res.playerId) {
          setError(res.error ?? "Could not create room.");
          return;
        }
        game.setIdentity({ roomId: res.roomId, playerId: res.playerId });
        router.push(`/room/${res.roomId}`);
      },
    );
  };

  const handleJoin = () => {
    if (!socket) return;
    const trimmedCode = roomCode.trim();
    if (!trimmedCode) return;
    setError(null);
    setIsJoining(true);
    socket.emit(
      "join_room",
      {
        roomId: trimmedCode,
        playerId: crypto.randomUUID(),
        name: name.trim(),
        avatar,
      },
      (res: { ok: boolean; roomId?: string; playerId?: string; error?: string }) => {
        setIsJoining(false);
        if (!res.ok || !res.roomId || !res.playerId) {
          setError(res.error ?? "Could not join room.");
          return;
        }
        game.setIdentity({ roomId: res.roomId, playerId: res.playerId });
        router.push(`/room/${res.roomId}`);
      },
    );
  };

  return (
    <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg backdrop-blur md:p-7">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
          Get ready
        </p>
        <h2 className="text-lg font-semibold text-slate-50">
          Choose a name and avatar
        </h2>
      </div>

      <div className="space-y-4">
        <label className="block text-xs font-medium text-slate-300">
          Display name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Gift Goblin"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-slate-400"
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-300">Avatar</p>
          <div className="grid grid-cols-8 gap-2">
            {AVATAR_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAvatar(option)}
                className={`flex h-9 items-center justify-center rounded-full border text-lg ${
                  avatar === option
                    ? "border-sky-400 bg-sky-500/10"
                    : "border-slate-700 bg-slate-900 hover:border-slate-500"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <button
            type="button"
            disabled={disabled || isCreating}
            onClick={handleCreate}
            className="flex w-full items-center justify-center rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-sky-500/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {isCreating ? "Creating room…" : "Create new room"}
          </button>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <div className="h-px flex-1 bg-slate-800" />
            or join a friend
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <div className="flex gap-2">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Paste room code"
              className="w-full rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500 focus:border-slate-400"
            />
            <button
              type="button"
              disabled={disabled || !roomCode.trim() || isJoining}
              onClick={handleJoin}
              className="rounded-full border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
            >
              Join
            </button>
          </div>
        </div>

        {!isConnected && (
          <p className="text-[10px] text-amber-400">
            Connecting to game server… Check your internet if this takes more
            than a few seconds.
          </p>
        )}

        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    </div>
  );
}

