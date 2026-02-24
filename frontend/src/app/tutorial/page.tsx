export default function TutorialPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <main className="w-full max-w-3xl space-y-6 px-6 py-10 md:px-8 md:py-12">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          How to play “That’s Not a Hat”
        </h1>
        <ol className="space-y-3 text-sm text-slate-200">
          <li>
            <span className="font-semibold text-slate-50">1. Everyone gets a gift.</span>{" "}
            The deck is shuffled and each player starts with a face-down card.
          </li>
          <li>
            <span className="font-semibold text-slate-50">2. On your turn, draw.</span>{" "}
            Draw the top card, everyone sees it briefly, then it joins your face-down stack.
          </li>
          <li>
            <span className="font-semibold text-slate-50">3. Pass a gift.</span>{" "}
            Follow the arrow on the card to pass it left or right and say, “I have a nice
            [thing] for you.” You can bluff.
          </li>
          <li>
            <span className="font-semibold text-slate-50">4. Accept or refuse.</span>{" "}
            The other player either accepts the gift or says, “That’s not a [thing].”
          </li>
          <li>
            <span className="font-semibold text-slate-50">5. Reveal and punish.</span>{" "}
            If they were wrong, they get a penalty. If you lied, you get a penalty.
          </li>
          <li>
            <span className="font-semibold text-slate-50">6. Three penalties and out.</span>{" "}
            When someone hits three penalties, the round ends. Fewest penalties wins.
          </li>
        </ol>
        <p className="text-xs text-slate-400">
          This online version keeps the rules of the physical game and adds smooth,
          real-time multiplayer so the chaos feels just like being around the table.
        </p>
      </main>
    </div>
  );
}

