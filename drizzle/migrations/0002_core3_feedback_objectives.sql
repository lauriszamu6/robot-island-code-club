CREATE TABLE public.learning_objectives (
  code text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL
);
GRANT SELECT ON public.learning_objectives TO authenticated;
GRANT ALL ON public.learning_objectives TO service_role;
ALTER TABLE public.learning_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in families read objectives" ON public.learning_objectives FOR SELECT TO authenticated USING (true);

INSERT INTO public.learning_objectives (code, title, description) VALUES
 ('sequencing','Step-by-step order','Puts instructions in the order a computer must follow them.'),
 ('repetition','Repeating with loops','Spots repeated steps and replaces them with a loop.'),
 ('decisions','Making decisions','Uses if/else conditions to react to different situations.'),
 ('variables','Remembering values','Stores and updates information in variables.'),
 ('debugging','Finding and fixing bugs','Tests a program, finds what is wrong and fixes it.'),
 ('spatial','Planning a route','Thinks ahead about movement and direction on a grid.'),
 ('reading_code','Reading code','Reads short programs and predicts what they do.'),
 ('ordering','Logical ordering','Arranges steps or ideas into a logical sequence.');

CREATE TABLE public.game_objectives (
  game_id text NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  objective_code text NOT NULL REFERENCES public.learning_objectives(code),
  PRIMARY KEY (game_id, objective_code)
);
GRANT SELECT ON public.game_objectives TO authenticated;
GRANT ALL ON public.game_objectives TO service_role;
ALTER TABLE public.game_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in families read game objectives" ON public.game_objectives FOR SELECT TO authenticated USING (true);

INSERT INTO public.game_objectives (game_id, objective_code)
SELECT id, CASE level_position WHEN 1 THEN 'sequencing' WHEN 2 THEN 'repetition' WHEN 3 THEN 'decisions' WHEN 4 THEN 'variables' ELSE 'debugging' END FROM public.games
UNION
SELECT id, CASE kind WHEN 'grid' THEN 'spatial' WHEN 'logic' THEN 'reading_code' ELSE 'ordering' END FROM public.games;

CREATE TABLE public.game_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  game_id text NOT NULL REFERENCES public.games(id),
  fun text NOT NULL CHECK (fun IN ('not_for_me','okay','loved')),
  difficulty text NOT NULL CHECK (difficulty IN ('too_easy','just_right','too_hard')),
  hints_used int NOT NULL DEFAULT 0 CHECK (hints_used BETWEEN 0 AND 10),
  was_replay boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_feedback_child_idx ON public.game_feedback(child_id, submitted_at);
GRANT SELECT ON public.game_feedback TO authenticated;
GRANT ALL ON public.game_feedback TO service_role;
ALTER TABLE public.game_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adults read own children's feedback" ON public.game_feedback FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.child_profiles c WHERE c.id = child_id AND c.adult_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.submit_game_feedback(_child_id uuid, _game_id text, _fun text, _difficulty text, _hints_used int)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p game_progress; _id uuid;
BEGIN
  PERFORM _assert_own_child(_child_id);
  SELECT * INTO _p FROM game_progress WHERE child_id = _child_id AND game_id = _game_id;
  IF _p.status IS DISTINCT FROM 'completed' THEN RAISE EXCEPTION 'Solve the game before rating it.'; END IF;
  INSERT INTO game_feedback (child_id, game_id, fun, difficulty, hints_used, was_replay)
  VALUES (_child_id, _game_id, _fun, _difficulty, greatest(0, least(coalesce(_hints_used,0), 10)), _p.replays > 0)
  RETURNING id INTO _id;
  RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.submit_game_feedback(uuid,text,text,text,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_game_feedback(uuid,text,text,text,int) TO authenticated;