import { supabase } from "@/integrations/supabase/client";

export function isVerificationCode(code: string) {
  return /^\d{6,8}$/.test(code);
}

export async function verifySignupCode(email: string, token: string) {
  if (!isVerificationCode(token)) throw new Error("Enter the code from your email.");
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
  if (error) throw new Error("That code is invalid or has expired. Try again or request a new code.");
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user?.email_confirmed_at || data.user.email?.toLowerCase() !== email.toLowerCase()) {
    throw new Error("We couldn't confirm your account. Please try again.");
  }
}

export async function resendSignupCode(email: string) {
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw new Error("We couldn't resend your email yet. Please wait a minute and try again.");
}