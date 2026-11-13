import { format, parseISO } from "date-fns";
import { gameById } from "@/lib/game-data";
import { eur, type DemoState } from "@/lib/rewards";

export function TxnHistory({ s }: { s: DemoState }) {
  if (s.transactions.length === 0) return <p className="text-sm text-muted-foreground">No rewards earned yet.</p>;
  return (
    <ul className="divide-y divide-navy/10">
      {[...s.transactions].reverse().map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
          <span className={t.type === "game" ? "rounded-full border-2 border-navy bg-teal-soft px-2 py-0.5 text-xs font-extrabold" : "rounded-full border-2 border-navy bg-sun px-2 py-0.5 text-xs font-extrabold"}>{t.type === "game" ? "Game reward" : "Level booster"}</span>
          <span className="flex-1 font-semibold">{t.type === "game" ? gameById(t.ref)?.title : `Level ${t.ref} complete`}</span>
          <span className="hidden text-muted-foreground sm:inline">{format(parseISO(t.at), "d MMM, HH:mm")}</span>
          <span className="font-mono font-extrabold">+{eur(t.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
