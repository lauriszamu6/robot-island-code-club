import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

// Credits a paid wallet top-up exactly once (unique stripe_session_id).
async function creditTopup(session: any, env: StripeEnv) {
  const m = session.metadata ?? {};
  if (m.kind !== "wallet_topup" || !m.childId || !m.userId) return;
  const amount = Number(session.amount_subtotal ?? m.amountCents);
  if (!Number.isInteger(amount) || amount <= 0) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: child } = await supabaseAdmin.from("child_profiles").select("id").eq("id", m.childId).eq("adult_id", m.userId).maybeSingle();
  if (!child) { console.error("Top-up child mismatch", session.id); return; }
  const { data: plan } = await supabaseAdmin.from("reward_plans").select("id").eq("child_id", child.id).maybeSingle();
  const { error } = await supabaseAdmin.from("wallet_transactions").insert({
    child_id: child.id, plan_id: plan?.id ?? null, kind: "funding", amount_cents: amount, stripe_session_id: session.id, payment_env: env,
  });
  if (error && error.code !== "23505") throw error;
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        try {
          const event = await verifyWebhook(request, rawEnv);
          const s = event.data.object;
          if (event.type === "checkout.session.completed" && s.payment_status !== "unpaid") await creditTopup(s, rawEnv);
          else if (event.type === "checkout.session.async_payment_succeeded") await creditTopup(s, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
