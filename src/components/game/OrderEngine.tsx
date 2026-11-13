import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, X, Plus } from "lucide-react";
import type { OrderDef } from "@/lib/game-data";
import { RunReset, type EngineProps } from "./Controls";

function seededShuffle<T>(arr: T[], seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  if (a.every((x, i) => x === arr[i])) a.reverse();
  return a;
}

export function checkOrder(def: OrderDef, program: string[]): { ok: boolean; message: string } {
  if (program.includes(def.distractor)) return { ok: false, message: `“${def.distractor.trim()}” doesn't belong in this program. Take it out.` };
  if (program.length < def.blocks.length) return { ok: false, message: `Only ${program.length} of ${def.blocks.length} steps are in the program. Something's missing.` };
  const i = program.findIndex((b, k) => b !== def.blocks[k]);
  if (i === -1) return { ok: true, message: "Every step runs in the right order!" };
  return { ok: false, message: `Step ${i + 1} (“${program[i]!.trim()}”) runs at the wrong time. Check what it needs before it.` };
}

export function OrderEngine({ def, gameId, difficulty, onResult, onReset }: EngineProps<OrderDef>) {
  const pool = useMemo(() => seededShuffle(difficulty === "challenge" ? [...def.blocks, def.distractor] : def.blocks, gameId), [def, gameId, difficulty]);
  const [program, setProgram] = useState<number[]>([]);
  const spare = pool.map((_, i) => i).filter((i) => !program.includes(i));
  const move = (k: number, d: -1 | 1) => setProgram((p) => { const a = [...p]; const j = k + d; if (j < 0 || j >= a.length) return a; [a[k], a[j]] = [a[j]!, a[k]!]; return a; });

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section aria-label="Spare blocks">
        <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">Blocks — tap to add</h3>
        <ul className="flex flex-col gap-2">
          {spare.map((i) => (
            <li key={i}>
              <button onClick={() => setProgram((p) => [...p, i])} className="flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-navy/40 bg-card px-3 py-3 text-left font-mono text-sm font-semibold hover:border-teal hover:bg-teal-soft">
                <Plus className="size-4 shrink-0 text-teal" /> <span className="whitespace-pre">{pool[i]}</span>
              </button>
            </li>
          ))}
          {spare.length === 0 && <li className="text-sm text-muted-foreground">All blocks are in the program.</li>}
        </ul>
      </section>
      <section aria-label="Your program">
        <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">Your program</h3>
        <ol className="flex min-h-40 flex-col gap-2 rounded-2xl bg-navy p-3">
          {program.map((i, k) => (
            <li key={i} className="flex items-center gap-1 rounded-lg bg-cream px-2 py-2 font-mono text-sm font-semibold">
              <span className="w-6 text-center text-xs text-muted-foreground">{k + 1}</span>
              <span className="flex-1 whitespace-pre">{pool[i]}</span>
              <button aria-label="Move up" onClick={() => move(k, -1)} className="rounded p-1.5 hover:bg-teal-soft"><ArrowUp className="size-4" /></button>
              <button aria-label="Move down" onClick={() => move(k, 1)} className="rounded p-1.5 hover:bg-teal-soft"><ArrowDown className="size-4" /></button>
              <button aria-label="Remove" onClick={() => setProgram((p) => p.filter((x) => x !== i))} className="rounded p-1.5 hover:bg-coral/20"><X className="size-4" /></button>
            </li>
          ))}
          {program.length === 0 && <li className="p-4 text-center text-sm text-on-dark/80">Add blocks to build the program.</li>}
        </ol>
        <div className="mt-4">
          <RunReset onRun={() => { const r = checkOrder(def, program.map((i) => pool[i]!)); onResult(r.ok, r.message); }} onReset={() => { setProgram([]); onReset(); }} />
        </div>
      </section>
    </div>
  );
}
