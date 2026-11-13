import { useSyncExternalStore } from "react";
import { defaultState, type DemoState } from "./rewards";

// Local per-child UI preferences only (role view switch); all core data lives in the database.
let KEY = "astrobit-demo-v1";
let state: DemoState = defaultState();
const listeners = new Set<() => void>();
const SERVER = defaultState();

function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    state = defaultState();
  }
}
if (typeof window !== "undefined") {
  load();
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) { load(); listeners.forEach((l) => l()); }
  });
}

export function switchDemoScope(childId: string | null) {
  KEY = childId ? `astrobit-demo-v1:${childId}` : "astrobit-demo-v1";
  if (typeof window !== "undefined") { load(); listeners.forEach((l) => l()); }
}
export const getDemo = () => state;
export function setDemo(fn: (s: DemoState) => DemoState) {
  state = fn(state);
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}
export function resetDemo() { setDemo(() => defaultState()); }

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const useDemo = () => useSyncExternalStore(subscribe, getDemo, () => SERVER);
export const useIsClient = () => useSyncExternalStore(() => () => {}, () => true, () => false);
export const todayISO = () => new Date().toISOString().slice(0, 10);
