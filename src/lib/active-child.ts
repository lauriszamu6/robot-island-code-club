import { useSyncExternalStore } from "react";
import { switchDemoScope } from "./demo-store";

// Which child profile is selected on this device. Only a UI selection: access is enforced by the database.
const KEY = "astrobit-active-child";
const ls = new Set<() => void>();
let current: string | null = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
if (current) switchDemoScope(current);

export function setActiveChild(id: string | null) {
  current = id;
  if (id) window.localStorage.setItem(KEY, id); else window.localStorage.removeItem(KEY);
  switchDemoScope(id);
  ls.forEach((l) => l());
}
export const useActiveChildId = () =>
  useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l); }, () => current, () => null);
