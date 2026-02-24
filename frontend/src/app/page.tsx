import Link from "next/link";
import { LobbyHero } from "../components/LobbyHero";
import { UsernameAvatarForm } from "../components/UsernameAvatarForm";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <main className="flex w-full max-w-5xl flex-col gap-10 px-6 py-10 md:px-10 md:py-16">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Party game
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
              That’s Not a Hat — Online
            </h1>
          </div>
          <Link
            href="/tutorial"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            How to play
          </Link>
        </header>

        <section className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          <LobbyHero />
          <UsernameAvatarForm />
        </section>

        <p className="text-xs text-slate-500">
          Share your room link with friends, everyone plays from their own
          device in real time. Memory, bluffing, and social chaos — no setup
          required.
        </p>
      </main>
    </div>
  );
}
