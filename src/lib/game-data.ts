// All 15 games, built from three reusable engines: "order", "grid", "logic".
export type Difficulty = "gentle" | "challenge";
export type AgeBand = "8-10" | "11-12";
export type GameKind = "order" | "grid" | "logic";

export type Guide = {
  concept: string;
  explainShort: string; // 8–10
  explainDetailed: string; // 11–12
  question: string;
};

export type Pos = { x: number; y: number };
export type GridOp = "F" | "L" | "R" | "REP" | "IF";
export type SimpleBlock = { t: "F" } | { t: "L" } | { t: "R" } | { t: "IF"; turn: "L" | "R" };
export type Block = SimpleBlock | { t: "REP"; n: number; body: SimpleBlock[] };

export type OrderDef = { kind: "order"; blocks: string[]; distractor: string };
export type GridDef = {
  kind: "grid";
  cols: number;
  rows: number;
  start: Pos & { dir: 0 | 1 | 2 | 3 }; // 0=N 1=E 2=S 3=W
  goal: Pos;
  walls: Pos[];
  stars: Pos[]; // required only in challenge mode
  allow: GridOp[];
  maxBlocks: Record<Difficulty, number>;
  initial?: Block[];
};
export type LogicLine = {
  text: string; // "___" marks the blank
  blank?: { options: string[]; answer: string; why?: Record<string, string> };
};
export type LogicDef = { kind: "logic"; lines: LogicLine[]; success: string };

export type Game = {
  id: string;
  level: number;
  title: string;
  goal: string;
  hints: [string, string];
  guide: Guide;
  def: OrderDef | GridDef | LogicDef;
};

export type Level = {
  n: number;
  concept: string;
  tagline: string;
  accent: "teal" | "coral" | "sun" | "lavender" | "mint";
  upgrade: string;
};

export const LEVELS: Level[] = [
  { n: 1, concept: "Sequences", tagline: "Steps in the right order", accent: "teal", upgrade: "Glowing desk lamp" },
  { n: 2, concept: "Loops", tagline: "Repeat without rewriting", accent: "coral", upgrade: "Spinning gear clock" },
  { n: 3, concept: "Conditions", tagline: "If this, then that", accent: "sun", upgrade: "Weather-sensing antenna" },
  { n: 4, concept: "Variables", tagline: "Boxes that remember", accent: "lavender", upgrade: "Parts counter display" },
  { n: 5, concept: "Debugging", tagline: "Combine ideas, fix bugs", accent: "mint", upgrade: "Golden helper drone" },
];

export const KIND_LABEL: Record<GameKind, string> = {
  order: "Command ordering",
  grid: "Robot navigation",
  logic: "Logic puzzle",
};

