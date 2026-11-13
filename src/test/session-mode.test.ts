import { describe, expect, it } from "vitest";
import { isFreshSignIn } from "@/lib/session-mode";

describe("adult re-authentication", () => {
  const now = Date.parse("2026-11-13T12:00:00Z");
  it("accepts a sign-in from 2 minutes ago", () => expect(isFreshSignIn("2026-11-13T11:58:00Z", now)).toBe(true));
  it("rejects a sign-in from 10 minutes ago", () => expect(isFreshSignIn("2026-11-13T11:50:00Z", now)).toBe(false));
  it("rejects a missing sign-in time", () => expect(isFreshSignIn(null, now)).toBe(false));
});
