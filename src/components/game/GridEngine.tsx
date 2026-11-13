import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, X, Star, Zap } from "lucide-react";
import type { Block, GridDef, GridOp, SimpleBlock } from "@/lib/game-data";
import { countBlocks, simulate, type Frame } from "@/lib/grid-sim";
import { cn } from "@/lib/utils";
import { RunReset, type EngineProps } from "./Controls";

const LABEL: Record<GridOp, string> = { F: "Forward", L: "Turn left", R: "Turn right", REP: "Repeat", IF: "If blocked → turn" };
const simpleLabel = (b: SimpleBlock) => (b.t === "IF" ? `If blocked, turn ${b.turn === "R" ? "right" : "left"}, else forward` : LABEL[b.t]);
const ARROW = ["▲", "▶", "▼", "◀"];

export function GridEngine({ def, difficulty, onResult, onReset }: EngineProps<GridDef>) {
  const initial = () => structuredClone(def.initial ?? []) as Block[];
  const [prog, setProg] = useState<Block[]>(initial);
  const [target, setTarget] = useState<number | null>(null); // index of selected Repeat
  const [frame, setFrame] = useState<Frame>({ ...def.start, stars: [] });
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const make = (op: GridOp): Block => (op === "REP" ? { t: "REP", n: 3, body: [] } : op === "IF" ? { t: "IF", turn: "R" } : ({ t: op } as SimpleBlock));
  const add = (op: GridOp) => {
    setProg((p) => {
      const b = make(op);
      if (target !== null && p[target]?.t === "REP" && b.t !== "REP") {
        return p.map((x, i) => (i === target && x.t === "REP" ? { ...x, body: [...x.body, b as SimpleBlock] } : x));
      }
      return [...p, b];
    });
    if (op === "REP") setTarget(prog.length);
  };
  const move = (k: number, d: -1 | 1) => setProg((p) => { const a = [...p]; const j = k + d; if (j < 0 || j >= a.length) return a; [a[k], a[j]] = [a[j]!, a[k]!]; return a; });
  const remove = (k: number) => { setProg((p) => p.filter((_, i) => i !== k)); setTarget(null); };
  const update = (k: number, fn: (b: Block) => Block) => setProg((p) => p.map((b, i) => (i === k ? fn(b) : b)));

  const run = () => {
    const res = simulate(def, prog, difficulty);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setFrame(res.frames.at(-1)!); onResult(res.ok, res.message); return; }
    setRunning(true);
    let i = 0;
    timer.current = setInterval(() => {
      setFrame(res.frames[i]!);
      i++;
      if (i >= res.frames.length) { clearInterval(timer.current!); setRunning(false); onResult(res.ok, res.message); }
    }, 280);
  };
  const reset = () => { if (timer.current) clearInterval(timer.current); setRunning(false); setProg(initial()); setTarget(null); setFrame({ ...def.start, stars: [] }); onReset(); };

  const walls = new Set(def.walls.map((w) => `${w.x},${w.y}`));
  const limit = def.maxBlocks[difficulty];
  const used = countBlocks(prog);

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section aria-label="Robot grid">
        <div className="mx-auto grid max-w-sm gap-1 rounded-2xl bg-navy p-2" style={{ gridTemplateColumns: `repeat(${def.cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: def.rows * def.cols }, (_, i) => {
            const x = i % def.cols, y = Math.floor(i / def.cols), k = `${x},${y}`;
            const isBot = frame.x === x && frame.y === y;
            const isGoal = def.goal.x === x && def.goal.y === y;
            const star = def.stars.some((s) => s.x === x && s.y === y) && !frame.stars.includes(k);
            return (
              <div key={k} className={cn("relative flex aspect-square items-center justify-center rounded-md text-lg font-black", walls.has(k) ? "bg-wood" : "bg-cream", isGoal && "bg-mint")}>
                {walls.has(k) && <span className="sr-only">wall</span>}
                {isGoal && !isBot && <Zap className="size-6 text-teal" aria-label="goal: charger" />}
                {star && !isBot && <Star className={cn("size-5", difficulty === "challenge" ? "fill-sun text-navy" : "text-navy/30")} aria-label="star" />}
                {isBot && <span className="flex size-[80%] items-center justify-center rounded-lg chunky bg-teal text-on-dark transition-all" aria-label={`Bolt facing ${["up", "right", "down", "left"][frame.dir]}`}>{ARROW[frame.dir]}</span>}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          <Zap className="inline size-4 text-teal" /> goal{difficulty === "challenge" && def.stars.length > 0 && <> · <Star className="inline size-4 fill-sun" /> collect all stars</>}
        </p>
      </section>
      <section aria-label="Program editor">
        <div className="mb-2 flex flex-wrap gap-2">
          {def.allow.map((op) => (
            <button key={op} onClick={() => add(op)} disabled={running} className={cn("rounded-xl border-2 border-navy px-3 py-2 text-sm font-extrabold", op === "REP" ? "bg-coral text-primary-foreground" : op === "IF" ? "bg-sun" : "bg-teal-soft")}>
              + {LABEL[op]}
            </button>
          ))}
        </div>
        <p className="mb-2 text-sm font-bold" aria-live="polite">Blocks used: {used} / {limit}{target !== null && prog[target]?.t === "REP" && " · adding inside the selected Repeat"}</p>
        <ol className="flex min-h-32 flex-col gap-2 rounded-2xl bg-navy p-3">
          {prog.map((b, k) => (
            <li key={k} className={cn("rounded-lg bg-cream p-2 text-sm font-bold", b.t === "REP" && target === k && "ring-4 ring-sun")}>
              <div className="flex items-center gap-1">
                <span className="w-5 text-xs text-muted-foreground">{k + 1}</span>
                {b.t === "REP" ? (
                  <button className="flex flex-1 items-center gap-2 text-left" onClick={() => setTarget(target === k ? null : k)} aria-pressed={target === k}>
                    Repeat
                    <select aria-label="Repeat count" value={b.n} onClick={(e) => e.stopPropagation()} onChange={(e) => update(k, (x) => ({ ...(x as Extract<Block, { t: "REP" }>), n: Number(e.target.value) }))} className="rounded border-2 border-navy bg-card px-1">
                      {Array.from({ length: 19 }, (_, i) => i + 2).map((n) => <option key={n}>{n}</option>)}
                    </select>
                    times <span className="text-xs font-semibold text-muted-foreground">({target === k ? "selected" : "tap to fill"})</span>
                  </button>
                ) : b.t === "IF" ? (
                  <button className="flex-1 text-left" onClick={() => update(k, (x) => ({ t: "IF", turn: (x as { turn: "L" | "R" }).turn === "R" ? "L" : "R" }))}>{simpleLabel(b)} <span className="text-xs text-muted-foreground">(tap to flip)</span></button>
                ) : b.t === "L" || b.t === "R" ? (
                  <button className="flex-1 text-left" onClick={() => update(k, () => ({ t: b.t === "L" ? "R" : "L" }))}>{simpleLabel(b)} <span className="text-xs text-muted-foreground">(tap to flip)</span></button>
                ) : (
                  <span className="flex-1">{simpleLabel(b)}</span>
                )}
                <button aria-label="Move up" onClick={() => move(k, -1)} className="rounded p-1 hover:bg-teal-soft"><ArrowUp className="size-4" /></button>
                <button aria-label="Move down" onClick={() => move(k, 1)} className="rounded p-1 hover:bg-teal-soft"><ArrowDown className="size-4" /></button>
                <button aria-label="Remove" onClick={() => remove(k)} className="rounded p-1 hover:bg-coral/20"><X className="size-4" /></button>
              </div>
              {b.t === "REP" && (
                <ul className="ml-6 mt-1 flex flex-col gap-1 border-l-4 border-coral pl-2">
                  {b.body.map((s, j) => (
                    <li key={j} className="flex items-center rounded bg-teal-soft px-2 py-1">
                      <span className="flex-1">{simpleLabel(s)}</span>
                      <button aria-label="Remove from repeat" onClick={() => update(k, (x) => ({ ...(x as Extract<Block, { t: "REP" }>), body: (x as Extract<Block, { t: "REP" }>).body.filter((_, i) => i !== j) }))} className="rounded p-1 hover:bg-coral/20"><X className="size-3.5" /></button>
                    </li>
                  ))}
                  {b.body.length === 0 && <li className="text-xs text-muted-foreground">Empty: select it, then add blocks</li>}
                </ul>
              )}
            </li>
          ))}
          {prog.length === 0 && <li className="p-4 text-center text-sm text-on-dark/80">Add blocks to plan Bolt's route.</li>}
        </ol>
        <div className="mt-4"><RunReset onRun={run} onReset={reset} running={running} /></div>
      </section>
    </div>
  );
}
