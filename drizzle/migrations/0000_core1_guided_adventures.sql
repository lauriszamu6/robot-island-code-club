-- Shared educational content (read-only for families)
CREATE TABLE public.levels (
  position int PRIMARY KEY CHECK (position BETWEEN 1 AND 20),
  title text NOT NULL,
  concept text NOT NULL,
  description text NOT NULL,
  accent text NOT NULL DEFAULT 'teal',
  upgrade text NOT NULL DEFAULT ''
);
GRANT SELECT ON public.levels TO authenticated;
GRANT ALL ON public.levels TO service_role;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in families read levels" ON public.levels FOR SELECT TO authenticated USING (true);

CREATE TABLE public.games (
  id text PRIMARY KEY,
  level_position int NOT NULL REFERENCES public.levels(position) ON DELETE CASCADE,
  position int NOT NULL CHECK (position BETWEEN 1 AND 3),
  title text NOT NULL,
  instructions text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('order','grid','logic')),
  base_difficulty int NOT NULL DEFAULT 1,
  config jsonb NOT NULL,
  hints jsonb NOT NULL DEFAULT '[]'::jsonb,
  adult_guide jsonb NOT NULL,
  UNIQUE (level_position, position)
);
GRANT SELECT ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in families read games" ON public.games FOR SELECT TO authenticated USING (true);

CREATE TABLE public.child_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adult_id uuid NOT NULL DEFAULT auth.uid(),
  nickname text NOT NULL CHECK (char_length(btrim(nickname)) BETWEEN 1 AND 30),
  age_range text NOT NULL CHECK (age_range IN ('10-12','13-15')),
  difficulty text NOT NULL CHECK (difficulty IN ('gentle','challenge')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX child_profiles_adult_idx ON public.child_profiles(adult_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_profiles TO authenticated;
GRANT ALL ON public.child_profiles TO service_role;
ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adults read own children" ON public.child_profiles FOR SELECT TO authenticated USING (adult_id = auth.uid());
CREATE POLICY "Adults add own children" ON public.child_profiles FOR INSERT TO authenticated WITH CHECK (adult_id = auth.uid());
CREATE POLICY "Adults edit own children" ON public.child_profiles FOR UPDATE TO authenticated USING (adult_id = auth.uid()) WITH CHECK (adult_id = auth.uid());
CREATE POLICY "Adults remove own children" ON public.child_profiles FOR DELETE TO authenticated USING (adult_id = auth.uid());

CREATE TABLE public.game_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  game_id text NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  attempts int NOT NULL DEFAULT 0,
  replays int NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, game_id)
);
GRANT SELECT ON public.game_progress TO authenticated;
GRANT ALL ON public.game_progress TO service_role;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adults read own children's progress" ON public.game_progress FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.child_profiles c WHERE c.id = child_id AND c.adult_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.record_game_attempt(_child_id uuid, _game_id text, _success boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _level int;
  _prev_open boolean;
  _row public.game_progress;
  _first boolean := false;
  _level_done boolean := false;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM child_profiles WHERE id = _child_id AND adult_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
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
  ELSIF _success THEN
    UPDATE game_progress SET attempts = attempts + 1, replays = replays + 1, updated_at = now() WHERE id = _row.id;
  ELSE
    UPDATE game_progress SET attempts = attempts + 1, updated_at = now() WHERE id = _row.id;
  END IF;
  RETURN jsonb_build_object('first_completion', _first, 'level_completed', CASE WHEN _level_done THEN _level ELSE NULL END);
