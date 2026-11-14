ALTER TABLE public.wallet_transactions ADD COLUMN stripe_session_id text;
ALTER TABLE public.wallet_transactions ADD COLUMN payment_env text CHECK (payment_env IN ('sandbox','live'));
CREATE UNIQUE INDEX wallet_one_topup_per_session ON public.wallet_transactions(stripe_session_id) WHERE stripe_session_id IS NOT NULL;