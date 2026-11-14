import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ verifyOtp: vi.fn(), getUser: vi.fn(), resend: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
import { resendSignupCode, verifySignupCode } from "@/lib/signup-verification";

describe("Signup-only email verification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.verifyOtp.mockResolvedValue({ error: null });
    auth.getUser.mockResolvedValue({ data: { user: { email: "adult@example.test", email_confirmed_at: "2026-11-14" } }, error: null });
  });
  it("verifies signup codes rather than passwordless sign-in codes", async () => {
    await verifySignupCode("adult@example.test", "123456");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: "adult@example.test", token: "123456", type: "signup" });
  });
  it("rejects an expired or wrong code", async () => {
    auth.verifyOtp.mockResolvedValue({ error: { message: "expired" } });
    await expect(verifySignupCode("adult@example.test", "123456")).rejects.toThrow("invalid or has expired");
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it("does not grant access to an unconfirmed account", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { email: "adult@example.test", email_confirmed_at: null } }, error: null });
    await expect(verifySignupCode("adult@example.test", "123456")).rejects.toThrow("couldn't confirm");
  });
  it("does not grant access to a different account", async () => {
    await expect(verifySignupCode("another@example.test", "123456")).rejects.toThrow("couldn't confirm");
  });
  it("resends only signup verification emails", async () => {
    auth.resend.mockResolvedValue({ error: null });
    await resendSignupCode("adult@example.test");
    expect(auth.resend).toHaveBeenCalledWith({ type: "signup", email: "adult@example.test", options: { emailRedirectTo: window.location.origin } });
  });
});