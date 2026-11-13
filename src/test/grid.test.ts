import { describe, expect, it } from "vitest";
import { gameById, type GridDef } from "@/lib/game-data";
import { simulate } from "@/lib/grid-sim";
const d = (id: string) => gameById(id)!.def as GridDef;
describe("grid games are solvable and validated", () => {
  it("1-2 solves in 7 blocks with stars", () => {
    const p = [..."FFFRFFF"].map((t) => ({ t })) as never;
    expect(simulate(d("1-2"), p, "challenge").ok).toBe(true);
  });
  it("2-1 needs a repeat in challenge mode", () => {
    expect(simulate(d("2-1"), [{ t: "REP", n: 6, body: [{ t: "F" }] }], "challenge").ok).toBe(true);
    expect(simulate(d("2-1"), [..."FFFFFF"].map((t) => ({ t })) as never, "challenge").ok).toBe(false);
  });
  it("3-1 solves with a sensor loop", () => {
    expect(simulate(d("3-1"), [{ t: "REP", n: 20, body: [{ t: "IF", turn: "R" }] }], "challenge").ok).toBe(true);
  });
  it("5-1 initial program fails, fixed one passes", () => {
    const g = d("5-1");
    expect(simulate(g, g.initial!, "challenge").ok).toBe(false);
    expect(simulate(g, [g.initial![0]!, { t: "R" }, g.initial![2]!], "challenge").ok).toBe(true);
  });
});
