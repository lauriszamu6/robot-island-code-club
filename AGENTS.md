<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Levels, games, child profiles and game progress live in the database; screens read them via `src/lib/adventure-data.ts` and routes under `src/routes/_authenticated/`. Progress is written only through the `record_game_attempt` database function, which enforces ownership, level unlocks and one row per child+game.
- Reward plans, savings goals and wallet transactions live in the database as integer cents (`src/lib/wallet-data.ts`); money is written only by `save_reward_plan`, `record_game_attempt` and `redeem_goal`, which enforce ownership, no duplicates and no lowering after earnings.
- All games use three reusable engines (order, grid, logic) driven by each game's stored `config`; `src/lib/game-data.ts` keeps the types and the source the seed migration was generated from.
- Scenery is inline SVG/CSS only, independent of the optional external character API (`src/lib/character-api.ts`), which game logic must never depend on.
- Learning objectives, game objective tags and game feedback live in the database (`src/lib/insights-data.ts`); feedback is written only by `submit_game_feedback` (own child, solved game). Recommendations and adult observations are pure rules in `src/lib/recommend.ts` (tested) over stored data; never infer personality or career fit.
