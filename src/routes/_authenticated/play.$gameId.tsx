import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AdventureGate, type Adventure } from "@/components/AdventureGate";
import { levelState, recordAttempt } from "@/lib/adventure-data";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Lightbulb, PartyPopper, Star, Info } from "lucide-react";
import { Card, DemoFunds } from "@/components/AppShell";
import { Robot, RobotSays, type Mood } from "@/components/Robot";
import { WorkshopScene } from "@/components/scenery/Workshop";
import { BigButton } from "@/components/game/Controls";
import { OrderEngine } from "@/components/game/OrderEngine";
import { GridEngine } from "@/components/game/GridEngine";
import { LogicEngine } from "@/components/game/LogicEngine";
import { AdultGuide } from "@/components/game/AdultGuide";
import { getDemo, setDemo } from "@/lib/demo-store";
import { KIND_LABEL, type Game, type Level, type Difficulty, type GridDef, type LogicDef, type OrderDef } from "@/lib/game-data";
import { applyCompletion, eur, type CompletionResult, type Feedback } from "@/lib/rewards";
import { recommend, type Recommendation } from "@/lib/recommend";
import { cn } from "@/lib/utils";

type Mode = "normal" | "practice" | "harder";

export const Route = createFileRoute("/_authenticated/play/$gameId")({
  validateSearch: (s: Record<string, unknown>): { mode: Mode } => ({
    mode: s["mode"] === "practice" || s["mode"] === "harder" ? s["mode"] : "normal",
  }),
  head: () => ({
    meta: [
      { title: "Workshop game — Astrobit" },
      { name: "description", content: "Solve a coding challenge in the robot workshop, with hints and an adult guide." },
      { property: "og:title", content: "Astrobit workshop game" },
      { property: "og:description", content: "A coding challenge with hints and an adult guide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const { gameId } = Route.useParams();
  return (
    <AdventureGate>{(a) => {
      const game = a.content.games.find((g) => g.id === gameId);
      if (!game) return <div className="mx-auto max-w-lg p-6"><Card className="text-center"><h1 className="text-2xl font-extrabold">Game not found</h1><Link to="/map" className="mt-3 inline-block font-extrabold text-teal underline">Back to the map</Link></Card></div>;
      return <PlayView a={a} game={game} />;
    }}</AdventureGate>
  );
}

function PlayView({ a, game }: { a: Adventure; game: Game }) {
  const { mode } = Route.useSearch();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<"play" | "celebrate">("play");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [wasReplay, setWasReplay] = useState(false);
  const [override, setOverride] = useState<Difficulty | null>(null);
  const [engineKey, setEngineKey] = useState(0);
  const completing = useRef(false);

  useEffect(() => { setPhase("play"); setFeedback(null); setSaveError(null); setHintsShown(0); setResult(null); setOverride(null); setEngineKey((k) => k + 1); completing.current = false; }, [game.id, mode]);

  const { levels, games } = a.content;
  const level = levels.find((l) => l.n === game.level)!;
  const upgrades = levels.filter((l) => levelState(games, a.done, l.n) === "completed").map((l) => l.n);
  if (levelState(games, a.done, game.level) === "locked") {
    return (
      <WorkshopScene level={level} upgrades={upgrades}>
        <Card className="mx-auto max-w-lg text-center"><Robot mood="thinking" className="mx-auto h-24 w-20" /><h1 className="mt-2 text-2xl font-extrabold">This island is still locked</h1><p className="mt-1">Finish level {game.level - 1} first.</p><Link to="/map" className="mt-4 inline-block font-extrabold text-teal underline">Back to the map</Link></Card>
      </WorkshopScene>
    );
  }

  const difficulty: Difficulty = override ?? (mode === "practice" ? "gentle" : mode === "harder" ? "challenge" : a.child.difficulty);
  const alreadyDone = a.done.has(game.id);
  const mood: Mood = feedback ? (feedback.ok ? "celebrate" : "encourage") : hintsShown ? "thinking" : "welcome";

  const onResult = async (ok: boolean, msg: string) => {
    setFeedback({ ok, msg });
    setSaveError(null);
    if (ok) {
      if (completing.current) return; // guards against double-click / repeated events
      completing.current = true;
    }
    try {
      const r = await recordAttempt(a.child.id, game.id, ok);
      await qc.invalidateQueries({ queryKey: ["progress", a.child.id] });
      if (!ok) return;
      let cr: CompletionResult = { firstTime: r.first_completion, gameReward: 0, booster: 0, levelCompleted: r.level_completed };
      if (r.first_completion) {
        // Interim demo rewards (moves to the database in Core 2), synced with stored progress.
        setDemo((x) => {
          const completed = Object.fromEntries([...a.done].map((id) => [id, x.completed[id] ?? new Date().toISOString()]));
          const out = applyCompletion({ ...x, completed }, game.id);
          cr = { ...out.result, firstTime: true, levelCompleted: r.level_completed };
          return out.state;
        });
      }
      setWasReplay(!r.first_completion);
      setResult(cr);
      setTimeout(() => setPhase("celebrate"), 700);
    } catch {
      if (ok) completing.current = false;
      setSaveError("We couldn't save this to your progress. Check your connection and press Run again.");
    }
  };
  const showHint = () => {
    if (hintsShown >= game.hints.length) return;
    setHintsShown((h) => h + 1);
    setDemo((x) => ({ ...x, hints: { ...x.hints, [game.id]: (x.hints[game.id] ?? 0) + 1 } }));
  };

  const engineProps = { gameId: game.id, difficulty, onResult, onReset: () => setFeedback(null) };

  return (
    <WorkshopScene level={level} upgrades={upgrades}>
      {phase === "celebrate" && result ? (
        <Celebrate game={game} levels={levels} result={result} replay={wasReplay || mode !== "normal"} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/level/$levelId" params={{ levelId: String(game.level) }} className="inline-flex items-center gap-1 font-extrabold text-teal"><ArrowLeft className="size-4" /> Level {game.level}: {level.concept}</Link>
            <span className="ml-auto rounded-full border-2 border-navy bg-card px-3 py-0.5 text-xs font-extrabold">{difficulty === "gentle" ? "Gentle" : "Challenge"} · {KIND_LABEL[game.def.kind]}</span>
          </div>
          {(alreadyDone || mode !== "normal") && (
            <p className="flex items-center gap-2 rounded-xl bg-teal-soft px-3 py-2 text-sm font-bold"><Info className="size-4 shrink-0" /> {mode === "practice" ? "Practice round" : mode === "harder" ? "Harder variation" : "Replay"}: just for learning and fun. No extra cash reward.</p>
          )}
          <section className="rounded-3xl chunky bg-card p-4 sm:p-6">
            <h1 className="text-3xl font-extrabold">{game.title}</h1>
            <p className="mt-1 text-lg"><strong>Goal:</strong> {game.goal}</p>
            <div className="mt-5" key={`${engineKey}-${difficulty}`}>
              {game.def.kind === "order" && <OrderEngine def={game.def as OrderDef} {...engineProps} />}
              {game.def.kind === "grid" && <GridEngine def={game.def as GridDef} {...engineProps} />}
              {game.def.kind === "logic" && <LogicEngine def={game.def as LogicDef} {...engineProps} />}
            </div>
          </section>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div aria-live="polite">
              {saveError && <p role="alert" className="mb-3 rounded-xl border-2 border-destructive bg-card p-3 text-sm font-bold text-destructive">{saveError}</p>}
              {feedback ? (
                <div className={cn("flex items-start gap-3 rounded-2xl border-2 border-navy p-3", feedback.ok ? "bg-mint" : "bg-sun-soft")}>
                  <Robot mood={mood} className="h-16 w-12 shrink-0" />
                  <div><p className="font-extrabold">{feedback.ok ? "✓ It works!" : "Not yet. Let's investigate"}</p><p>{feedback.msg}</p></div>
                </div>
              ) : (
                <RobotSays mood={mood}>Build your program, then press Run to test it.</RobotSays>
              )}
              {hintsShown > 0 && (
                <ul className="mt-3 space-y-2">{game.hints.slice(0, hintsShown).map((h, i) => <li key={i} className="flex gap-2 rounded-xl bg-sun-soft px-3 py-2 text-sm font-semibold"><Lightbulb className="size-4 shrink-0 text-coral" /> Hint {i + 1}: {h}</li>)}</ul>
              )}
            </div>
            <BigButton variant="sun" onClick={showHint} disabled={hintsShown >= game.hints.length} className="self-start"><Lightbulb /> {hintsShown >= game.hints.length ? "No more hints" : `Hint (${game.hints.length - hintsShown} left)`}</BigButton>
          </div>
          <AdultGuide game={game} ageBand={a.child.age_range} difficulty={difficulty} forcedMode={mode !== "normal"} onDifficulty={(d) => { setOverride(d); setFeedback(null); }} />
        </div>
      )}
    </WorkshopScene>
  );
}

function Celebrate({ game, levels, result, replay }: { game: Game; levels: Level[]; result: CompletionResult; replay: boolean }) {
  const gameId = game.id;
  const [fun, setFun] = useState<Feedback["fun"] | null>(null);
  const [diff, setDiff] = useState<Feedback["difficulty"] | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const level = result.levelCompleted ? levels.find((l) => l.n === result.levelCompleted) ?? null : null;
  const nextLevel = level ? levels.find((l) => l.n === level.n + 1) ?? null : null;

  const submit = () => {
    if (!fun || !diff) return;
    setDemo((x) => ({ ...x, feedback: [...x.feedback, { gameId, fun, difficulty: diff, replay, at: new Date().toISOString() }] }));
    setRec(recommend(getDemo(), gameId, fun, diff));
  };
  const Choice = <T extends string>({ value, set, opts }: { value: T | null; set: (v: T) => void; opts: [T, string, string][] }) => (
    <div className="grid grid-cols-3 gap-2">
      {opts.map(([v, emoji, label]) => (
        <button key={v} aria-pressed={value === v} onClick={() => set(v)} className={cn("flex flex-col items-center rounded-2xl border-2 border-navy px-2 py-3 font-extrabold", value === v ? "bg-teal text-secondary-foreground" : "bg-card hover:bg-teal-soft")}>
          <span className="text-2xl" aria-hidden>{emoji}</span>{label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4 anim-enter">
      <Card className="text-center">
        <Robot mood="celebrate" className="anim-pop mx-auto h-32 w-28" />
        <h1 className="mt-2 flex items-center justify-center gap-2 text-3xl font-extrabold"><PartyPopper className="size-7 text-coral" /> {game.title} solved!</h1>
        {result.firstTime ? (
          <div className="mt-4 space-y-2">
            <p className="text-lg">You earned <strong className="rounded-lg bg-sun px-2 font-mono">{eur(result.gameReward)}</strong> game reward.</p>
            {level && <p className="text-lg">Island complete! Level booster: <strong className="rounded-lg bg-sun px-2 font-mono">{eur(result.booster)}</strong></p>}
            <DemoFunds className="mx-auto inline-flex" />
          </div>
        ) : (
          <p className="mt-3 font-bold">Great practice! Replays don't add money; you already earned this one.</p>
        )}
        {level && (
          <div className="mt-4 rounded-2xl bg-mint p-3 text-left">
            <p className="flex items-center gap-2 font-extrabold"><Star className="size-5 fill-sun" /> Workshop upgrade unlocked: {level.upgrade}</p>
            <p className="text-sm">A decoration for your workshop (separate from money).{nextLevel ? ` Level ${nextLevel.n}: ${nextLevel.concept} is now open!` : " Every island is complete!"}</p>
          </div>
        )}
      </Card>

      <Card>
        {!rec ? (
          <div className="space-y-4">
            <div><p className="mb-2 font-extrabold">How fun was it?</p><Choice value={fun} set={setFun} opts={[["not", "😐", "Not for me"], ["okay", "🙂", "Okay"], ["loved", "🤩", "Loved it"]]} /></div>
            <div><p className="mb-2 font-extrabold">How difficult was it?</p><Choice value={diff} set={setDiff} opts={[["easy", "🪶", "Too easy"], ["right", "👌", "Just right"], ["hard", "🧗", "Too hard"]]} /></div>
            <BigButton onClick={submit} disabled={!fun || !diff}>See what's next</BigButton>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Suggestion rule: {rec.rule}</p>
            <RobotSays mood="encourage">{rec.message}</RobotSays>
            {rec.adultTip && <p className="rounded-xl bg-lavender-soft px-3 py-2 text-sm"><strong>For the adult:</strong> {rec.adultTip}</p>}
            {rec.mode !== "normal" && <p className="text-sm font-bold">Practice and harder rounds are optional and carry no extra cash reward.</p>}
            <div className="flex flex-wrap gap-3">
              {rec.game && <Link to="/play/$gameId" params={{ gameId: rec.game.id }} search={{ mode: rec.mode }} className="inline-flex min-h-12 items-center rounded-2xl chunky bg-coral px-5 font-extrabold text-primary-foreground">Go: {rec.game.title}</Link>}
              <Link to="/map" className="inline-flex min-h-12 items-center rounded-2xl chunky bg-card px-5 font-extrabold">Island map</Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
