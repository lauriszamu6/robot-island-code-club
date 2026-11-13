import { describe, expect, it } from "vitest";
import { applyCompletion, applyRedemption, defaultState, earnedBy, earnedTotal, isLevelUnlocked, maxCost, validatePlan, type DemoState } from "@/lib/rewards";
import { recommend } from "@/lib/recommend";

const withPlan = (): DemoState => ({
  ...defaultState(),
  plan: { perGame: 2, booster: 5, budget: 55, goalName: "Bike", goalTarget: 50, redeemDate: "2030-01-01", confirmedAt: "x" },
});
const complete = (s: DemoState, ids: string[]) => ids.reduce((acc, id) => applyCompletion(acc, id).state, s);

describe("rewards", () => {
  it("max cost is 15 × per game + 5 × booster (€2 + €5 → €55)", () => {
    expect(maxCost(2, 5)).toBe(55);
  });
  it("awards a game reward only on first completion", () => {
    const s = complete(withPlan(), ["1-1", "1-1", "1-1"]);
    expect(earnedTotal(s)).toBe(2);
    expect(s.replays["1-1"]).toBe(2);
  });
  it("awards the level booster once, after all three games", () => {
    let s = complete(withPlan(), ["1-1", "1-2"]);
    expect(earnedBy(s, "booster")).toBe(0);
    s = complete(s, ["1-3", "1-3", "1-1"]);
    expect(earnedBy(s, "booster")).toBe(5);
    expect(earnedTotal(s)).toBe(11);
  });
  it("completing level two takes six games and unlocks level three", () => {
    const s = complete(withPlan(), ["1-1", "1-2", "1-3", "2-1", "2-2"]);
    expect(isLevelUnlocked(s, 3)).toBe(false);
    expect(isLevelUnlocked(complete(s, ["2-3"]), 3)).toBe(true);
  });
  it("cannot complete a game in a locked level", () => {
    const s = complete(withPlan(), ["2-1"]);
    expect(s.completed["2-1"]).toBeUndefined();
  });
  it("rejects a budget below the maximum cost", () => {
    const p = { ...withPlan().plan!, budget: 54 };
    expect(validatePlan(defaultState(), p, "2026-01-01").length).toBeGreaterThan(0);
  });
  it("rejects lowering rewards after money was earned", () => {
    const s = complete(withPlan(), ["1-1"]);
    expect(validatePlan(s, { ...s.plan!, perGame: 1 }, "2026-01-01").join()).toMatch(/can't go below/);
  });
  it("redemption only on/after the date and only once", () => {
    const s = complete(withPlan(), ["1-1"]);
    expect(applyRedemption(s, "n", "2029-12-31").redemption).toBeNull();
    const r = applyRedemption(s, "n", "2030-01-01");
    expect(r.redemption?.amount).toBe(2);
    expect(applyRedemption(r, "n2", "2030-02-01")).toBe(r);
  });
  it("recommendations never point to locked levels", () => {
    const s = complete(withPlan(), ["1-1"]);
    for (const fun of ["not", "okay", "loved"] as const)
      for (const d of ["easy", "right", "hard"] as const) {
        const r = recommend(s, "1-1", fun, d);
        if (r.game) expect(r.game.level).toBe(1);
      }
  });
});

import { levelState, nextOpenGame, suggestedDifficulty } from "@/lib/adventure-data";
import { GAMES } from "@/lib/game-data";
describe("adventure progression (Core 1)", () => {
  it("level 2 unlocks only after all three level-1 games", () => {
    expect(levelState(GAMES, new Set(["1-1", "1-2"]), 2)).toBe("locked");
    expect(levelState(GAMES, new Set(["1-1", "1-2", "1-3"]), 2)).toBe("available");
    expect(levelState(GAMES, new Set(["1-1", "1-2", "1-3"]), 1)).toBe("completed");
  });
  it("next game skips completed and locked games", () => {
    expect(nextOpenGame(GAMES, new Set(["1-1"]))?.id).toBe("1-2");
  });
  it("age 10–12 suggests gentle, 13–15 suggests challenge", () => {
    expect(suggestedDifficulty("10-12")).toBe("gentle");
    expect(suggestedDifficulty("13-15")).toBe("challenge");
  });
});
