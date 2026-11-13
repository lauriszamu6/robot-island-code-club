CREATE TABLE public.reward_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL UNIQUE REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  per_game_cents int NOT NULL CHECK (per_game_cents > 0),
  booster_cents int NOT NULL CHECK (booster_cents >= 0),
  budget_cents int NOT NULL CHECK (budget_cents >= 0),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reward_plans TO authenticated;
GRANT ALL ON public.reward_plans TO service_role;
ALTER TABLE public.reward_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adults read own children's plans" ON public.reward_plans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.child_profiles c WHERE c.id = child_id AND c.adult_id = auth.uid()));

CREATE TABLE public.savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL UNIQUE REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 40),
  target_cents int NOT NULL CHECK (target_cents > 0),
  redeem_date date NOT NULL,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.savings_goals TO authenticated;
GRANT ALL ON public.savings_goals TO service_role;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adults read own children's goals" ON public.savings_goals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.child_profiles c WHERE c.id = child_id AND c.adult_id = auth.uid()));

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.reward_plans(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('funding','game_reward','level_booster','redemption')),
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  game_id text REFERENCES public.games(id),
  level_position int REFERENCES public.levels(position),
  goal_id uuid REFERENCES public.savings_goals(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wallet_tx_child_idx ON public.wallet_transactions(child_id, created_at);
CREATE UNIQUE INDEX wallet_one_game_reward ON public.wallet_transactions(child_id, game_id) WHERE kind = 'game_reward';
CREATE UNIQUE INDEX wallet_one_level_booster ON public.wallet_transactions(child_id, level_position) WHERE kind = 'level_booster';
CREATE UNIQUE INDEX wallet_one_redemption ON public.wallet_transactions(child_id) WHERE kind = 'redemption';
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adults read own children's transactions" ON public.wallet_transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.child_profiles c WHERE c.id = child_id AND c.adult_id = auth.uid()));

CREATE OR REPLACE FUNCTION public._assert_own_child(_child_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM child_profiles WHERE id = _child_id AND adult_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public._assert_own_child(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_reward_plan(_child_id uuid, _per_game_cents int, _booster_cents int, _budget_cents int,
  _goal_name text, _goal_target_cents int, _redeem_date date) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _old reward_plans; _plan_id uuid; _games int; _levels int; _max int; _earned int; _funded int;
BEGIN
  PERFORM _assert_own_child(_child_id);
  SELECT count(*) INTO _games FROM games;
  SELECT count(*) INTO _levels FROM levels;
  _max := _games * _per_game_cents + _levels * _booster_cents;
  IF _per_game_cents IS NULL OR _per_game_cents <= 0 THEN RAISE EXCEPTION 'Choose a reward per game.'; END IF;
  IF _booster_cents IS NULL OR _booster_cents < 0 THEN RAISE EXCEPTION 'Booster cannot be negative.'; END IF;
  IF _budget_cents < _max THEN RAISE EXCEPTION 'Budget must cover the maximum cost of % cents.', _max; END IF;
  IF _goal_name IS NULL OR btrim(_goal_name) = '' THEN RAISE EXCEPTION 'Add the goal name.'; END IF;
  IF _goal_target_cents IS NULL OR _goal_target_cents <= 0 THEN RAISE EXCEPTION 'Add a target amount.'; END IF;
  IF _redeem_date IS NULL OR _redeem_date <= current_date THEN RAISE EXCEPTION 'Pick a redemption date in the future.'; END IF;
  IF EXISTS (SELECT 1 FROM wallet_transactions WHERE child_id = _child_id AND kind = 'redemption') THEN
    RAISE EXCEPTION 'This plan has already been redeemed.';
  END IF;

  SELECT * INTO _old FROM reward_plans WHERE child_id = _child_id FOR UPDATE;
  SELECT coalesce(sum(amount_cents),0) INTO _earned FROM wallet_transactions WHERE child_id = _child_id AND kind IN ('game_reward','level_booster');
  IF _old.id IS NOT NULL THEN
    IF _earned > 0 AND (_per_game_cents < _old.per_game_cents OR _booster_cents < _old.booster_cents) THEN
      RAISE EXCEPTION 'Rewards cannot be lowered after money has been earned.';
    END IF;
    IF _budget_cents < _old.budget_cents THEN RAISE EXCEPTION 'The funded budget cannot be reduced.'; END IF;
    UPDATE reward_plans SET per_game_cents = _per_game_cents, booster_cents = _booster_cents, budget_cents = _budget_cents, updated_at = now() WHERE id = _old.id;
    _plan_id := _old.id;
  ELSE
    INSERT INTO reward_plans (child_id, per_game_cents, booster_cents, budget_cents) VALUES (_child_id, _per_game_cents, _booster_cents, _budget_cents) RETURNING id INTO _plan_id;
  END IF;

  SELECT coalesce(sum(amount_cents),0) INTO _funded FROM wallet_transactions WHERE child_id = _child_id AND kind = 'funding';
  IF _budget_cents > _funded THEN
    INSERT INTO wallet_transactions (child_id, plan_id, kind, amount_cents) VALUES (_child_id, _plan_id, 'funding', _budget_cents - _funded);
  END IF;

  INSERT INTO savings_goals (child_id, name, target_cents, redeem_date) VALUES (_child_id, btrim(_goal_name), _goal_target_cents, _redeem_date)
  ON CONFLICT (child_id) DO UPDATE SET name = excluded.name, target_cents = excluded.target_cents, redeem_date = excluded.redeem_date;
  RETURN jsonb_build_object('plan_id', _plan_id, 'max_cost_cents', _max);
END $$;
REVOKE ALL ON FUNCTION public.save_reward_plan(uuid,int,int,int,text,int,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_reward_plan(uuid,int,int,int,text,int,date) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_goal(_child_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _goal savings_goals; _earned int; _plan uuid;
BEGIN
  PERFORM _assert_own_child(_child_id);
  SELECT * INTO _goal FROM savings_goals WHERE child_id = _child_id FOR UPDATE;
  IF _goal.id IS NULL THEN RAISE EXCEPTION 'No savings goal yet.'; END IF;
  IF _goal.redeemed_at IS NOT NULL THEN RAISE EXCEPTION 'Already redeemed.'; END IF;
  IF current_date < _goal.redeem_date THEN RAISE EXCEPTION 'Redemption opens on %.', _goal.redeem_date; END IF;
  SELECT coalesce(sum(amount_cents),0) INTO _earned FROM wallet_transactions WHERE child_id = _child_id AND kind IN ('game_reward','level_booster');
  IF _earned <= 0 THEN RAISE EXCEPTION 'Nothing earned yet.'; END IF;
  SELECT id INTO _plan FROM reward_plans WHERE child_id = _child_id;
  INSERT INTO wallet_transactions (child_id, plan_id, kind, amount_cents, goal_id) VALUES (_child_id, _plan, 'redemption', _earned, _goal.id);
  UPDATE savings_goals SET redeemed_at = now() WHERE id = _goal.id;
  RETURN jsonb_build_object('amount_cents', _earned);
END $$;
REVOKE ALL ON FUNCTION public.redeem_goal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_goal(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_game_attempt(_child_id uuid, _game_id text, _success boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _level int; _prev_open boolean; _row public.game_progress;
  _first boolean := false; _level_done boolean := false;
  _plan reward_plans; _remaining int; _game_reward int := 0; _booster int := 0; _n int;
BEGIN
  PERFORM _assert_own_child(_child_id);
  SELECT level_position INTO _level FROM games WHERE id = _game_id;
  IF _level IS NULL THEN RAISE EXCEPTION 'Unknown game'; END IF;
  SELECT NOT EXISTS (
    SELECT 1 FROM games g LEFT JOIN game_progress p ON p.game_id = g.id AND p.child_id = _child_id
    WHERE g.level_position = _level - 1 AND (p.status IS DISTINCT FROM 'completed')
  ) INTO _prev_open;
  IF NOT _prev_open THEN RAISE EXCEPTION 'Level locked' USING ERRCODE = '42501'; END IF;

  INSERT INTO game_progress (child_id, game_id, attempts) VALUES (_child_id, _game_id, 0)
  ON CONFLICT (child_id, game_id) DO NOTHING;
  SELECT * INTO _row FROM game_progress WHERE child_id = _child_id AND game_id = _game_id FOR UPDATE;

  IF _success AND _row.status <> 'completed' THEN
    _first := true;
    UPDATE game_progress SET attempts = attempts + 1, status = 'completed', completed_at = now(), updated_at = now() WHERE id = _row.id;
    SELECT NOT EXISTS (
      SELECT 1 FROM games g LEFT JOIN game_progress p ON p.game_id = g.id AND p.child_id = _child_id
      WHERE g.level_position = _level AND (p.status IS DISTINCT FROM 'completed')
    ) INTO _level_done;

    SELECT * INTO _plan FROM reward_plans WHERE child_id = _child_id;
    IF _plan.id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM wallet_transactions WHERE child_id = _child_id AND kind = 'redemption') THEN
      SELECT coalesce(sum(CASE WHEN kind = 'funding' THEN amount_cents WHEN kind IN ('game_reward','level_booster') THEN -amount_cents ELSE 0 END),0)
        INTO _remaining FROM wallet_transactions WHERE child_id = _child_id;
      _game_reward := least(_plan.per_game_cents, greatest(_remaining, 0));
      IF _game_reward > 0 THEN
        INSERT INTO wallet_transactions (child_id, plan_id, kind, amount_cents, game_id, level_position)
        VALUES (_child_id, _plan.id, 'game_reward', _game_reward, _game_id, _level) ON CONFLICT DO NOTHING;
        GET DIAGNOSTICS _n = ROW_COUNT; IF _n = 0 THEN _game_reward := 0; END IF;
      END IF;
      IF _level_done THEN
        _booster := least(_plan.booster_cents, greatest(_remaining - _game_reward, 0));
        IF _booster > 0 THEN
          INSERT INTO wallet_transactions (child_id, plan_id, kind, amount_cents, level_position)
          VALUES (_child_id, _plan.id, 'level_booster', _booster, _level) ON CONFLICT DO NOTHING;
          GET DIAGNOSTICS _n = ROW_COUNT; IF _n = 0 THEN _booster := 0; END IF;
        END IF;
      END IF;
    END IF;
  ELSIF _success THEN
    UPDATE game_progress SET attempts = attempts + 1, replays = replays + 1, updated_at = now() WHERE id = _row.id;
  ELSE
    UPDATE game_progress SET attempts = attempts + 1, updated_at = now() WHERE id = _row.id;
  END IF;
  RETURN jsonb_build_object('first_completion', _first, 'level_completed', CASE WHEN _level_done THEN _level ELSE NULL END,
    'game_reward_cents', _game_reward, 'booster_cents', _booster);
END $$;
REVOKE ALL ON FUNCTION public.record_game_attempt(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_game_attempt(uuid, text, boolean) TO authenticated;