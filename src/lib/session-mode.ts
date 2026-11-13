// Which side of the device is in use: the signed-in adult, or a child playing on the adult's account.
// Child mode locks adult pages until the adult re-enters their password (or re-signs in with Google).
// This is a hand-off lock on a shared device; data access is still enforced by the backend per adult.
import { useSyncExternalStore } from "react";

export type Mode = "adult" | "child";
const KEY = "astrobit-mode";
const listeners = new Set<() => void>();
let mode: Mode = "adult";
if (typeof window !== "undefined") {
  try { mode = window.localStorage.getItem(KEY) === "child" ? "child" : "adult"; } catch { /* ignore */ }
  window.addEventListener("storage", (e) => { if (e.key === KEY) { mode = e.newValue === "child" ? "child" : "adult"; listeners.forEach((l) => l()); } });
}
export const getMode = () => mode;
export function setMode(m: Mode) {
  mode = m;
  try { window.localStorage.setItem(KEY, m); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}
const sub = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const useMode = () => useSyncExternalStore(sub, getMode, () => "adult" as Mode);

/** A sign-in counts as a fresh re-authentication if it happened within the last few minutes. */
export const isFreshSignIn = (lastSignInAt: string | null | undefined, now = Date.now(), windowMs = 5 * 60_000) =>
  !!lastSignInAt && now - new Date(lastSignInAt).getTime() <= windowMs;
