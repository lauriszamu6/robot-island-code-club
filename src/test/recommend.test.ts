import { describe, expect, it } from "vitest";
import { GAMES } from "@/lib/game-data";
import { nextChallenge, observations, recommend, type Ctx } from "@/lib/recommend";
import type { FeedbackRow } from "@/lib/insights-data";

const tags = Object.fromEntries(GAMES.map((g) => [g.id, [`level${g.level}`, g.def.kind]]));
const ctx = (done: string[]): Ctx => ({ games: GAMES, done: new Set(done), tags });
const fb = (game_id: string, fun: FeedbackRow["fun"], difficulty: FeedbackRow["difficulty"], hints_used = 0): FeedbackRow => ({ id: game_id + fun, game_id, fun, difficulty, hints_used, was_replay: false, submitted_at: "" });

describe("recommendations (Core 3)", () => {
  it("never point to locked levels", () => {
    for (const f of ["not_for_me", "okay", "loved"] as const)
      for (const d of ["too_easy", "just_right", "too_hard"] as const) {
        const r = recommend(ctx(["1-1"]), "1-1", f, d);
        if (r.game) expect(r.game.level).toBe(1);
      }
  });
  it("without feedback suggests the next open game and says why", () => {
    const r = nextChallenge(ctx(["1-1"]), []);
    expect(r.game?.id).toBe("1-2");
    expect(r.rule).toBe("No ratings yet");
  });
  it("too hard suggests a practice round", () => expect(recommend(ctx(["1-1"]), "1-1", "okay", "too_hard").mode).toBe("practice"));
  it("too easy suggests a harder variation of the same game", () => {
    const r = recommend(ctx(["1-1"]), "1-1", "loved", "too_easy");
    expect([r.mode, r.game?.id]).toEqual(["harder", "1-1"]);
  });
  it("uses the latest stored rating", () => expect(nextChallenge(ctx(["1-1"]), [fb("1-1", "okay", "too_easy")]).mode).toBe("harder"));
  it("observations count hints per objective", () => {
    const o = observations(GAMES, [], tags, [fb("1-1", "loved", "just_right", 2)], []);
    expect(o.hints[0]).toContain("2 hints");
  });
});
