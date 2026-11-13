import { format, parseISO } from "date-fns";
import type { Game } from "@/lib/game-data";
import { euro, type WalletTx } from "@/lib/wallet-data";

const LABEL: Record<WalletTx["kind"], [string, string]> = {
  funding: ["Parent funding", "bg-lavender-soft"],
  game_reward: ["Game reward", "bg-teal-soft"],
  level_booster: ["Level booster", "bg-sun"],
  redemption: ["Redemption", "bg-mint"],
};

export function TxnHistory({ txns, games, showFunding = true }: { txns: WalletTx[]; games: Game[]; showFunding?: boolean }) {
  const list = txns.filter((t) => showFunding || t.kind !== "funding");
  if (list.length === 0) return <p className="text-sm text-muted-foreground">No transactions yet.</p>;
  return (
    <ul className="divide-y divide-navy/10">
      {[...list].reverse().map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
          <span className={`rounded-full border-2 border-navy px-2 py-0.5 text-xs font-extrabold ${LABEL[t.kind][1]}`}>{LABEL[t.kind][0]}</span>
          <span className="flex-1 font-semibold">
            {t.kind === "game_reward" ? games.find((g) => g.id === t.game_id)?.title : t.kind === "level_booster" ? `Level ${t.level_position} complete` : t.kind === "funding" ? "Added to the reward budget (simulated)" : "Handed over for the goal (simulated)"}
          </span>
          <span className="hidden text-muted-foreground sm:inline">{format(parseISO(t.created_at), "d MMM, HH:mm")}</span>
          <span className="font-mono font-extrabold">{t.kind === "redemption" ? "−" : "+"}{euro(t.amount_cents)}</span>
        </li>
      ))}
    </ul>
  );
}
