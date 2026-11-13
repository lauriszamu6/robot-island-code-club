// Core 2 data access: reward plan, savings goal and simulated wallet, all stored as integer cents.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Game, Level } from "./game-data";

export type RewardPlan = { id: string; per_game_cents: number; booster_cents: number; budget_cents: number; confirmed_at: string };
export type SavingsGoal = { id: string; name: string; target_cents: number; redeem_date: string; redeemed_at: string | null };
export type WalletTx = { id: string; kind: "funding" | "game_reward" | "level_booster" | "redemption"; amount_cents: number; game_id: string | null; level_position: number | null; created_at: string };
export type Wallet = { plan: RewardPlan | null; goal: SavingsGoal | null; txns: WalletTx[] };

export const walletQuery = (childId: string) => queryOptions({
  queryKey: ["wallet", childId],
  queryFn: async (): Promise<Wallet> => {
    const [p, g, t] = await Promise.all([
      supabase.from("reward_plans").select("id,per_game_cents,booster_cents,budget_cents,confirmed_at").eq("child_id", childId).maybeSingle(),
      supabase.from("savings_goals").select("id,name,target_cents,redeem_date,redeemed_at").eq("child_id", childId).maybeSingle(),
      supabase.from("wallet_transactions").select("id,kind,amount_cents,game_id,level_position,created_at").eq("child_id", childId).order("created_at"),
    ]);
    for (const r of [p, g, t]) if (r.error) throw r.error;
    return { plan: p.data as RewardPlan | null, goal: g.data as SavingsGoal | null, txns: (t.data ?? []) as WalletTx[] };
  },
});

export async function saveRewardPlan(childId: string, v: { perGame: number; booster: number; budget: number; goalName: string; goalTarget: number; redeemDate: string }) {
  const { error } = await supabase.rpc("save_reward_plan", {
    _child_id: childId, _per_game_cents: v.perGame, _booster_cents: v.booster, _budget_cents: v.budget,
    _goal_name: v.goalName, _goal_target_cents: v.goalTarget, _redeem_date: v.redeemDate,
  });
  if (error) throw new Error(error.message);
}
export async function redeemGoal(childId: string) {
  const { data, error } = await supabase.rpc("redeem_goal", { _child_id: childId });
  if (error) throw new Error(error.message);
  return data as { amount_cents: number };
}

export const maxCostCents = (perGame: number, booster: number, games = 15, levels = 5) => games * perGame + levels * booster;
export const euro = (cents: number) => `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
export const toCents = (euros: number) => Math.round(euros * 100);

/** Separates parent funds, the child's earned balance, and potential future rewards. */
export function summarize(w: Wallet, games: Game[], levels: Level[], done: Set<string>) {
  const sum = (k: WalletTx["kind"]) => w.txns.filter((t) => t.kind === k).reduce((a, t) => a + t.amount_cents, 0);
  const funded = sum("funding"), gameEarned = sum("game_reward"), boosterEarned = sum("level_booster"), redeemed = sum("redemption");
  const earned = gameEarned + boosterEarned;
  const parentAvailable = funded - earned;
  const gamesLeft = games.filter((g) => !done.has(g.id)).length;
  const levelsLeft = levels.filter((l) => !games.filter((g) => g.level === l.n).every((g) => done.has(g.id))).length;
  const potential = w.plan && !w.goal?.redeemed_at ? Math.min(parentAvailable, gamesLeft * w.plan.per_game_cents + levelsLeft * w.plan.booster_cents) : 0;
  return { funded, gameEarned, boosterEarned, earned, redeemed, parentAvailable, childBalance: earned - redeemed, potential };
}
export type WalletSummary = ReturnType<typeof summarize>;
