CREATE TABLE public.adult_verifications (
  adult_id uuid PRIMARY KEY,
  session_id text,
  status text NOT NULL DEFAULT 'Not Started',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.adult_verifications TO authenticated;
GRANT ALL ON public.adult_verifications TO service_role;
ALTER TABLE public.adult_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adults read own verification" ON public.adult_verifications FOR SELECT TO authenticated USING (adult_id = auth.uid());