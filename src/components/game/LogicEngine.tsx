import { useState } from "react";
import type { LogicDef } from "@/lib/game-data";
import { cn } from "@/lib/utils";
import { RunReset, type EngineProps } from "./Controls";

export function LogicEngine({ def, difficulty, onResult, onReset }: EngineProps<LogicDef>) {
  const [picks, setPicks] = useState<Record<number, string>>({});
  const options = (o: string[], answer: string) => (difficulty === "gentle" ? [answer, ...o.filter((x) => x !== answer).slice(0, 2)].sort() : o);

  const run = () => {
    for (const [i, line] of def.lines.entries()) {
      if (!line.blank) continue;
      const p = picks[i];
      if (!p) return onResult(false, `Line ${i + 1} still has an empty blank.`);
      if (p !== line.blank.answer) return onResult(false, line.blank.why?.[p] ?? `“${p}” on line ${i + 1} doesn't give the result we want.`);
    }
    onResult(true, def.success);
  };

  return (
    <div>
      <pre className="overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-base leading-9 text-on-dark">
        {def.lines.map((line, i) => {
          if (!line.blank) return <div key={i}>{line.text}</div>;
          const [before, after] = line.text.split("___");
          return (
            <div key={i} className="flex flex-wrap items-center">
              <span className="whitespace-pre">{before}</span>
              <span className="mx-1 inline-flex flex-wrap gap-1.5 align-middle" role="radiogroup" aria-label={`Blank on line ${i + 1}`}>
                {options(line.blank.options, line.blank.answer).map((o) => (
                  <button key={o} role="radio" aria-checked={picks[i] === o} onClick={() => setPicks((p) => ({ ...p, [i]: o }))}
                    className={cn("rounded-lg border-2 px-3 py-0.5 font-bold leading-7", picks[i] === o ? "border-sun bg-sun text-navy" : "border-on-dark/40 hover:border-sun")}>
                    {o}
                  </button>
                ))}
              </span>
              <span className="whitespace-pre">{after}</span>
            </div>
          );
        })}
      </pre>
      <div className="mt-4"><RunReset onRun={run} onReset={() => { setPicks({}); onReset(); }} /></div>
    </div>
  );
}
