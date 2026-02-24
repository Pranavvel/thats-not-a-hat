/* eslint-disable react/function-component-definition */
"use client";

import { motion } from "framer-motion";

export function LobbyHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-xl md:p-8">
      <div className="relative z-10 space-y-4">
        <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
          Fast, social, and a little bit evil.
        </h2>
        <p className="text-sm text-slate-400 md:text-base">
          Draw gifts, pass them around the table, and bluff with confidence.
          When someone calls you out with “That’s not a hat”, the truth is
          revealed — and someone eats a penalty.
        </p>
        <ul className="mt-4 grid gap-2 text-xs text-slate-300 md:text-sm">
          <li>• 2–8 players, browser only</li>
          <li>• Public rooms or private invite link</li>
          <li>• No accounts, just a name and an avatar</li>
        </ul>
      </div>

      <motion.div
        className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-3xl border border-slate-700/40 bg-slate-900/70"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 }}
      >
        <motion.div
          className="absolute inset-4 rounded-2xl bg-slate-800/60"
          initial={{ rotate: -6 }}
          animate={{ rotate: -2 }}
          transition={{ type: "spring", stiffness: 80, damping: 16 }}
        />
        <motion.div
          className="absolute inset-7 flex items-center justify-center rounded-2xl border border-slate-600/60 bg-slate-900/80 text-xs font-medium text-slate-100"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.18, type: "spring", stiffness: 120 }}
        >
          “I have a nice hat for you.”
        </motion.div>
      </motion.div>
    </div>
  );
}

