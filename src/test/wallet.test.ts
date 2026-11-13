import { describe, expect, it } from "vitest";
import { euro, maxCostCents, summarize, type Wallet } from "@/lib/wallet-data";
import { GAMES, LEVELS } from "@/lib/game-data";

const plan = { id: "p", per_game_cents: 200, booster_cents: 500, budget_cents: 5500, confirmed_at: "" };
const tx = (kind: Wallet["txns"][number]["kind"], amount_cents: number) => ({ id: kind + amount_cents + Math.random(), kind, amount_cents, game_id: null, level_position: null, created_at: "" });

describe("wallet", () => {
  it("max commitment for €2 per game and €5 booster is €55", () => expect(maxCostCents(200, 500)).toBe(5500));
  it("formats cents as euros", () => { expect(euro(5500)).toBe("€55"); expect(euro(250)).toBe("€2.50"); });
  it("separates parent funds, child balance and potential rewards", () => {
    const done = new Set(GAMES.filter((g) => g.level === 1).map((g) => g.id));
    const w: Wallet = { plan, goal: null, txns: [tx("funding", 5500), tx("game_reward", 200), tx("game_reward", 200), tx("game_reward", 200), tx("level_booster", 500)] };
    const s = summarize(w, GAMES, LEVELS, done);
    expect(s.earned).toBe(1100);
    expect(s.parentAvailable).toBe(4400);
    expect(s.childBalance).toBe(1100);
    expect(s.potential).toBe(12 * 200 + 4 * 500);
  });
  it("redemption empties the child balance", () => {
    const w: Wallet = { plan, goal: null, txns: [tx("funding", 5500), tx("game_reward", 200), tx("redemption", 200)] };
    expect(summarize(w, GAMES, LEVELS, new Set()).childBalance).toBe(0);
  });
});
