// Pure reward / progression rules. Parents fund every euro; the company funds none.
import { GAMES, LEVELS, gamesForLevel, type AgeBand, type Difficulty } from "./game-data";

export const TOTAL_GAMES = GAMES.length; // 15
export const TOTAL_LEVELS = LEVELS.length; // 5

export type Plan = {
  perGame: number;
  booster: number;
  budget: number;
  goalName: string;
  goalTarget: number;
  redeemDate: string; // yyyy-mm-dd
  confirmedAt: string;
};

export type Txn = {
  id: string; // deterministic: "game:1-2" or "level:1" → prevents duplicates
  type: "game" | "booster";
  amount: number;
  ref: string;
  at: string;
};

export type Feedback = {
  gameId: string;
  fun: "not" | "okay" | "loved";
  difficulty: "easy" | "right" | "hard";
  replay: boolean;
  at: string;
};

export type DemoState = {
  version: 1;
  role: "child" | "adult" | null;
  childName: string;
  ageBand: AgeBand | null;
  difficulty: Difficulty;
  plan: Plan | null;
  completed: Record<string, string>;
  transactions: Txn[];
  feedback: Feedback[];
  hints: Record<string, number>;
  runs: Record<string, { runs: number; fails: number }>;
  replays: Record<string, number>;
  redemption: { at: string; amount: number } | null;
};

export const defaultState = (): DemoState => ({
  version: 1,
  role: null,
  childName: "",
  ageBand: null,
  difficulty: "gentle",
  plan: null,
  completed: {},
  transactions: [],
  feedback: [],
  hints: {},
  runs: {},
  replays: {},
  redemption: null,
});

export const maxCost = (perGame: number, booster: number) =>
  TOTAL_GAMES * perGame + TOTAL_LEVELS * booster;

export const earnedTotal = (s: DemoState) => s.transactions.reduce((a, t) => a + t.amount, 0);
export const earnedBy = (s: DemoState, type: Txn["type"]) =>
  s.transactions.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0);

export const isLevelComplete = (s: DemoState, n: number) =>
  gamesForLevel(n).every((g) => !!s.completed[g.id]);

export const isLevelUnlocked = (s: DemoState, n: number) => n === 1 || isLevelComplete(s, n - 1);

export const levelStatus = (s: DemoState, n: number): "locked" | "available" | "completed" =>
  isLevelComplete(s, n) ? "completed" : isLevelUnlocked(s, n) ? "available" : "locked";

export const completedCount = (s: DemoState) => Object.keys(s.completed).length;

/** Earned money still available to earn from the current plan (never negative). */
export const remainingToEarn = (s: DemoState) => {
  if (!s.plan) return 0;
  const gamesLeft = GAMES.filter((g) => !s.completed[g.id]).length;
  const levelsLeft = LEVELS.filter((l) => !isLevelComplete(s, l.n)).length;
  return gamesLeft * s.plan.perGame + levelsLeft * s.plan.booster;
};

export type CompletionResult = {
  firstTime: boolean;
  gameReward: number;
  booster: number;
  levelCompleted: number | null;
};

/**
 * Record a validated game completion. Rewards are only granted on the first success
 * of each game, and a level booster only once, when all three games are complete.
 * Idempotent: calling twice (replay, refresh, double-click) never duplicates money.
 */
export function applyCompletion(
  s: DemoState,
  gameId: string,
  now: string = new Date().toISOString(),
): { state: DemoState; result: CompletionResult } {
  const game = GAMES.find((g) => g.id === gameId);
  if (!game) throw new Error(`Unknown game ${gameId}`);
  if (!isLevelUnlocked(s, game.level)) {
    return { state: s, result: { firstTime: false, gameReward: 0, booster: 0, levelCompleted: null } };
  }
  if (s.completed[gameId]) {
    return {
      state: { ...s, replays: { ...s.replays, [gameId]: (s.replays[gameId] ?? 0) + 1 } },
      result: { firstTime: false, gameReward: 0, booster: 0, levelCompleted: null },
    };
  }
  const next: DemoState = { ...s, completed: { ...s.completed, [gameId]: now }, transactions: [...s.transactions] };
  const has = (id: string) => next.transactions.some((t) => t.id === id);
  const funded = s.plan ? s.plan.budget - earnedTotal(s) : 0;
  let gameReward = 0;
  let booster = 0;
  if (s.plan && !has(`game:${gameId}`)) {
    gameReward = Math.min(s.plan.perGame, Math.max(0, funded));
    if (gameReward > 0) next.transactions.push({ id: `game:${gameId}`, type: "game", amount: gameReward, ref: gameId, at: now });
  }
  let levelCompleted: number | null = null;
  if (isLevelComplete(next, game.level)) {
    levelCompleted = game.level;
    const id = `level:${game.level}`;
    if (s.plan && !has(id)) {
      booster = Math.min(s.plan.booster, Math.max(0, funded - gameReward));
      if (booster > 0) next.transactions.push({ id, type: "booster", amount: booster, ref: String(game.level), at: now });
    }
  }
  return { state: next, result: { firstTime: true, gameReward, booster, levelCompleted } };
}

/** Plan edits may never lower rewards once money has been earned. */
export function validatePlan(s: DemoState, p: Omit<Plan, "confirmedAt">, today: string): string[] {
  const errors: string[] = [];
  if (!(p.perGame > 0)) errors.push("Choose a reward per game.");
  if (p.booster < 0) errors.push("Booster can't be negative.");
  if (p.budget < maxCost(p.perGame, p.booster))
    errors.push(`Budget must cover the maximum cost of €${maxCost(p.perGame, p.booster)}.`);
  if (!p.goalName.trim()) errors.push("Add the child's goal.");
  if (!(p.goalTarget > 0)) errors.push("Add a target amount.");
  if (!p.redeemDate || p.redeemDate <= today) errors.push("Pick a redemption date in the future.");
  if (s.plan && s.transactions.length > 0) {
    if (p.perGame < s.plan.perGame) errors.push(`Reward per game can't go below €${s.plan.perGame} after rewards were earned.`);
    if (p.booster < s.plan.booster) errors.push(`Booster can't go below €${s.plan.booster} after rewards were earned.`);
  }
  return errors;
}

export const canRedeem = (s: DemoState, today: string) =>
  !!s.plan && !s.redemption && earnedTotal(s) > 0 && today >= s.plan.redeemDate;

export function applyRedemption(s: DemoState, now: string, today: string): DemoState {
  if (!canRedeem(s, today)) return s;
  return { ...s, redemption: { at: now, amount: earnedTotal(s) } };
}

export const ageDefaultDifficulty = (band: AgeBand): Difficulty => (band === "8-10" ? "gentle" : "challenge");
export const eur = (n: number) => `€${Number.isInteger(n) ? n : n.toFixed(2)}`;
