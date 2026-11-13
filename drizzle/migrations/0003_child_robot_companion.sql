ALTER TABLE public.child_profiles ADD COLUMN avatar jsonb;
COMMENT ON COLUMN public.child_profiles.avatar IS 'DiceBear Bottts companion: neutral random seed + chosen style options. Never personal data.';
ALTER TABLE public.child_profiles ADD CONSTRAINT child_avatar_shape CHECK (
  avatar IS NULL OR (jsonb_typeof(avatar) = 'object' AND avatar ? 'seed' AND (avatar->>'seed') ~ '^bot-[a-z0-9]{6,16}$' AND pg_column_size(avatar) < 2000)
);