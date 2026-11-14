import { describe, expect, it } from "vitest";
import { TOPUP_PRESETS_CENTS, validTopupCents } from "./topup";
describe("top-up rules", () => {
  it("offers €10, €25 and €50 presets", () => expect([...TOPUP_PRESETS_CENTS]).toEqual([1000, 2500, 5000]));
  it("rejects amounts under €5 or over €200", () => { expect(validTopupCents(499)).toBe(false); expect(validTopupCents(20001)).toBe(false); expect(validTopupCents(1250)).toBe(true); });
});
