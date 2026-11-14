import { useEffect, useState } from "react";
import { MailCheck, RefreshCw } from "lucide-react";
import { BigButton } from "@/components/game/Controls";
import { Button } from "@/components/ui/button";
import { resendSignupCode, verifySignupCode } from "@/lib/signup-verification";

export function SignupVerification({ email, onVerified, onBack }: { email: string; onVerified: () => void | Promise<void>; onBack: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(60);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage(null);
    try {
      await verifySignupCode(email, code.trim());
      await onVerified();
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : "Verification didn't work. Please try again." });
    } finally { setBusy(false); }
  };
  const resend = async () => {
    setBusy(true); setMessage(null);
    try {
      await resendSignupCode(email);
      setRemaining(60);
      setMessage({ error: false, text: "A new verification email is on its way. Check your inbox and spam folder." });
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : "Please try again later." });
    } finally { setBusy(false); }
  };

  return <div className="mt-4 space-y-4">
    <p className="break-words text-center text-sm">Check your inbox for <strong>{email}</strong>.</p>
    <form onSubmit={verify} className="space-y-3">
      <label className="block font-bold">Verification code
        <input autoFocus required type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" minLength={6} maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-xl border-2 border-navy bg-card px-3 py-3 text-center font-mono text-2xl focus:outline-none focus:ring-4 focus:ring-teal/40" />
      </label>
      {message && <p role={message.error ? "alert" : "status"} className={message.error ? "rounded-lg bg-coral/15 p-2 text-sm font-bold text-destructive" : "rounded-lg bg-mint p-2 text-sm font-bold"}>{message.text}</p>}
      <BigButton type="submit" disabled={busy} className="w-full"><MailCheck />{busy ? "Please wait…" : "Verify email"}</BigButton>
    </form>
    <Button variant="link" disabled={busy || remaining > 0} onClick={resend} className="w-full"><RefreshCw />{remaining > 0 ? `Resend email in ${remaining}s` : "Resend verification email"}</Button>
    <Button variant="link" disabled={busy} onClick={onBack} className="w-full">Back to sign in</Button>
  </div>;
}