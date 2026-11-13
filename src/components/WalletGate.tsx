import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AdventureGate, ErrorState, type Adventure } from "./AdventureGate";
import { Loading } from "./AppShell";
import { summarize, walletQuery, type Wallet, type WalletSummary } from "@/lib/wallet-data";

export type WithWallet = Adventure & { wallet: Wallet; sum: WalletSummary };

function Inner({ a, children }: { a: Adventure; children: (x: WithWallet) => ReactNode }) {
  const q = useQuery(walletQuery(a.child.id));
  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorState onRetry={() => q.refetch()} />;
  return <>{children({ ...a, wallet: q.data, sum: summarize(q.data, a.content.games, a.content.levels, a.done) })}</>;
}

/** Adventure data + the child's stored wallet, with loading and error states. */
export function WalletGate({ children }: { children: (x: WithWallet) => ReactNode }) {
  return <AdventureGate>{(a) => <Inner a={a}>{children}</Inner>}</AdventureGate>;
}
