import { describe, expect, it } from "vitest";
import { companionUrl, parseCompanion, surprise } from "@/lib/companion";

describe("robot companion", () => {
  it("surprise uses a neutral bot- seed", () => expect(surprise().seed).toMatch(/^bot-[a-z0-9]{6,16}$/));
  it("API URL contains only the seed and style options", () => {
    const c = surprise();
    const u = new URL(companionUrl(c));
    expect(u.host).toBe("api.dicebear.com");
    expect([...u.searchParams.keys()].every((k) => k === "seed" || k.endsWith("Variant") || k.endsWith("Color") || k.endsWith("Probability") || k === "borderRadius")).toBe(true);
  });
  it("rejects a seed that is not neutral", () => expect(parseCompanion({ ...surprise(), seed: "Mia" })).toBeNull());
  it("rejects colours outside the palette", () => expect(parseCompanion({ ...surprise(), base: "FF00FF" })).toBeNull());
  it("round-trips a valid companion", () => { const c = surprise(); expect(parseCompanion(c)).toEqual(c); });
});
