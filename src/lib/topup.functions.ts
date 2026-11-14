import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { validTopupCents } from "@/lib/topup";

type Result = { clientSecret: string } | { error: string };
const UUID = /^[0-9a-f-]{36}$/i;

async function resolveOrCreateCustomer(stripe: Stripe, options: { email?: string; userId: string }): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({ ...(options.email ? { email: options.email } : {}), metadata: { userId: options.userId } });
  return created.id;
}

/** Adult-only: starts a card top-up for one of the caller's own children's reward wallets. */
export const createTopupCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { childId: string; amountCents: number; returnUrl: string; environment: StripeEnv }) => {
    if (!UUID.test(d.childId)) throw new Error("Invalid child");
    if (!validTopupCents(d.amountCents)) throw new Error("Top-ups must be between €5 and €200.");
    if (d.environment !== "sandbox" && d.environment !== "live") throw new Error("Invalid environment");
    return d;
  })
  .handler(async ({ data, context }): Promise<Result> => {
    const { data: child } = await context.supabase.from("child_profiles").select("id,nickname").eq("id", data.childId).maybeSingle();
    if (!child) return { error: "Child profile not found." };
    const origin = new URL(data.returnUrl).origin;
    try {
      const stripe = createStripeClient(data.environment);
      const { data: { user } } = await context.supabase.auth.getUser();
      const customerId = await resolveOrCreateCustomer(stripe, { userId: context.userId, ...(user?.email ? { email: user.email } : {}) });
      const name = "Astrobit reward wallet top-up";
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price_data: { currency: "eur", unit_amount: data.amountCents, product_data: { name, tax_code: "txcd_10000000" } }, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: `${origin}/adult?topup={CHECKOUT_SESSION_ID}`,
        customer: customerId,
        payment_intent_data: { description: name },
        managed_payments: { enabled: true },
        metadata: { kind: "wallet_topup", userId: context.userId, childId: child.id, amountCents: String(data.amountCents), managed_payments: "true" },
      } as Stripe.Checkout.SessionCreateParams);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