END $$;
REVOKE ALL ON FUNCTION public.record_game_attempt(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_game_attempt(uuid, text, boolean) TO authenticated;

INSERT INTO public.levels (position, title, concept, description, accent, upgrade) VALUES
(1, 'Level 1: Sequences', 'Sequences', 'Steps in the right order', 'teal', 'Glowing desk lamp'),
(2, 'Level 2: Loops', 'Loops', 'Repeat without rewriting', 'coral', 'Spinning gear clock'),
(3, 'Level 3: Conditions', 'Conditions', 'If this, then that', 'sun', 'Weather-sensing antenna'),
(4, 'Level 4: Variables', 'Variables', 'Boxes that remember', 'lavender', 'Parts counter display'),
(5, 'Level 5: Debugging', 'Debugging', 'Combine ideas, fix bugs', 'mint', 'Golden helper drone');

INSERT INTO public.games (id, level_position, position, title, instructions, kind, base_difficulty, config, hints, adult_guide) VALUES
('1-1', 1, 1, 'Morning Boot-Up', 'Put Bolt''s start-up steps in the order a real robot needs them.', 'order', 1, '{"kind":"order","blocks":["Turn on power","Check battery","Stand up","Wave hello"],"distractor":"Take a nap"}'::jsonb, '["What has to happen before Bolt can move at all?","Power comes first. Waving needs Bolt to be standing."]'::jsonb, '{"concept":"Sequence","explainShort":"A program is a list of steps. Computers do them one by one, top to bottom.","explainDetailed":"Computers follow instructions strictly in order. If a step depends on an earlier one (like needing power before moving), getting the order wrong breaks the program even if every step is correct.","question":"Which step would break everything if it came first?"}'::jsonb),
('1-2', 1, 2, 'Path to the Charger', 'Guide Bolt to the charging pad using Forward and Turn blocks.', 'grid', 1, '{"kind":"grid","cols":5,"rows":5,"start":{"x":0,"y":4,"dir":0},"goal":{"x":3,"y":1},"walls":[{"x":1,"y":3},{"x":2,"y":3},{"x":3,"y":3},{"x":4,"y":2}],"stars":[{"x":0,"y":2},{"x":2,"y":1}],"allow":["F","L","R"],"maxBlocks":{"gentle":10,"challenge":7}}'::jsonb, '["Count the squares Bolt must travel before turning.","Bolt goes up first, then needs to face right."]'::jsonb, '{"concept":"Sequence of moves","explainShort":"Each block moves Bolt once. Turning doesn''t move Bolt, it only changes direction.","explainDetailed":"Turns change the robot''s facing direction without changing its square. Plan the route as segments: how far in one direction, then which way to turn.","question":"Which way is Bolt facing right now? What happens after a Right turn?"}'::jsonb),
('1-3', 1, 3, 'Missing Step', 'Fill in the step that makes this sandwich-bot program work.', 'logic', 1, '{"kind":"logic","success":"Yum! The sandwich-bot builds a complete sandwich.","lines":[{"text":"1. Take two slices of bread"},{"text":"2. Spread butter on one slice"},{"text":"3. ___","blank":{"options":["Add cheese","Eat sandwich","Close the bread","Wash plate"],"answer":"Add cheese","why":{"Eat sandwich":"Eating now means a sandwich with only butter!","Close the bread":"Closing now leaves the next step with nothing to add.","Wash plate":"Washing comes after the meal, not in the middle."}}},{"text":"4. Put the second slice on top"},{"text":"5. Serve"}]}'::jsonb, '["Read the program from top to bottom like a recipe.","The bread is open. What goes between the slices?"]'::jsonb, '{"concept":"Reading a sequence","explainShort":"Reading code top-to-bottom helps spot what is missing.","explainDetailed":"Tracing a program means stepping through it in your head, noting the state after each line. This is how programmers check logic without running it.","question":"What does the sandwich look like after each line?"}'::jsonb),
('2-1', 2, 1, 'Long Corridor', 'Get Bolt to the end of the corridor using only a few blocks.', 'grid', 2, '{"kind":"grid","cols":7,"rows":3,"start":{"x":0,"y":1,"dir":1},"goal":{"x":6,"y":1},"walls":[{"x":0,"y":0},{"x":0,"y":2},{"x":1,"y":0},{"x":1,"y":2},{"x":2,"y":0},{"x":2,"y":2},{"x":3,"y":0},{"x":3,"y":2},{"x":4,"y":0},{"x":4,"y":2},{"x":5,"y":0},{"x":5,"y":2},{"x":6,"y":0},{"x":6,"y":2}],"stars":[{"x":3,"y":1}],"allow":["F","L","R","REP"],"maxBlocks":{"gentle":4,"challenge":2}}'::jsonb, '["You have a block limit. Can one block do the same thing many times?","Count the steps, then put a Forward inside a Repeat block."]'::jsonb, '{"concept":"Repeat loop","explainShort":"A loop repeats the blocks inside it, so you don''t write them again and again.","explainDetailed":"Loops reduce repetition: ''Repeat 6 × Forward'' is shorter, easier to change and less error-prone than six separate Forwards.","question":"How many times does Bolt need to move? How could you write that once?"}'::jsonb),
('2-2', 2, 2, 'Square Dance', 'Build a program where Bolt draws a square: a loop with the right blocks inside.', 'order', 2, '{"kind":"order","blocks":["Put pen down","Repeat 4 times:","    Move 3 steps","    Turn right","Lift pen up"],"distractor":"    Turn left twice"}'::jsonb, '["A square has four equal sides and four corners.","The Repeat goes first; the move and the turn belong inside it."]'::jsonb, '{"concept":"Loop body","explainShort":"The blocks inside a loop happen every time the loop goes round.","explainDetailed":"The loop body is the part that repeats. Deciding what goes inside versus outside the loop is a key skill.","question":"What does Bolt do on every side of the square?"}'::jsonb),
('2-3', 2, 3, 'Gear Factory', 'Set the loop so the factory makes exactly 12 gears.', 'logic', 2, '{"kind":"logic","success":"4 rounds × 3 gears = 12 gears. Perfect batch!","lines":[{"text":"gears = 0"},{"text":"repeat ___ times:","blank":{"options":["4","3","12","6","36"],"answer":"4","why":{"3":"3 rounds × 3 gears = 9 gears. Not quite enough.","6":"6 rounds × 3 = 18 gears. Too many.","12":"12 rounds × 3 = 36 gears. Way too many!","36":"36 rounds makes 108 gears. The factory overflows!"}}},{"text":"    gears = gears + 3"},{"text":"show gears   # we want 12"}]}'::jsonb, '["Each round of the loop makes 3 gears.","Try counting up by 3 until you reach 12."]'::jsonb, '{"concept":"Loop count","explainShort":"The number on a loop says how many times it runs.","explainDetailed":"Total work = work per loop × number of loops. Choosing the loop count is simple multiplication or division.","question":"How many gears after 1 round? After 2?"}'::jsonb),
('3-1', 3, 1, 'Sensor Maze', 'Use the wall sensor so Bolt follows the edge to the goal.', 'grid', 3, '{"kind":"grid","cols":5,"rows":5,"start":{"x":0,"y":4,"dir":0},"goal":{"x":4,"y":3},"walls":[{"x":1,"y":1},{"x":1,"y":2},{"x":1,"y":3},{"x":1,"y":4},{"x":2,"y":1},{"x":2,"y":2},{"x":2,"y":3},{"x":2,"y":4},{"x":3,"y":1},{"x":3,"y":2},{"x":3,"y":3},{"x":3,"y":4},{"x":4,"y":4}],"stars":[{"x":0,"y":0},{"x":4,"y":0}],"allow":["F","L","R","REP","IF"],"maxBlocks":{"gentle":9,"challenge":3}}'::jsonb, '["The ''If blocked'' block turns only when something is in front.","Put an ''If blocked, turn right'' inside a Repeat with a big number."]'::jsonb, '{"concept":"If / else","explainShort":"A condition checks something and picks what to do: if blocked turn, else go forward.","explainDetailed":"Conditions let one program react to different situations. Combined with a loop, a single rule can solve a whole maze: the robot decides at every step.","question":"What should Bolt do when a wall is ahead? And when it''s clear?"}'::jsonb),
('3-2', 3, 2, 'Low Battery Alarm', 'Make Bolt go charge only when the battery is below 20.', 'logic', 3, '{"kind":"logic","success":"Bolt charges at 10%, keeps working at 80%. Smart!","lines":[{"text":"if battery ___ 20:","blank":{"options":["<",">","==",">="],"answer":"<","why":{">":"With ''>'', Bolt would charge when the battery is full and run out when it''s low!","==":"With ''=='', Bolt only charges at exactly 20. At 19 it keeps working until empty.",">=":"With ''>='', a full battery triggers charging. That''s backwards."}}},{"text":"    go to charger"},{"text":"else:"},{"text":"    keep building"}]}'::jsonb, '["Bolt should keep working when the battery is high.","Which comparison is true for 10 but false for 80?"]'::jsonb, '{"concept":"Comparison","explainShort":"Conditions use comparisons like ''less than'' to decide yes or no.","explainDetailed":"A comparison returns true or false. ''battery < 20'' is true for 5 or 19 but false for 20 or 80. Picking the right operator matters.","question":"If the battery is 80, should Bolt charge?"}'::jsonb),
('3-3', 3, 3, 'Umbrella Bot', 'Arrange the lines so Bolt opens an umbrella only when it rains.', 'order', 3, '{"kind":"order","blocks":["Look at the sky","If it is raining:","    Open umbrella","Otherwise:","    Wear sunglasses","Walk outside"],"distractor":"    Open umbrella indoors"}'::jsonb, '["The ''if'' line asks the question. What comes right under it?","''Otherwise'' belongs between the two actions."]'::jsonb, '{"concept":"If / else structure","explainShort":"If something is true, do one thing. Otherwise, do another.","explainDetailed":"An if/else has two branches, but only one runs. Indented lines belong to the branch above them.","question":"When it''s sunny, which line runs?"}'::jsonb),
('4-1', 4, 1, 'Score Keeper', 'Work out what the score variable holds at the end.', 'logic', 4, '{"kind":"logic","success":"0 → 5 → 15 → 30. You traced it perfectly!","lines":[{"text":"score = 0"},{"text":"score = score + 5"},{"text":"score = score + 10"},{"text":"score = score * 2"},{"text":"show score  →  ___","blank":{"options":["30","17","15","20","25"],"answer":"30","why":{"15":"15 is the value before the last line. Keep going!","17":"Check the last line: it multiplies by 2, not adds 2.","20":"Try writing the value after every line.","25":"Close! Recheck the order: add 5, add 10, then double."}}}]}'::jsonb, '["A variable is a box. Each line can change what''s inside.","Write the value after each line: 0, then 5, then…"]'::jsonb, '{"concept":"Variables change","explainShort":"A variable is a named box that holds a value. Code can change the value.","explainDetailed":"Assigning ''score = score + 5'' reads the current value, adds 5, then stores the result back. Tracing values line by line avoids mistakes.","question":"What''s in the ''score'' box after the second line?"}'::jsonb),
('4-2', 4, 2, 'Parts Counter', 'Order the steps so Bolt counts how many bolts are in the crate.', 'order', 4, '{"kind":"order","blocks":["count = 0","For each bolt in crate:","    count = count + 1","Show count"],"distractor":"    count = 0"}'::jsonb, '["The counter needs a starting value before counting.","Start at zero, loop through each bolt, add one, then show it."]'::jsonb, '{"concept":"Counter variable","explainShort":"A counter starts at 0 and goes up by 1 each time.","explainDetailed":"Counters are a common pattern: initialise once before a loop, update inside the loop, use the result after the loop.","question":"What would happen if ''count = 0'' was inside the loop?"}'::jsonb),
('4-3', 4, 3, 'Robot Recipe', 'Fill the variables so Bolt builds 3 robots with 2 wheels each.', 'logic', 4, '{"kind":"logic","success":"robots = 3, total = 6 wheels. Assembly line running!","lines":[{"text":"robots = ___","blank":{"options":["3","2","6","1"],"answer":"3","why":{"1":"We want 3 robots, not 1.","2":"That''s the wheels per robot, not the number of robots.","6":"6 is the total wheels. How many robots do we want?"}}},{"text":"wheels_each = 2"},{"text":"total = robots ___ wheels_each","blank":{"options":["*","+","-","/"],"answer":"*","why":{"+":"3 + 2 = 5 wheels. One robot would be missing a wheel!","-":"3 - 2 = 1 wheel. Not enough!","/":"Dividing gives 1.5 wheels. Robots can''t use half a wheel!"}}},{"text":"order total wheels"}]}'::jsonb, '["Total wheels = robots × wheels per robot.","One blank is how many robots; the other is how many wheels you need."]'::jsonb, '{"concept":"Using variables together","explainShort":"Variables can be combined to calculate new values.","explainDetailed":"Naming values (robots, wheels_each) makes code readable and easy to change: update one variable and every calculation updates.","question":"If we wanted 4 robots, which line would you change?"}'::jsonb),
('5-1', 5, 1, 'Broken Delivery', 'This program crashes. Find the bug and fix it so Bolt delivers the package.', 'grid', 5, '{"kind":"grid","cols":5,"rows":5,"start":{"x":0,"y":0,"dir":1},"goal":{"x":4,"y":4},"walls":[{"x":1,"y":1},{"x":2,"y":1},{"x":3,"y":1},{"x":1,"y":3},{"x":2,"y":3},{"x":3,"y":3}],"stars":[{"x":2,"y":0},{"x":4,"y":2}],"allow":["F","L","R","REP","IF"],"maxBlocks":{"gentle":8,"challenge":5},"initial":[{"t":"REP","n":4,"body":[{"t":"F"}]},{"t":"L"},{"t":"REP","n":4,"body":[{"t":"F"}]}]}'::jsonb, '["Press Run and watch where Bolt goes wrong.","One turn goes the wrong way. Swap it."]'::jsonb, '{"concept":"Debugging","explainShort":"A bug is a mistake in code. Run it, watch, and find the first step that goes wrong.","explainDetailed":"Good debugging: reproduce the problem, find the first place behaviour differs from what you expected, change one thing, then test again.","question":"At which block does Bolt first do something unexpected?"}'::jsonb),
('5-2', 5, 2, 'Countdown Bug', 'The launch countdown never stops! Fix the line that causes it.', 'logic', 5, '{"kind":"logic","success":"10, 9, 8… 1, LIFT OFF! The rocket launches.","lines":[{"text":"n = 10"},{"text":"while n > 0:"},{"text":"    show n"},{"text":"    n = ___","blank":{"options":["n - 1","n + 1","n","10"],"answer":"n - 1","why":{"10":"n keeps resetting to 10. Infinite countdown!","n + 1":"n grows: 10, 11, 12… it''s never below 1, so the loop never stops.","n":"n never changes, so ''n > 0'' stays true forever."}}},{"text":"show \"LIFT OFF!\""}]}'::jsonb, '["Trace the value of ''n'' through a few loops.","For the countdown to finish, n must get smaller each time."]'::jsonb, '{"concept":"Loop + condition bug","explainShort":"Some bugs make a loop run forever because the stopping condition is never reached.","explainDetailed":"An infinite loop happens when the variable checked in the condition never changes in the right direction. Fixing it means making the loop move toward its end.","question":"Does n get closer to 0 or further away?"}'::jsonb),
('5-3', 5, 3, 'Recycling Sorter', 'Assemble the sorter: loop through items, check each, and sort it.', 'order', 5, '{"kind":"order","blocks":["metal = 0","For each item on belt:","    If item is metal:","        Put in metal bin","        metal = metal + 1","    Otherwise:","        Put in paper bin","Show metal"],"distractor":"metal = 0  (inside loop)"}'::jsonb, '["You''ll need a loop, a condition, and a counter working together.","Set up the counter first; the ''if'' check goes inside the loop."]'::jsonb, '{"concept":"Combining concepts","explainShort":"Real programs mix sequences, loops, conditions and variables.","explainDetailed":"Combining concepts is about structure: what happens once (setup), what repeats (loop), and what depends on a check (condition). Indentation shows the structure.","question":"Which lines should happen for every single item?"}'::jsonb);