export const GAMES: Game[] = [
  // ---------- Level 1: Sequences ----------
  {
    id: "1-1", level: 1, title: "Morning Boot-Up",
    goal: "Put Bolt's start-up steps in the order a real robot needs them.",
    hints: ["What has to happen before Bolt can move at all?", "Power comes first. Waving needs Bolt to be standing."],
    guide: {
      concept: "Sequence",
      explainShort: "A program is a list of steps. Computers do them one by one, top to bottom.",
      explainDetailed: "Computers follow instructions strictly in order. If a step depends on an earlier one (like needing power before moving), getting the order wrong breaks the program even if every step is correct.",
      question: "Which step would break everything if it came first?",
    },
    def: { kind: "order", blocks: ["Turn on power", "Check battery", "Stand up", "Wave hello"], distractor: "Take a nap" },
  },
  {
    id: "1-2", level: 1, title: "Path to the Charger",
    goal: "Guide Bolt to the charging pad using Forward and Turn blocks.",
    hints: ["Count the squares Bolt must travel before turning.", "Bolt goes up first, then needs to face right."],
    guide: {
      concept: "Sequence of moves",
      explainShort: "Each block moves Bolt once. Turning doesn't move Bolt, it only changes direction.",
      explainDetailed: "Turns change the robot's facing direction without changing its square. Plan the route as segments: how far in one direction, then which way to turn.",
      question: "Which way is Bolt facing right now? What happens after a Right turn?",
    },
    def: {
      kind: "grid", cols: 5, rows: 5, start: { x: 0, y: 4, dir: 0 }, goal: { x: 3, y: 1 },
      walls: [{ x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 2 }],
      stars: [{ x: 0, y: 2 }, { x: 2, y: 1 }], allow: ["F", "L", "R"],
      maxBlocks: { gentle: 10, challenge: 7 },
    },
  },
  {
    id: "1-3", level: 1, title: "Missing Step",
    goal: "Fill in the step that makes this sandwich-bot program work.",
    hints: ["Read the program from top to bottom like a recipe.", "The bread is open. What goes between the slices?"],
    guide: {
      concept: "Reading a sequence",
      explainShort: "Reading code top-to-bottom helps spot what is missing.",
      explainDetailed: "Tracing a program means stepping through it in your head, noting the state after each line. This is how programmers check logic without running it.",
      question: "What does the sandwich look like after each line?",
    },
    def: {
      kind: "logic", success: "Yum! The sandwich-bot builds a complete sandwich.",
      lines: [
        { text: "1. Take two slices of bread" },
        { text: "2. Spread butter on one slice" },
        { text: "3. ___", blank: { options: ["Add cheese", "Eat sandwich", "Close the bread", "Wash plate"], answer: "Add cheese", why: { "Eat sandwich": "Eating now means a sandwich with only butter!", "Close the bread": "Closing now leaves the next step with nothing to add.", "Wash plate": "Washing comes after the meal, not in the middle." } } },
        { text: "4. Put the second slice on top" },
        { text: "5. Serve" },
      ],
    },
  },
  // ---------- Level 2: Loops ----------
  {
    id: "2-1", level: 2, title: "Long Corridor",
    goal: "Get Bolt to the end of the corridor using only a few blocks.",
    hints: ["You have a block limit. Can one block do the same thing many times?", "Count the steps, then put a Forward inside a Repeat block."],
    guide: {
      concept: "Repeat loop",
      explainShort: "A loop repeats the blocks inside it, so you don't write them again and again.",
      explainDetailed: "Loops reduce repetition: 'Repeat 6 × Forward' is shorter, easier to change and less error-prone than six separate Forwards.",
      question: "How many times does Bolt need to move? How could you write that once?",
    },
    def: {
      kind: "grid", cols: 7, rows: 3, start: { x: 0, y: 1, dir: 1 }, goal: { x: 6, y: 1 },
      walls: [0, 1, 2, 3, 4, 5, 6].flatMap((x) => [{ x, y: 0 }, { x, y: 2 }]),
      stars: [{ x: 3, y: 1 }], allow: ["F", "L", "R", "REP"],
      maxBlocks: { gentle: 4, challenge: 2 },
    },
  },
  {
    id: "2-2", level: 2, title: "Square Dance",
    goal: "Build a program where Bolt draws a square: a loop with the right blocks inside.",
    hints: ["A square has four equal sides and four corners.", "The Repeat goes first; the move and the turn belong inside it."],
    guide: {
      concept: "Loop body",
      explainShort: "The blocks inside a loop happen every time the loop goes round.",
      explainDetailed: "The loop body is the part that repeats. Deciding what goes inside versus outside the loop is a key skill.",
      question: "What does Bolt do on every side of the square?",
    },
    def: { kind: "order", blocks: ["Put pen down", "Repeat 4 times:", "    Move 3 steps", "    Turn right", "Lift pen up"], distractor: "    Turn left twice" },
  },
  {
    id: "2-3", level: 2, title: "Gear Factory",
    goal: "Set the loop so the factory makes exactly 12 gears.",
    hints: ["Each round of the loop makes 3 gears.", "Try counting up by 3 until you reach 12."],
    guide: {
      concept: "Loop count",
      explainShort: "The number on a loop says how many times it runs.",
      explainDetailed: "Total work = work per loop × number of loops. Choosing the loop count is simple multiplication or division.",
      question: "How many gears after 1 round? After 2?",
    },
    def: {
      kind: "logic", success: "4 rounds × 3 gears = 12 gears. Perfect batch!",
      lines: [
        { text: "gears = 0" },
        { text: "repeat ___ times:", blank: { options: ["4", "3", "12", "6", "36"], answer: "4", why: { "3": "3 rounds × 3 gears = 9 gears. Not quite enough.", "12": "12 rounds × 3 = 36 gears. Way too many!", "6": "6 rounds × 3 = 18 gears. Too many.", "36": "36 rounds makes 108 gears. The factory overflows!" } } },
        { text: "    gears = gears + 3" },
        { text: "show gears   # we want 12" },
      ],
    },
  },
  // ---------- Level 3: Conditions ----------
  {
    id: "3-1", level: 3, title: "Sensor Maze",
    goal: "Use the wall sensor so Bolt follows the edge to the goal.",
    hints: ["The 'If blocked' block turns only when something is in front.", "Put an 'If blocked, turn right' inside a Repeat with a big number."],
    guide: {
      concept: "If / else",
      explainShort: "A condition checks something and picks what to do: if blocked turn, else go forward.",
      explainDetailed: "Conditions let one program react to different situations. Combined with a loop, a single rule can solve a whole maze: the robot decides at every step.",
      question: "What should Bolt do when a wall is ahead? And when it's clear?",
    },
    def: {
      kind: "grid", cols: 5, rows: 5, start: { x: 0, y: 4, dir: 0 }, goal: { x: 4, y: 3 },
      walls: [1, 2, 3].flatMap((x) => [1, 2, 3, 4].map((y) => ({ x, y }))).concat([{ x: 4, y: 4 }]),
      stars: [{ x: 0, y: 0 }, { x: 4, y: 0 }], allow: ["F", "L", "R", "REP", "IF"],
      maxBlocks: { gentle: 9, challenge: 3 },
    },
  },
  {
    id: "3-2", level: 3, title: "Low Battery Alarm",
    goal: "Make Bolt go charge only when the battery is below 20.",
    hints: ["Bolt should keep working when the battery is high.", "Which comparison is true for 10 but false for 80?"],
    guide: {
      concept: "Comparison",
      explainShort: "Conditions use comparisons like 'less than' to decide yes or no.",
      explainDetailed: "A comparison returns true or false. 'battery < 20' is true for 5 or 19 but false for 20 or 80. Picking the right operator matters.",
      question: "If the battery is 80, should Bolt charge?",
    },
    def: {
      kind: "logic", success: "Bolt charges at 10%, keeps working at 80%. Smart!",
      lines: [
        { text: "if battery ___ 20:", blank: { options: ["<", ">", "==", ">="], answer: "<", why: { ">": "With '>', Bolt would charge when the battery is full and run out when it's low!", "==": "With '==', Bolt only charges at exactly 20. At 19 it keeps working until empty.", ">=": "With '>=', a full battery triggers charging. That's backwards." } } },
        { text: "    go to charger" },
        { text: "else:" },
        { text: "    keep building" },
      ],
    },
  },
  {
    id: "3-3", level: 3, title: "Umbrella Bot",
    goal: "Arrange the lines so Bolt opens an umbrella only when it rains.",
    hints: ["The 'if' line asks the question. What comes right under it?", "'Otherwise' belongs between the two actions."],
    guide: {
      concept: "If / else structure",
      explainShort: "If something is true, do one thing. Otherwise, do another.",
      explainDetailed: "An if/else has two branches, but only one runs. Indented lines belong to the branch above them.",
      question: "When it's sunny, which line runs?",
    },
    def: { kind: "order", blocks: ["Look at the sky", "If it is raining:", "    Open umbrella", "Otherwise:", "    Wear sunglasses", "Walk outside"], distractor: "    Open umbrella indoors" },
  },
  // ---------- Level 4: Variables ----------
  {
    id: "4-1", level: 4, title: "Score Keeper",
    goal: "Work out what the score variable holds at the end.",
    hints: ["A variable is a box. Each line can change what's inside.", "Write the value after each line: 0, then 5, then…"],
    guide: {
      concept: "Variables change",
      explainShort: "A variable is a named box that holds a value. Code can change the value.",
      explainDetailed: "Assigning 'score = score + 5' reads the current value, adds 5, then stores the result back. Tracing values line by line avoids mistakes.",
      question: "What's in the 'score' box after the second line?",
    },
    def: {
      kind: "logic", success: "0 → 5 → 15 → 30. You traced it perfectly!",
      lines: [
        { text: "score = 0" },
        { text: "score = score + 5" },
        { text: "score = score + 10" },
        { text: "score = score * 2" },
        { text: "show score  →  ___", blank: { options: ["30", "17", "15", "20", "25"], answer: "30", why: { "17": "Check the last line: it multiplies by 2, not adds 2.", "15": "15 is the value before the last line. Keep going!", "20": "Try writing the value after every line.", "25": "Close! Recheck the order: add 5, add 10, then double." } } },
      ],
    },
  },
  {
    id: "4-2", level: 4, title: "Parts Counter",
    goal: "Order the steps so Bolt counts how many bolts are in the crate.",
    hints: ["The counter needs a starting value before counting.", "Start at zero, loop through each bolt, add one, then show it."],
    guide: {
      concept: "Counter variable",
      explainShort: "A counter starts at 0 and goes up by 1 each time.",
      explainDetailed: "Counters are a common pattern: initialise once before a loop, update inside the loop, use the result after the loop.",
      question: "What would happen if 'count = 0' was inside the loop?",
    },
    def: { kind: "order", blocks: ["count = 0", "For each bolt in crate:", "    count = count + 1", "Show count"], distractor: "    count = 0" },
  },
  {
    id: "4-3", level: 4, title: "Robot Recipe",
    goal: "Fill the variables so Bolt builds 3 robots with 2 wheels each.",
    hints: ["Total wheels = robots × wheels per robot.", "One blank is how many robots; the other is how many wheels you need."],
    guide: {
      concept: "Using variables together",
      explainShort: "Variables can be combined to calculate new values.",
      explainDetailed: "Naming values (robots, wheels_each) makes code readable and easy to change: update one variable and every calculation updates.",
      question: "If we wanted 4 robots, which line would you change?",
    },
    def: {
      kind: "logic", success: "robots = 3, total = 6 wheels. Assembly line running!",
      lines: [
        { text: "robots = ___", blank: { options: ["3", "2", "6", "1"], answer: "3", why: { "2": "That's the wheels per robot, not the number of robots.", "6": "6 is the total wheels. How many robots do we want?", "1": "We want 3 robots, not 1." } } },
        { text: "wheels_each = 2" },
        { text: "total = robots ___ wheels_each", blank: { options: ["*", "+", "-", "/"], answer: "*", why: { "+": "3 + 2 = 5 wheels. One robot would be missing a wheel!", "-": "3 - 2 = 1 wheel. Not enough!", "/": "Dividing gives 1.5 wheels. Robots can't use half a wheel!" } } },
        { text: "order total wheels" },
      ],
    },
  },
  // ---------- Level 5: Debugging ----------
  {
    id: "5-1", level: 5, title: "Broken Delivery",
    goal: "This program crashes. Find the bug and fix it so Bolt delivers the package.",
    hints: ["Press Run and watch where Bolt goes wrong.", "One turn goes the wrong way. Swap it."],
    guide: {
      concept: "Debugging",
      explainShort: "A bug is a mistake in code. Run it, watch, and find the first step that goes wrong.",
      explainDetailed: "Good debugging: reproduce the problem, find the first place behaviour differs from what you expected, change one thing, then test again.",
      question: "At which block does Bolt first do something unexpected?",
    },
    def: {
      kind: "grid", cols: 5, rows: 5, start: { x: 0, y: 0, dir: 1 }, goal: { x: 4, y: 4 },
      walls: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
      stars: [{ x: 2, y: 0 }, { x: 4, y: 2 }], allow: ["F", "L", "R", "REP", "IF"],
      maxBlocks: { gentle: 8, challenge: 5 },
      initial: [{ t: "REP", n: 4, body: [{ t: "F" }] }, { t: "L" }, { t: "REP", n: 4, body: [{ t: "F" }] }],
    },
  },
  {
    id: "5-2", level: 5, title: "Countdown Bug",
    goal: "The launch countdown never stops! Fix the line that causes it.",
    hints: ["Trace the value of 'n' through a few loops.", "For the countdown to finish, n must get smaller each time."],
    guide: {
      concept: "Loop + condition bug",
      explainShort: "Some bugs make a loop run forever because the stopping condition is never reached.",
      explainDetailed: "An infinite loop happens when the variable checked in the condition never changes in the right direction. Fixing it means making the loop move toward its end.",
      question: "Does n get closer to 0 or further away?",
    },
    def: {
      kind: "logic", success: "10, 9, 8… 1, LIFT OFF! The rocket launches.",
      lines: [
        { text: "n = 10" },
        { text: "while n > 0:" },
        { text: "    show n" },
        { text: "    n = ___", blank: { options: ["n - 1", "n + 1", "n", "10"], answer: "n - 1", why: { "n + 1": "n grows: 10, 11, 12… it's never below 1, so the loop never stops.", "n": "n never changes, so 'n > 0' stays true forever.", "10": "n keeps resetting to 10. Infinite countdown!" } } },
        { text: "show \"LIFT OFF!\"" },
      ],
    },
  },
  {
    id: "5-3", level: 5, title: "Recycling Sorter",
    goal: "Assemble the sorter: loop through items, check each, and sort it.",
    hints: ["You'll need a loop, a condition, and a counter working together.", "Set up the counter first; the 'if' check goes inside the loop."],
    guide: {
      concept: "Combining concepts",
      explainShort: "Real programs mix sequences, loops, conditions and variables.",
      explainDetailed: "Combining concepts is about structure: what happens once (setup), what repeats (loop), and what depends on a check (condition). Indentation shows the structure.",
      question: "Which lines should happen for every single item?",
    },
    def: { kind: "order", blocks: ["metal = 0", "For each item on belt:", "    If item is metal:", "        Put in metal bin", "        metal = metal + 1", "    Otherwise:", "        Put in paper bin", "Show metal"], distractor: "metal = 0  (inside loop)" },
  },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
export const gamesForLevel = (n: number) => GAMES.filter((g) => g.level === n);
export const levelByN = (n: number) => LEVELS.find((l) => l.n === n);
