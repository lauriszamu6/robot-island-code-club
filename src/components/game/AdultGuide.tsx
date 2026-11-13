import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import type { Game, AgeBand, Difficulty } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export function AdultGuide({ game, ageBand, difficulty, onDifficulty, forcedMode }: { game: Game; ageBand: AgeBand | null; difficulty: Difficulty; onDifficulty: (d: Difficulty) => void; forcedMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(ageBand === "13-15");
  return (
    <section className="rounded-3xl border-2 border-navy bg-lavender-soft">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-3 text-left font-extrabold">
        <Users className="size-5" /> Adult guide: {game.guide.concept}
        <ChevronDown className={cn("ml-auto size-5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 px-4 pb-4 text-sm">
          <div>
            <p className="font-extrabold">What's this about?</p>
            <p>{detail ? game.guide.explainDetailed : game.guide.explainShort}</p>
            <button className="mt-1 text-xs font-bold underline" onClick={() => setDetail(!detail)}>{detail ? "Show simpler explanation" : "Show more detail"}</button>
            <p className="text-xs text-muted-foreground">Suggested for age {ageBand?.replace("-", "–") ?? "?"}: {ageBand === "13-15" ? "detailed" : "simple"}.</p>
          </div>
          <div><p className="font-extrabold">Ask your builder</p><p>“{game.guide.question}”</p></div>
          <div><p className="font-extrabold">Nudge (doesn't give the answer)</p><p>{game.hints[0]}</p></div>
          <div>
            <p className="font-extrabold">Difficulty override</p>
            <div className="mt-1 flex gap-2">
              {(["gentle", "challenge"] as Difficulty[]).map((d) => (
                <button key={d} aria-pressed={difficulty === d} onClick={() => onDifficulty(d)} className={cn("rounded-xl border-2 border-navy px-3 py-1.5 font-bold", difficulty === d ? "bg-navy text-on-dark" : "bg-card")}>{d === "gentle" ? "Gentle" : "Challenge"}</button>
              ))}
            </div>
            {forcedMode && <p className="mt-1 text-xs text-muted-foreground">This round was opened as a suggested practice/harder variation.</p>}
            <p className="mt-1 text-xs text-muted-foreground">Changing difficulty restarts the puzzle.</p>
          </div>
        </div>
      )}
    </section>
  );
}
